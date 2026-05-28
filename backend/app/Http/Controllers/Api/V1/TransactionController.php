<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\TransactionService;
use App\Exceptions\{InsufficientStockException, InvalidTransactionException, ManagerPinRequiredException};
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * TransactionController - Core checkout and order management API
 * Handles transaction creation, voiding, holds, and retrieval with proper authorization
 */
class TransactionController extends Controller
{
    public function __construct(private TransactionService $transactionService) {}

    /**
     * Store a new transaction (checkout)
     * 
     * @bodyParam outlet_id integer required The outlet/store ID
     * @bodyParam shift_id integer The shift ID
     * @bodyParam items array required Array of items with product_id, quantity, unit_price
     * @bodyParam discounts array Array of discounts with type (PERCENTAGE/FIXED) and value
     * @bodyParam payment_method string required Payment method (CASH, CARD, QRIS, MIXED)
     * @bodyParam payment_details array Gateway response data
     * 
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate outlet access
            $outlet = $request->user()->outlets()->findOrFail($request->outlet_id);

            // Validate request data
            $validated = $request->validate([
                'outlet_id' => 'required|integer|exists:outlets,id',
                'shift_id' => 'nullable|integer|exists:shifts,id',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|integer|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'nullable|numeric',
                'items.*.product_variant_id' => 'nullable|integer',
                'items.*.discount_per_item' => 'nullable|numeric',
                'items.*.notes' => 'nullable|string',
                'discounts' => 'nullable|array',
                'discounts.*.type' => 'required|in:PERCENTAGE,FIXED',
                'discounts.*.value' => 'required|numeric',
                'discounts.*.code' => 'nullable|string',
                'payment_method' => 'required|in:CASH,CARD,QRIS,MIXED,OFFLINE',
                'payment_details' => 'nullable|array',
                'customer_id' => 'nullable|integer|exists:customers,id',
                'customer_name' => 'nullable|string|max:100',
                'customer_phone' => 'nullable|string|max:20',
            ]);

            // Authorize outlet access
            if ($request->user()->outlet_id && $request->user()->outlet_id !== $outlet->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized outlet access',
                    'errors' => ['outlet_id' => 'You are not authorized to this outlet']
                ], 403);
            }

            // Create transaction with service
            $transaction = $this->transactionService->createTransaction($validated);

            return response()->json([
                'success' => true,
                'message' => 'Transaction completed successfully',
                'data' => [
                    'id' => $transaction->id,
                    'order_number' => $transaction->order_number,
                    'total_amount' => $transaction->total_amount,
                    'payment_method' => $transaction->payment_method,
                    'created_at' => $transaction->created_at,
                ]
            ], 201);

        } catch (InsufficientStockException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient stock',
                'errors' => [
                    'product_id' => $e->productId,
                    'available' => $e->available,
                    'requested' => $e->requested,
                    'error' => $e->getMessage()
                ]
            ], 422);

        } catch (InvalidTransactionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid transaction data',
                'errors' => ['message' => $e->getMessage()]
            ], 422);

        } catch (\Exception $e) {
            \Log::error('Transaction creation failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create transaction',
                'errors' => ['error' => 'Internal server error']
            ], 500);
        }
    }

    /**
     * Get transaction details
     */
    public function show(Transaction $transaction): JsonResponse
    {
        // Authorize outlet access
        if (Auth::user()->outlet_id && Auth::user()->outlet_id !== $transaction->outlet_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $transaction->id,
                'order_number' => $transaction->order_number,
                'status' => $transaction->status,
                'payment_status' => $transaction->payment_status,
                'subtotal_amount' => $transaction->subtotal_amount,
                'discount_amount' => $transaction->discount_amount,
                'tax_amount' => $transaction->tax_amount,
                'total_amount' => $transaction->total_amount,
                'payment_method' => $transaction->payment_method,
                'customer' => $transaction->customer ? [
                    'id' => $transaction->customer->id,
                    'name' => $transaction->customer->name,
                    'phone' => $transaction->customer->phone,
                ] : null,
                'items' => $transaction->items->map(fn($item) => [
                    'product_name' => $item->product_name,
                    'sku' => $item->product_sku,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'line_total' => $item->line_total,
                ]),
                'created_at' => $transaction->created_at,
                'completed_at' => $transaction->completed_at,
            ]
        ]);
    }

    /**
     * Void a transaction (requires manager PIN)
     * 
     * @bodyParam manager_pin string required 4-6 digit PIN
     * @bodyParam reason string required Reason for void
     */
    public function void(Request $request, Transaction $transaction): JsonResponse
    {
        // Authorize outlet access
        if (Auth::user()->outlet_id && Auth::user()->outlet_id !== $transaction->outlet_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Check if transaction can be voided
        if (!$transaction->isCompleted()) {
            return response()->json([
                'success' => false,
                'message' => 'Only completed transactions can be voided'
            ], 422);
        }

        try {
            $validated = $request->validate([
                'manager_pin' => 'required|string|regex:/^\d{4,6}$/',
                'reason' => 'required|string|max:255',
            ]);

            // Verify manager PIN
            $manager = Auth::user();
            if (!$manager->pin_hash || !Hash::check($validated['manager_pin'], $manager->pin_hash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid manager PIN'
                ], 401);
            }

            // Verify user has manager role
            if (!$manager->hasPermissionTo('void_transaction')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to void transactions'
                ], 403);
            }

            // Void transaction
            $voidedTransaction = $this->transactionService->voidTransaction(
                $transaction,
                $validated['reason'],
                Auth::id()
            );

            return response()->json([
                'success' => true,
                'message' => 'Transaction voided successfully',
                'data' => [
                    'id' => $voidedTransaction->id,
                    'order_number' => $voidedTransaction->order_number,
                    'status' => $voidedTransaction->status,
                    'voided_at' => $voidedTransaction->voided_at,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Hold a transaction (pause for later)
     */
    public function hold(Transaction $transaction): JsonResponse
    {
        if (!$transaction->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending transactions can be held'
            ], 422);
        }

        $heldTransaction = $this->transactionService->holdTransaction($transaction);

        return response()->json([
            'success' => true,
            'message' => 'Transaction held',
            'data' => ['id' => $heldTransaction->id, 'status' => $heldTransaction->status]
        ]);
    }

    /**
     * Resume a held transaction
     */
    public function resume(Transaction $transaction): JsonResponse
    {
        if (!$transaction->isHeld()) {
            return response()->json([
                'success' => false,
                'message' => 'Only held transactions can be resumed'
            ], 422);
        }

        $resumedTransaction = $this->transactionService->resumeTransaction($transaction);

        return response()->json([
            'success' => true,
            'message' => 'Transaction resumed',
            'data' => ['id' => $resumedTransaction->id, 'status' => $resumedTransaction->status]
        ]);
    }

    /**
     * List transactions for an outlet with filters
     * 
     * @queryParam outlet_id integer Outlet ID (defaults to user's outlet)
     * @queryParam status string Transaction status filter
     * @queryParam date_from date Filter by date range
     * @queryParam date_to date Filter by date range
     * @queryParam limit integer Results per page (default 50)
     */
    public function index(Request $request): JsonResponse
    {
        $outletId = $request->outlet_id ?? Auth::user()->outlet_id;

        $query = Transaction::byOutlet($outletId);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->date_from && $request->date_to) {
            $query->byDateRange(
                $request->date_from,
                $request->date_to
            );
        }

        $transactions = $query->latest('id')
            ->paginate($request->limit ?? 50);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }
}
