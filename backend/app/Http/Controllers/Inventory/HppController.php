<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\ProductIngredient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Menghitung & memperbarui HPP otomatis produk berdasarkan resep bahan baku.
 *
 * Formula:
 *   HPP = Σ (ingredient.avg_cost_price × product_ingredients.quantity_needed)
 */
class HppController extends Controller
{
    // ── GET /api/products/{product}/hpp ────────────────

    /**
     * Tampilkan breakdown HPP untuk satu produk.
     */
    public function show(Product $product): JsonResponse
    {
        $breakdown = $this->buildBreakdown($product);

        return response()->json([
            'product_id'    => $product->id,
            'product_name'  => $product->name,
            'use_recipe'    => (bool) $product->use_recipe,
            'hpp_auto'      => $product->hpp_auto,
            'cost_price'    => $product->cost_price,
            'effective_hpp' => $product->use_recipe ? $product->hpp_auto : $product->cost_price,
            'margin'        => $this->calcMargin($product),
            'breakdown'     => $breakdown,
        ]);
    }

    // ── POST /api/products/{product}/hpp/recalculate ───

    /**
     * Paksa recalculate HPP untuk satu produk & simpan ke DB.
     */
    public function recalculate(Product $product): JsonResponse
    {
        $hpp = $this->calculateHpp($product);

        $product->update(['hpp_auto' => $hpp]);

        return response()->json([
            'message' => 'HPP berhasil diperbarui.',
            'hpp_auto' => $hpp,
            'breakdown' => $this->buildBreakdown($product),
        ]);
    }

    // ── POST /api/hpp/recalculate-all ──────────────────

    /**
     * Batch recalculate seluruh produk yang use_recipe=true.
     * Dipanggil oleh job/scheduler saat ada perubahan harga bahan baku.
     */
    public function recalculateAll(): JsonResponse
    {
        $products = Product::where('use_recipe', true)
                           ->with('productIngredients.ingredient')
                           ->get();

        $updated = [];

        DB::transaction(function () use ($products, &$updated) {
            foreach ($products as $product) {
                $hpp = $this->calculateHpp($product);
                $product->update(['hpp_auto' => $hpp]);
                $updated[] = ['id' => $product->id, 'name' => $product->name, 'hpp_auto' => $hpp];
            }
        });

        return response()->json([
            'message'       => 'Batch recalculation selesai.',
            'total_updated' => count($updated),
            'products'      => $updated,
        ]);
    }

    // ── PUT /api/products/{product}/recipe ─────────────

    /**
     * Simpan/perbarui resep (bill of materials) sekaligus recalculate HPP.
     *
     * Request body:
     * {
     *   "use_recipe": true,
     *   "ingredients": [
     *     { "ingredient_id": 1, "quantity_needed": 150 },
     *     { "ingredient_id": 3, "quantity_needed": 0.05 }
     *   ]
     * }
     */
    public function upsertRecipe(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'use_recipe'                     => 'required|boolean',
            'ingredients'                    => 'required_if:use_recipe,true|array',
            'ingredients.*.ingredient_id'    => 'required|exists:ingredients,id',
            'ingredients.*.quantity_needed'  => 'required|numeric|min:0.001',
        ]);

        DB::transaction(function () use ($data, $product) {
            // Sync resep
            $syncData = collect($data['ingredients'] ?? [])->keyBy('ingredient_id')
                ->map(fn ($row) => ['quantity_needed' => $row['quantity_needed']])
                ->toArray();

            $product->ingredients()->sync($syncData);

            // Recalculate & simpan
            $product->load('productIngredients.ingredient');
            $hpp = $this->calculateHpp($product);
            $product->update([
                'use_recipe' => $data['use_recipe'],
                'hpp_auto'   => $hpp,
            ]);
        });

        $product->refresh()->load('productIngredients.ingredient');

        return response()->json([
            'message'    => 'Resep & HPP berhasil disimpan.',
            'use_recipe' => $product->use_recipe,
            'hpp_auto'   => $product->hpp_auto,
            'breakdown'  => $this->buildBreakdown($product),
        ]);
    }

    // ── Private helpers ────────────────────────────────

    /**
     * Hitung HPP dari relasi product_ingredients.
     * Gunakan avg_cost_price sebagai basis (weighted average costing).
     */
    private function calculateHpp(Product $product): float
    {
        return (float) $product->productIngredients
            ->reduce(function (float $carry, ProductIngredient $pi) {
                $unitCost = (float) ($pi->ingredient->avg_cost_price ?: $pi->ingredient->cost_price);
                return $carry + ($unitCost * (float) $pi->quantity_needed);
            }, 0.0);
    }

    /**
     * Bangun array breakdown untuk response/audit.
     */
    private function buildBreakdown(Product $product): array
    {
        return $product->productIngredients->map(function (ProductIngredient $pi) {
            $unitCost  = (float) ($pi->ingredient->avg_cost_price ?: $pi->ingredient->cost_price);
            $subtotal  = $unitCost * (float) $pi->quantity_needed;

            return [
                'ingredient_id'   => $pi->ingredient_id,
                'ingredient_name' => $pi->ingredient->name,
                'unit'            => $pi->ingredient->unit,
                'quantity_needed' => $pi->quantity_needed,
                'unit_cost'       => $unitCost,
                'subtotal'        => round($subtotal, 2),
            ];
        })->toArray();
    }

    private function calcMargin(Product $product): array
    {
        $hpp       = $product->use_recipe ? (float) $product->hpp_auto : (float) $product->cost_price;
        $salePrice = (float) $product->sale_price;
        $profit    = $salePrice - $hpp;
        $margin    = $salePrice > 0 ? round(($profit / $salePrice) * 100, 2) : 0;

        return [
            'hpp'            => $hpp,
            'sale_price'     => $salePrice,
            'gross_profit'   => $profit,
            'margin_percent' => $margin,
        ];
    }
}
