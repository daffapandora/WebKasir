<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\TransactionService;
use App\Models\Product;
use App\Models\Category;
use App\Models\PromoCode;
use Exception;

class SyncController extends Controller
{
    protected TransactionService $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Endpoint to pull master data (Products, Categories, Promos) for the POS client.
     */
    public function pullMasterData(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // Categories
        $categories = Category::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        // Products with active variants and stock scoped to user's outlet
        $outletId = $request->user()->outlet_id;
        
        $products = Product::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->with(['variants' => function ($query) {
                $query->where('is_active', true);
            }, 'variants.inventory' => function ($query) use ($outletId) {
                $query->where('outlet_id', $outletId);
            }])
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'tenantId' => $product->tenant_id,
                    'categoryId' => $product->category_id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'description' => $product->description,
                    'imageUrl' => $product->image_url,
                    'isActive' => $product->is_active,
                    'trackInventory' => $product->track_inventory,
                    'variants' => $product->variants->map(function ($variant) {
                        $inventory = $variant->inventory->first();
                        return [
                            'id' => $variant->id,
                            'productId' => $variant->product_id,
                            'name' => $variant->name,
                            'sku' => $variant->sku,
                            'barcode' => $variant->barcode,
                            'costPrice' => (float) $variant->cost_price,
                            'sellingPrice' => (float) $variant->selling_price,
                            'weight' => (float) $variant->weight,
                            'unit' => $variant->unit,
                            'isDefault' => $variant->is_default,
                            'isActive' => $variant->is_active,
                            'stock' => $inventory ? $inventory->quantity_on_hand : 0,
                            'lowStockThreshold' => $inventory ? $inventory->low_stock_threshold : 10,
                        ];
                    }),
                ];
            });

        // Promo Codes
        $promos = PromoCode::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereDate('valid_from', '<=', now())
            ->whereDate('valid_until', '>=', now())
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $categories,
                'products' => $products,
                'promos' => $promos,
            ]
        ]);
    }

    /**
     * Endpoint to sync offline transactions created by the POS client.
     */
    public function pushTransactions(Request $request)
    {
        $request->validate([
            'transactions' => 'required|array',
            'transactions.*.client_uuid' => 'required|string',
            'transactions.*.outlet_id' => 'required|string',
            'transactions.*.user_id' => 'required|string',
            'transactions.*.shift_id' => 'required|string',
            'transactions.*.invoice_number' => 'required|string',
            'transactions.*.subtotal' => 'required|numeric',
            'transactions.*.total_amount' => 'required|numeric',
            'transactions.*.items' => 'required|array',
            'transactions.*.payments' => 'required|array',
        ]);

        $transactions = $request->input('transactions');
        $tenantId = $request->user()->tenant_id;

        $results = [
            'synced' => 0,
            'errors' => 0,
            'failed_uuids' => [],
        ];

        foreach ($transactions as $txData) {
            try {
                $this->transactionService->processOfflineSync($txData, $tenantId);
                $results['synced']++;
            } catch (Exception $e) {
                $results['errors']++;
                $results['failed_uuids'][] = [
                    'client_uuid' => $txData['client_uuid'],
                    'reason' => $e->getMessage()
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $results,
            'message' => "Synced {$results['synced']} transactions with {$results['errors']} errors."
        ]);
    }
}
