<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * ProductController - Product catalog, search, and inventory API
 * Provides product data for cashier terminal with real-time stock levels
 */
class ProductController extends Controller
{
    /**
     * Get product catalog with optional search and filters
     * 
     * @queryParam search string Search by name, SKU, or barcode
     * @queryParam category_id integer Filter by category
     * @queryParam outlet_id integer Required: outlet to check stock levels
     * @queryParam limit integer Results per page (default 50)
     * 
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:100',
            'category_id' => 'nullable|integer|exists:categories,id',
            'outlet_id' => 'required|integer|exists:outlets,id',
            'limit' => 'integer|min:10|max:250',
        ]);

        $outletId = $validated['outlet_id'];

        $query = Product::active();

        // Full-text search
        if ($validated['search'] ?? null) {
            $query->searchable($validated['search']);
        }

        // Category filter
        if ($validated['category_id'] ?? null) {
            $query->where('category_id', $validated['category_id']);
        }

        $products = $query->with(['category', 'variants'])
            ->orderBy('display_order')
            ->paginate($validated['limit'] ?? 50);

        // Append inventory data for each product
        $productsWithStock = $products->map(function ($product) use ($outletId) {
            $inventory = Inventory::where('product_id', $product->id)
                ->where('outlet_id', $outletId)
                ->first();

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'category_id' => $product->category_id,
                'category_name' => $product->category->name,
                'base_price' => $product->base_price,
                'cost_price' => $product->cost_price,
                'profit_margin' => $product->profitMargin,
                'has_variants' => $product->has_variants,
                'variants' => $product->variants->map(fn($v) => [
                    'id' => $v->id,
                    'name' => $v->name,
                    'price_modifier' => $v->price_modifier,
                ])->toArray(),
                'inventory' => $inventory ? [
                    'quantity' => $inventory->quantity,
                    'reserved' => $inventory->reserved_quantity,
                    'available' => $inventory->available_quantity,
                    'status' => $inventory->isLowStock() ? 'LOW_STOCK' : 'OK',
                    'reorder_point' => $inventory->reorder_point,
                ] : [
                    'quantity' => 0,
                    'reserved' => 0,
                    'available' => 0,
                    'status' => 'OUT_OF_STOCK',
                    'reorder_point' => 0,
                ],
                'image_url' => $product->image_url,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $productsWithStock,
            'pagination' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
            ]
        ]);
    }

    /**
     * Get single product details
     * 
     * @return JsonResponse
     */
    public function show(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'outlet_id' => 'required|integer|exists:outlets,id',
        ]);

        $outletId = $validated['outlet_id'];

        // Fetch current inventory
        $inventory = Inventory::where('product_id', $product->id)
            ->where('outlet_id', $outletId)
            ->first();

        // Get recipe if applicable
        $recipe = $product->recipe;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'description' => $product->description,
                'category' => [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                ],
                'pricing' => [
                    'base_price' => $product->base_price,
                    'cost_price' => $product->cost_price,
                    'profit_margin' => $product->profitMargin,
                ],
                'inventory' => $inventory ? [
                    'quantity' => $inventory->quantity,
                    'reserved' => $inventory->reserved_quantity,
                    'available' => $inventory->available_quantity,
                    'status' => $inventory->isLowStock() ? 'LOW_STOCK' : 'OK',
                    'reorder_point' => $inventory->reorder_point,
                    'unit' => $inventory->unit,
                ] : null,
                'variants' => $product->variants->map(fn($v) => [
                    'id' => $v->id,
                    'name' => $v->name,
                    'sku' => $v->sku,
                    'price_modifier' => $v->price_modifier,
                ])->toArray(),
                'is_recipe_based' => $product->is_recipe_based,
                'recipe' => $recipe ? [
                    'id' => $recipe->id,
                    'name' => $recipe->name,
                    'instructions' => $recipe->instructions,
                    'ingredients' => $recipe->ingredients->map(fn($ing) => [
                        'ingredient_id' => $ing->ingredient_id,
                        'ingredient_name' => $ing->ingredient->name,
                        'quantity_needed' => $ing->quantity_needed,
                        'unit' => $ing->unit,
                    ])->toArray(),
                ] : null,
                'image_url' => $product->image_url,
            ]
        ]);
    }

    /**
     * Get low-stock products for an outlet
     * 
     * @queryParam outlet_id integer required
     * 
     * @return JsonResponse
     */
    public function lowStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'outlet_id' => 'required|integer|exists:outlets,id',
        ]);

        $lowStockItems = Inventory::where('outlet_id', $validated['outlet_id'])
            ->lowStock()
            ->with('product')
            ->get()
            ->map(fn($inv) => [
                'product_id' => $inv->product_id,
                'product_name' => $inv->product->name,
                'sku' => $inv->product->sku,
                'current_quantity' => $inv->quantity,
                'reorder_point' => $inv->reorder_point,
                'reorder_quantity' => $inv->reorder_quantity,
            ]);

        return response()->json([
            'success' => true,
            'data' => $lowStockItems,
            'total' => $lowStockItems->count()
        ]);
    }

    /**
     * Search products by barcode (quick checkout)
     * 
     * @queryParam barcode string required
     * @queryParam outlet_id integer required
     * 
     * @return JsonResponse
     */
    public function searchByBarcode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'barcode' => 'required|string|max:50',
            'outlet_id' => 'required|integer|exists:outlets,id',
        ]);

        $product = Product::where('barcode', $validated['barcode'])
            ->active()
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        // Fetch inventory
        $inventory = Inventory::where('product_id', $product->id)
            ->where('outlet_id', $validated['outlet_id'])
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'base_price' => $product->base_price,
                'has_variants' => $product->has_variants,
                'variants' => $product->variants->map(fn($v) => [
                    'id' => $v->id,
                    'name' => $v->name,
                    'price_modifier' => $v->price_modifier,
                ])->toArray(),
                'inventory' => [
                    'available' => $inventory?->available_quantity ?? 0,
                    'status' => ($inventory?->available_quantity ?? 0) > 0 ? 'OK' : 'OUT_OF_STOCK',
                ]
            ]
        ]);
    }
}
