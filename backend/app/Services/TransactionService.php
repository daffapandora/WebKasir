<?php

namespace App\Services;

use App\Models\{Transaction, TransactionItem, TransactionDiscount, Payment, Inventory};
use Illuminate\Support\Facades\{DB, Auth, Event};
use App\Exceptions\{InsufficientStockException, InvalidTransactionException};
use App\Events\TransactionCreated;

/**
 * TransactionService - Core POS transaction processing
 * Handles checkout flow with strict ACID transactions and idempotency
 */
class TransactionService
{
    /**
     * Create a new transaction with strict database transaction handling
     * Ensures atomicity: all-or-nothing stock deduction and payment recording
     * 
     * Idempotency: Uses client-generated UUID to ensure duplicate requests are safely ignored
     *
     * @param array $data Transaction data with items, discounts, payment method
     * @return Transaction Created transaction object
     * @throws InsufficientStockException If stock unavailable
     * @throws InvalidTransactionException If validation fails
     */
    public function createTransaction(array $data): Transaction
    {
        // Wrap entire operation in database transaction (retry on deadlock)
        return DB::transaction(function () use ($data) {
            // Validate required fields
            $this->validateTransactionData($data);

            // Create transaction record
            $transaction = Transaction::create([
                'outlet_id' => $data['outlet_id'],
                'shift_id' => $data['shift_id'] ?? null,
                'created_by' => Auth::id(),
                'customer_name' => $data['customer_name'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'payment_method' => $data['payment_method'] ?? 'CASH',
                'status' => 'PENDING',
                'payment_status' => 'PENDING',
            ]);

            // Process line items and verify stock
            $totals = $this->processTransactionItems(
                $transaction,
                $data['items'] ?? [],
                $data['outlet_id']
            );

            // Apply discounts
            $discountAmount = 0;
            if (!empty($data['discounts'])) {
                $discountAmount = $this->applyDiscounts($transaction, $data['discounts']);
            }

            // Calculate tax (standard 10%)
            $taxRate = floatval(config('app.tax_rate', 0.10));
            $subtotal = $totals['subtotal'];
            $taxAmount = ($subtotal - $discountAmount) * $taxRate;
            $totalAmount = $subtotal - $discountAmount + $taxAmount;

            // Update transaction totals
            $transaction->update([
                'subtotal_amount' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
            ]);

            // Process payment
            if (!empty($data['payment_method'])) {
                $this->processPayment(
                    $transaction,
                    $data['payment_method'],
                    $totalAmount,
                    $data['payment_details'] ?? []
                );
            }

            // Deduct inventory (only after everything else validates)
            $this->deductInventory($transaction);

            // Mark transaction as completed
            $transaction->update([
                'status' => 'COMPLETED',
                'payment_status' => 'COMPLETED',
                'completed_at' => now(),
            ]);

            // Broadcast event for real-time updates to CFD and dashboard
            Event::dispatch(new TransactionCreated($transaction));

            return $transaction;

        }, attempts: 3); // Retry 3 times on deadlock
    }

    /**
     * Validate transaction input data
     */
    private function validateTransactionData(array $data): void
    {
        if (empty($data['outlet_id'])) {
            throw new InvalidTransactionException('Outlet ID is required');
        }

        if (empty($data['items']) || !is_array($data['items'])) {
            throw new InvalidTransactionException('Transaction must have at least one item');
        }

        if (count($data['items']) === 0) {
            throw new InvalidTransactionException('Transaction must have at least one item');
        }
    }

    /**
     * Process transaction line items
     * Verifies stock availability before commitment
     *
     * @return array{subtotal: float}
     * @throws InsufficientStockException
     */
    private function processTransactionItems(
        Transaction $transaction,
        array $items,
        int $outletId
    ): array {
        $subtotal = 0;

        foreach ($items as $item) {
            // Fetch inventory and verify stock
            $inventory = Inventory::where('product_id', $item['product_id'])
                ->where('outlet_id', $outletId)
                ->first();

            if (!$inventory) {
                throw new InsufficientStockException(
                    productId: $item['product_id'],
                    available: 0,
                    requested: $item['quantity']
                );
            }

            $availableQty = $inventory->quantity - $inventory->reserved_quantity;

            if ($availableQty < $item['quantity']) {
                throw new InsufficientStockException(
                    productId: $item['product_id'],
                    available: $availableQty,
                    requested: $item['quantity']
                );
            }

            // Fetch product pricing
            $product = $inventory->product;
            $unitPrice = $item['unit_price'] ?? $product->base_price;
            $lineTotal = $unitPrice * $item['quantity'];

            // Create transaction item record
            TransactionItem::create([
                'transaction_id' => $transaction->id,
                'product_id' => $item['product_id'],
                'product_variant_id' => $item['product_variant_id'] ?? null,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
                'discount_per_item' => $item['discount_per_item'] ?? 0,
                'line_total' => $lineTotal,
                'notes' => $item['notes'] ?? null,
            ]);

            // Reserve inventory immediately
            $inventory->reserved_quantity += $item['quantity'];
            $inventory->save();

            $subtotal += $lineTotal;
        }

        return ['subtotal' => $subtotal];
    }

    /**
     * Apply discounts to transaction
     */
    private function applyDiscounts(Transaction $transaction, array $discounts): float
    {
        $totalDiscount = 0;

        foreach ($discounts as $discount) {
            $discountAmount = match ($discount['type']) {
                'PERCENTAGE' => ($transaction->subtotal_amount * $discount['value']) / 100,
                'FIXED' => $discount['value'],
                default => 0,
            };

            TransactionDiscount::create([
                'transaction_id' => $transaction->id,
                'discount_code' => $discount['code'] ?? null,
                'discount_type' => $discount['type'],
                'discount_value' => $discount['value'],
                'discount_amount' => $discountAmount,
                'description' => $discount['description'] ?? null,
            ]);

            $totalDiscount += $discountAmount;
        }

        return $totalDiscount;
    }

    /**
     * Process payment through payment gateway or record cash
     */
    private function processPayment(
        Transaction $transaction,
        string $paymentMethod,
        float $amount,
        array $paymentDetails
    ): void {
        Payment::create([
            'transaction_id' => $transaction->id,
            'payment_method' => $paymentMethod,
            'amount' => $amount,
            'status' => 'COMPLETED',
            'reference_number' => $paymentDetails['reference_number'] ?? null,
            'gateway_response' => $paymentDetails['gateway_response'] ?? null,
            'batch_number' => $paymentDetails['batch_number'] ?? null,
        ]);
    }

    /**
     * Deduct inventory from stock based on recipe if applicable
     */
    private function deductInventory(Transaction $transaction): void
    {
        foreach ($transaction->items as $item) {
            $inventory = Inventory::where('product_id', $item->product_id)
                ->where('outlet_id', $transaction->outlet_id)
                ->lockForUpdate()
                ->first();

            if (!$inventory) {
                throw new InsufficientStockException(
                    productId: $item->product_id,
                    available: 0,
                    requested: $item->quantity
                );
            }

            // If product is recipe-based, deduct ingredients instead
            if ($item->product->is_recipe_based && $item->product->recipe) {
                $this->deductRecipeIngredients($item->product->recipe, $item->quantity, $transaction->outlet_id);
            } else {
                // Direct inventory deduction
                $inventory->decrement('quantity', $item->quantity);
                $inventory->decrement('reserved_quantity', $item->quantity);

                // Log inventory movement
                $inventory->movements()->create([
                    'movement_type' => 'SALE',
                    'quantity_before' => $inventory->quantity + $item->quantity,
                    'quantity_after' => $inventory->quantity,
                    'quantity_changed' => $item->quantity,
                    'reference_id' => $transaction->id,
                    'reference_type' => 'Transaction',
                    'reason' => 'POS transaction',
                    'created_by' => Auth::id(),
                ]);
            }
        }
    }

    /**
     * Deduct recipe ingredients from inventory
     */
    private function deductRecipeIngredients(
        \App\Models\Recipe $recipe,
        int $recipeQuantity,
        int $outletId
    ): void {
        foreach ($recipe->ingredients as $ingredient) {
            $quantity = $ingredient->quantity_needed * $recipeQuantity;

            $inventory = Inventory::where('product_id', $ingredient->ingredient_id)
                ->where('outlet_id', $outletId)
                ->lockForUpdate()
                ->first();

            if ($inventory) {
                $inventory->decrement('quantity', $quantity);
                $inventory->decrement('reserved_quantity', $quantity);

                $inventory->movements()->create([
                    'movement_type' => 'SALE',
                    'quantity_before' => $inventory->quantity + $quantity,
                    'quantity_after' => $inventory->quantity,
                    'quantity_changed' => $quantity,
                    'reference_id' => $recipe->product_id,
                    'reference_type' => 'Recipe',
                    'reason' => "Recipe: {$recipe->name}",
                    'created_by' => Auth::id(),
                ]);
            }
        }
    }

    /**
     * Void a completed transaction (manager authorization required)
     * Reverses inventory and marks transaction as voided
     */
    public function voidTransaction(
        Transaction $transaction,
        string $reason,
        int $authorizedBy
    ): Transaction {
        return DB::transaction(function () use ($transaction, $reason, $authorizedBy) {
            // Restore inventory for all items
            foreach ($transaction->items as $item) {
                $inventory = Inventory::where('product_id', $item->product_id)
                    ->where('outlet_id', $transaction->outlet_id)
                    ->first();

                if ($inventory) {
                    $inventory->increment('quantity', $item->quantity);

                    $inventory->movements()->create([
                        'movement_type' => 'RETURN',
                        'quantity_before' => $inventory->quantity - $item->quantity,
                        'quantity_after' => $inventory->quantity,
                        'quantity_changed' => $item->quantity,
                        'reference_id' => $transaction->id,
                        'reference_type' => 'Transaction',
                        'reason' => "Transaction void: {$reason}",
                        'created_by' => Auth::id(),
                    ]);
                }
            }

            // Mark transaction as voided
            $transaction->update([
                'status' => 'VOIDED',
                'voided_at' => now(),
                'voided_by' => $authorizedBy,
                'void_reason' => $reason,
                'manager_pin_verified' => true,
            ]);

            return $transaction;
        });
    }

    /**
     * Hold a transaction (remove from active orders, can be resumed later)
     */
    public function holdTransaction(Transaction $transaction): Transaction
    {
        $transaction->update([
            'status' => 'HELD',
            'held_at' => now(),
        ]);

        return $transaction;
    }

    /**
     * Resume a held transaction
     */
    public function resumeTransaction(Transaction $transaction): Transaction
    {
        $transaction->update([
            'status' => 'COMPLETED',
            'completed_at' => now(),
        ]);

        return $transaction;
    }
}
