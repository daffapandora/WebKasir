<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\WasteLog;
use App\Models\WasteLogItem;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\DailyStockRecord;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WasteLogController extends Controller
{
    // ── GET /api/waste-logs ────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = WasteLog::with('items', 'user:id,name')
            ->when($request->filled('from'), fn ($q) => $q->whereDate('logged_at', '>=', $request->from))
            ->when($request->filled('to'),   fn ($q) => $q->whereDate('logged_at', '<=', $request->to))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->user_id))
            ->latest('logged_at');

        $data = $request->filled('per_page')
            ? $query->paginate($request->per_page)
            : $query->get();

        return response()->json($data);
    }

    // ── POST /api/waste-logs ───────────────────────────

    /**
     * Buat laporan limbah baru beserta item-itemnya dalam satu transaksi.
     *
     * Request body:
     * {
     *   "logged_at": "2026-06-08 14:00:00",
     *   "notes": "Hasil audit gudang pagi",
     *   "items": [
     *     {
     *       "wasted_type": "ingredient",   // "ingredient" | "product"
     *       "wasted_id": 5,
     *       "quantity": 2.5,
     *       "reason": "expired",
     *       "reason_detail": "Kadaluarsa 3 hari lalu"
     *     }
     *   ]
     * }
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'logged_at'                  => 'required|date',
            'notes'                      => 'nullable|string',
            'items'                      => 'required|array|min:1',
            'items.*.wasted_type'        => 'required|in:ingredient,product',
            'items.*.wasted_id'          => 'required|integer',
            'items.*.quantity'           => 'required|numeric|min:0.001',
            'items.*.reason'             => 'required|in:expired,spoiled,unsold,production_error,other',
            'items.*.reason_detail'      => 'nullable|string',
        ]);

        $wasteLog = DB::transaction(function () use ($data, $request) {
            $log = WasteLog::create([
                'user_id'    => $request->user()->id,
                'user_name'  => $request->user()->name,
                'logged_at'  => $data['logged_at'],
                'notes'      => $data['notes'] ?? null,
                'total_loss_amount' => 0,
            ]);

            foreach ($data['items'] as $item) {
                $entity    = $this->resolveEntity($item['wasted_type'], $item['wasted_id']);
                $costNow   = $this->resolveCost($entity, $item['wasted_type']);

                WasteLogItem::create([
                    'waste_log_id'  => $log->id,
                    'wasted_type'   => $this->resolveClass($item['wasted_type']),
                    'wasted_id'     => $item['wasted_id'],
                    'item_name'     => $entity->name,
                    'unit'          => $entity->unit ?? 'pcs',
                    'quantity'      => $item['quantity'],
                    'cost_at_time'  => $costNow,
                    'reason'        => $item['reason'],
                    'reason_detail' => $item['reason_detail'] ?? null,
                ]);

                // Kurangi stok bahan baku secara real-time
                if ($item['wasted_type'] === 'ingredient') {
                    $entity->decrement('stock', $item['quantity']);
                }
            }

            $log->recalculateTotal();

            return $log->load('items');
        });

        return response()->json($wasteLog, 201);
    }

    // ── GET /api/waste-logs/{wasteLog} ────────────────

    public function show(WasteLog $wasteLog): JsonResponse
    {
        return response()->json($wasteLog->load('items', 'user:id,name,role'));
    }

    // ── GET /api/waste-logs/analytics ─────────────────

    /**
     * Ringkasan analitik kebocoran biaya per periode & per alasan.
     */
    public function analytics(Request $request): JsonResponse
    {
        $from = Carbon::parse($request->get('from', now()->startOfMonth()));
        $to   = Carbon::parse($request->get('to', now()->endOfMonth()));

        $byReason = WasteLogItem::whereBetween('created_at', [$from, $to])
            ->selectRaw('reason, COUNT(*) as count, SUM(total_cost) as total_cost')
            ->groupBy('reason')
            ->orderByDesc('total_cost')
            ->get();

        $topItems = WasteLogItem::whereBetween('created_at', [$from, $to])
            ->selectRaw('item_name, wasted_type, SUM(quantity) as total_qty, SUM(total_cost) as total_cost')
            ->groupBy('item_name', 'wasted_type')
            ->orderByDesc('total_cost')
            ->limit(10)
            ->get();

        $totalLoss = WasteLog::whereBetween('logged_at', [$from, $to])
            ->sum('total_loss_amount');

        return response()->json([
            'period'     => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'total_loss' => $totalLoss,
            'by_reason'  => $byReason,
            'top_items'  => $topItems,
        ]);
    }

    // ── Private ────────────────────────────────────────

    private function resolveEntity(string $type, int $id): Ingredient|Product
    {
        return match($type) {
            'ingredient' => Ingredient::findOrFail($id),
            'product'    => Product::findOrFail($id),
        };
    }

    private function resolveCost(Ingredient|Product $entity, string $type): float
    {
        if ($type === 'ingredient') {
            return (float) ($entity->avg_cost_price ?: $entity->cost_price);
        }
        // Untuk produk: gunakan HPP efektif
        return (float) ($entity->use_recipe ? $entity->hpp_auto : $entity->cost_price);
    }

    private function resolveClass(string $type): string
    {
        return match($type) {
            'ingredient' => \App\Models\Ingredient::class,
            'product'    => \App\Models\Product::class,
        };
    }
}
