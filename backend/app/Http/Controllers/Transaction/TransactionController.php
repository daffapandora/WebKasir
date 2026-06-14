<?php

namespace App\Http\Controllers\Transaction;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Product;
use App\Models\Shift;
use App\Models\StockMovement;
use App\Models\Customer;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'customerId' => 'nullable|integer',
            'customerName' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|integer',
            'items.*.discount_amount' => 'integer',
            'items.*.subtotal' => 'required|integer',
            'payments' => 'required|array|min:1',
            'payments.*.method' => 'required|string',
            'payments.*.amount' => 'required|integer',
            'payments.*.reference' => 'nullable|string',
            'subtotal' => 'required|integer',
            'discountAmount' => 'integer',
            'taxAmount' => 'required|integer',
            'serviceCharge' => 'integer',
            'total' => 'required|integer',
            'change' => 'required|integer',
            'notes' => 'nullable|string',
        ]);

        $user = Auth::user();
        
        // Find current open shift for this cashier
        $shift = Shift::where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$shift) {
            return response()->json([
                'success' => false,
                'message' => 'Anda harus membuka shift kasir terlebih dahulu.'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Generate invoice number
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . rand(1000, 9999);

            // Create Transaction
            $transaction = Transaction::create([
                'invoice_number' => $invoiceNumber,
                'branch_id' => $user->branch_id,
                'branch_name' => $user->branch ? $user->branch->name : 'Toko Pusat',
                'cashier_id' => $user->id,
                'cashier_name' => $user->name,
                'customer_id' => $data['customerId'] ?? null,
                'customer_name' => $data['customerName'] ?? null,
                'subtotal' => $data['subtotal'],
                'discount_amount' => $data['discountAmount'] ?? 0,
                'tax_amount' => $data['taxAmount'],
                'service_charge' => $data['serviceCharge'] ?? 0,
                'total' => $data['total'],
                'change_amount' => $data['change'],
                'status' => 'completed',
                'shift_id' => $shift->id,
            ]);

            // Save items & deduct stock
            foreach ($data['items'] as $item) {
                $product = Product::find($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Stok produk {$product->name} tidak mencukupi.");
                }

                $product->decrement('stock', $item['quantity']);

                // Deduct recipe ingredients stock if product uses recipe
                if ($product->use_recipe) {
                    $productIngredients = $product->productIngredients()->with('ingredient')->get();
                    foreach ($productIngredients as $pi) {
                        $qtyNeeded = (float) $pi->quantity_needed * $item['quantity'];
                        $ingredient = $pi->ingredient;

                        if ($ingredient->stock < $qtyNeeded) {
                            throw new \Exception("Stok bahan baku {$ingredient->name} tidak mencukupi untuk membuat {$product->name}.");
                        }

                        $ingredient->decrement('stock', $qtyNeeded);

                        // Create usage log
                        \App\Models\IngredientUsageLog::create([
                            'ingredient_id' => $ingredient->id,
                            'product_id' => $product->id,
                            'transaction_id' => $transaction->id,
                            'quantity_used' => $qtyNeeded,
                            'notes' => 'Pengurangan otomatis penjualan POS',
                        ]);
                    }
                }

                $transaction->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'subtotal' => $item['subtotal'],
                ]);

                // Create stock movement
                StockMovement::create([
                    'product_id' => $product->id,
                    'type' => 'out',
                    'quantity' => $item['quantity'],
                    'reference' => $invoiceNumber,
                    'reason' => 'Penjualan Kasir',
                    'user_name' => $user->name,
                    'branch_name' => $user->branch ? $user->branch->name : 'Toko Pusat',
                ]);
            }

            // Save payments
            $cashPaid = 0;
            $nonCashPaid = 0;
            foreach ($data['payments'] as $payment) {
                $transaction->payments()->create([
                    'method' => $payment['method'],
                    'amount' => $payment['amount'],
                    'reference' => $payment['reference'] ?? null,
                ]);

                if ($payment['method'] === 'cash') {
                    $cashPaid += ($payment['amount'] - $data['change']);
                } else {
                    $nonCashPaid += $payment['amount'];
                }
            }

            // Update shift statistics
            $shift->increment('total_sales', $data['total']);
            $shift->increment('total_transactions', 1);
            $shift->increment('total_cash_sales', $cashPaid);
            $shift->increment('total_non_cash_sales', $nonCashPaid);

            // Loyalty points (if customer exists)
            if ($data['customerId']) {
                $customer = Customer::find($data['customerId']);
                if ($customer) {
                    // Indonesian standard rule: Rp 10.000 = 1 point
                    $pointsEarned = floor($data['total'] / 10000);
                    if ($pointsEarned > 0) {
                        $customer->increment('loyalty_points', $pointsEarned);
                        $customer->loyaltyTransactions()->create([
                            'customer_name' => $customer->name,
                            'type' => 'earn',
                            'points' => $pointsEarned,
                            'balance_after' => $customer->loyalty_points,
                            'reference' => $invoiceNumber,
                            'notes' => 'Poin belanja',
                        ]);
                    }
                    $customer->increment('total_spent', $data['total']);
                    $customer->increment('total_transactions', 1);
                    $customer->update(['last_visit' => now()]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil diproses.',
                'invoiceNumber' => $invoiceNumber,
                'change' => $data['change'],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function posHistory()
    {
        $user = Auth::user();
        $transactions = Transaction::where('branch_id', $user->branch_id)
            ->with(['items', 'payments'])
            ->latest()
            ->take(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    public function openShift(Request $request)
    {
        $data = $request->validate([
            'openingCash' => 'required|integer',
        ]);

        $user = Auth::user();

        // Check if there is already an open shift
        $existing = Shift::where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Shift Anda saat ini masih terbuka.'
            ], 422);
        }

        $shift = Shift::create([
            'cashier_id' => $user->id,
            'cashier_name' => $user->name,
            'branch_id' => $user->branch_id,
            'branch_name' => $user->branch ? $user->branch->name : 'Toko Pusat',
            'opening_cash' => $data['openingCash'],
            'status' => 'open',
            'opened_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift berhasil dibuka.',
            'data' => $shift
        ]);
    }

    public function closeShift(Request $request)
    {
        $data = $request->validate([
            'closingCash' => 'required|integer',
            'notes' => 'nullable|string',
        ]);

        $user = Auth::user();

        $shift = Shift::where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$shift) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada shift terbuka yang ditemukan.'
            ], 422);
        }

        $expected = $shift->opening_cash + $shift->total_cash_sales;
        $diff = $data['closingCash'] - $expected;

        $shift->update([
            'closing_cash' => $data['closingCash'],
            'expected_cash' => $expected,
            'difference' => $diff,
            'status' => 'closed',
            'closed_at' => now(),
            'notes' => $data['notes'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift berhasil ditutup.',
            'data' => $shift
        ]);
    }

    public function currentShift()
    {
        $user = Auth::user();
        $shift = Shift::where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $shift
        ]);
    }
}
