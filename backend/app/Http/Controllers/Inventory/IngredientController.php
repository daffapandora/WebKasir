<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\RestockDraft;
use App\Models\RestockDraftItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IngredientController extends Controller
{
    // ── GET /api/ingredients ───────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Ingredient::with('category:id,name', 'supplier:id,name')
            ->when($request->filled('search'), fn ($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%"))
            ->when($request->filled('supplier_id'), fn ($q) =>
                $q->where('supplier_id', $request->supplier_id))
            ->when($request->filled('low_stock') && $request->boolean('low_stock'), fn ($q) =>
                $q->whereRaw('stock <= min_stock'))
            ->when($request->filled('expiring_days'), fn ($q) =>
                $q->whereNotNull('expiry_date')
                  ->whereDate('expiry_date', '<=', now()->addDays($request->expiring_days)))
            ->when($request->filled('is_active'), fn ($q) =>
                $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name');

        return response()->json(
            $request->filled('per_page')
                ? $query->paginate($request->per_page)
                : $query->get()
        );
    }

    // ── POST /api/ingredients ──────────────────────────

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'sku'              => 'nullable|string|unique:ingredients,sku',
            'category_id'      => 'nullable|exists:categories,id',
            'supplier_id'      => 'nullable|exists:suppliers,id',
            'unit'             => 'required|string|max:20',
            'stock'            => 'numeric|min:0',
            'min_stock'        => 'numeric|min:0',
            'cost_price'       => 'required|numeric|min:0',
            'expiry_date'      => 'nullable|date',
            'storage_location' => 'nullable|string|max:100',
        ]);

        if (empty($data['sku'])) {
            $data['sku'] = 'ING-' . strtoupper(Str::random(6));
        }

        // avg_cost_price = cost_price saat pertama dibuat
        $data['avg_cost_price'] = $data['cost_price'];

        $ingredient = Ingredient::create($data);

        return response()->json($ingredient->load('category:id,name', 'supplier:id,name'), 201);
    }

    // ── GET /api/ingredients/{ingredient} ─────────────

    public function show(Ingredient $ingredient): JsonResponse
    {
        return response()->json(
            $ingredient->load(
                'category:id,name',
                'supplier:id,name',
                'productIngredients.product:id,name,sale_price',
                'dailyStockRecords'
            )
        );
    }

    // ── PUT /api/ingredients/{ingredient} ─────────────

    public function update(Request $request, Ingredient $ingredient): JsonResponse
    {
        $data = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'category_id'      => 'nullable|exists:categories,id',
            'supplier_id'      => 'nullable|exists:suppliers,id',
            'unit'             => 'sometimes|string|max:20',
            'min_stock'        => 'numeric|min:0',
            'cost_price'       => 'numeric|min:0',
            'expiry_date'      => 'nullable|date',
            'storage_location' => 'nullable|string|max:100',
            'is_active'        => 'boolean',
        ]);

        // Update weighted average cost jika cost_price berubah
        if (isset($data['cost_price']) && $data['cost_price'] != $ingredient->cost_price) {
            $data['avg_cost_price'] = $this->calcWeightedAvgCost(
                $ingredient,
                $data['cost_price']
            );
        }

        $ingredient->update($data);

        return response()->json($ingredient->fresh()->load('category:id,name', 'supplier:id,name'));
    }

    // ── DELETE /api/ingredients/{ingredient} ──────────

    public function destroy(Ingredient $ingredient): JsonResponse
    {
        // Soft delete — relasi tetap utuh untuk audit
        $ingredient->delete();

        return response()->json(['message' => 'Bahan baku diarsipkan.']);
    }

    // ── POST /api/ingredients/{ingredient}/stock-in ───

    /**
     * Penerimaan stok bahan baku (dari PO atau manual).
     * Memperbarui avg_cost_price dengan weighted average costing.
     */
    public function stockIn(Request $request, Ingredient $ingredient): JsonResponse
    {
        $data = $request->validate([
            'quantity'    => 'required|numeric|min:0.001',
            'unit_cost'   => 'required|numeric|min:0',
            'reference'   => 'nullable|string',
        ]);

        DB::transaction(function () use ($data, $ingredient) {
            $newAvg = $this->calcWeightedAvgCost($ingredient, $data['unit_cost'], $data['quantity']);

            $ingredient->increment('stock', $data['quantity']);
            $ingredient->update([
                'cost_price'     => $data['unit_cost'],
                'avg_cost_price' => $newAvg,
            ]);
        });

        return response()->json([
            'message'        => 'Stok berhasil ditambahkan.',
            'new_stock'      => $ingredient->fresh()->stock,
            'avg_cost_price' => $ingredient->fresh()->avg_cost_price,
        ]);
    }

    // ── POST /api/restock-drafts/generate ─────────────

    /**
     * Generate draf restock otomatis berdasarkan algoritma:
     *   qty_reorder = (avg_daily_usage × lead_days) + min_stock - current_stock
     * Hanya bahan baku dengan stock ≤ min_stock yang masuk.
     */
    public function generateRestockDraft(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'lead_days'   => 'integer|min:1|max:90',
        ]);

        $leadDays    = $data['lead_days'] ?? 7;
        $supplierId  = $data['supplier_id'] ?? null;

        $query = Ingredient::where('is_active', true)
                           ->whereRaw('stock <= min_stock');

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }

        $ingredients = $query->get();

        if ($ingredients->isEmpty()) {
            return response()->json(['message' => 'Tidak ada bahan baku yang perlu di-restock.'], 200);
        }

        $draft = DB::transaction(function () use ($ingredients, $leadDays, $supplierId, $request) {
            $restockDraft = RestockDraft::create([
                'draft_number'         => 'RD-' . now()->format('YmdHis'),
                'supplier_id'          => $supplierId,
                'created_by'           => $request->user()->id,
                'suggested_order_date' => now()->addDays(1)->toDateString(),
            ]);

            $total = 0;

            foreach ($ingredients as $ing) {
                $avgDaily = $this->calcAvgDailyUsage($ing, 30);
                $neededQty = max(
                    ($avgDaily * $leadDays) + $ing->min_stock - $ing->stock,
                    $ing->min_stock  // minimal pesan sebesar min_stock
                );
                $subtotal = round($neededQty * $ing->avg_cost_price, 2);
                $total   += $subtotal;

                $priority = match(true) {
                    $ing->stock <= 0         => 'critical',
                    $ing->stock < ($ing->min_stock * 0.5) => 'low',
                    default                  => 'normal',
                };

                RestockDraftItem::create([
                    'restock_draft_id'   => $restockDraft->id,
                    'ingredient_id'      => $ing->id,
                    'current_stock'      => $ing->stock,
                    'min_stock'          => $ing->min_stock,
                    'suggested_qty'      => round($neededQty, 3),
                    'unit_cost'          => $ing->avg_cost_price,
                    'priority'           => $priority,
                ]);
            }

            $restockDraft->update(['estimated_total' => $total]);

            return $restockDraft->load('items.ingredient:id,name,unit');
        });

        return response()->json($draft, 201);
    }

    // ── Private ────────────────────────────────────────

    /**
     * Weighted Average Costing:
     *   new_avg = (old_stock × old_avg + incoming_qty × new_cost) / (old_stock + incoming_qty)
     */
    private function calcWeightedAvgCost(
        Ingredient $ing,
        float $newUnitCost,
        float $incomingQty = 0
    ): float {
        if ($incomingQty === 0.0) {
            return $newUnitCost; // hanya update harga, tanpa incoming
        }

        $oldStock   = (float) $ing->stock;
        $oldAvg     = (float) $ing->avg_cost_price;
        $totalStock = $oldStock + $incomingQty;

        if ($totalStock <= 0) return $newUnitCost;

        return round(
            ($oldStock * $oldAvg + $incomingQty * $newUnitCost) / $totalStock,
            4
        );
    }

    /**
     * Rata-rata pemakaian harian dari daily_stock_records.
     */
    private function calcAvgDailyUsage(Ingredient $ing, int $days): float
    {
        $from  = now()->subDays($days);
        $total = $ing->dailyStockRecords()
                     ->where('record_date', '>=', $from)
                     ->sum('stock_used');

        return $days > 0 ? round($total / $days, 3) : 0;
    }
}
