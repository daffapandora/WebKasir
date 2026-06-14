<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class InventoryController extends Controller
{
    public function adjustStock(Request $request, Product $product)
    {
        $data = $request->validate([
            'quantity' => 'required|integer',
            'type' => 'required|in:add,subtract,set',
            'reason' => 'required|string',
        ]);

        $oldStock = $product->stock;
        $qty = $data['quantity'];
        
        if ($data['type'] === 'add') {
            $newStock = $oldStock + $qty;
            $moveQty = $qty;
            $moveType = 'adjustment';
        } elseif ($data['type'] === 'subtract') {
            $newStock = $oldStock - $qty;
            $moveQty = $qty;
            $moveType = 'adjustment';
        } else {
            $newStock = $qty;
            $moveQty = abs($newStock - $oldStock);
            $moveType = 'adjustment';
        }

        $product->update(['stock' => $newStock]);

        $user = Auth::user();

        // Log Stock Movement
        StockMovement::create([
            'product_id' => $product->id,
            'type' => $moveType,
            'quantity' => $moveQty,
            'reference' => 'ADJ-' . time(),
            'reason' => $data['reason'],
            'user_name' => $user->name,
            'branch_name' => $user->branch ? $user->branch->name : 'Toko Pusat',
        ]);

        // Log Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => 'adjust_stock',
            'module' => 'inventory',
            'description' => "Penyesuaian stok produk {$product->name} dari {$oldStock} ke {$newStock}.",
            'old_value' => $oldStock,
            'new_value' => $newStock,
            'branch_id' => $user->branch_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Stok produk berhasil disesuaikan.',
            'stock' => $newStock,
        ]);
    }

    public function movements()
    {
        $movements = StockMovement::with('product')->latest()->take(100)->get();

        return response()->json([
            'success' => true,
            'data' => $movements->map(function($move) {
                return [
                    'id' => $move->id,
                    'product_id' => $move->product_id,
                    'product_name' => $move->product ? $move->product->name : 'Produk Dihapus',
                    'type' => $move->type,
                    'quantity' => $move->quantity,
                    'reference' => $move->reference,
                    'reason' => $move->reason,
                    'user_name' => $move->user_name,
                    'branch_name' => $move->branch_name,
                    'created_at' => $move->created_at->toIso8601String(),
                ];
            })
        ]);
    }

    public function lowStockAlerts()
    {
        $products = Product::where('stock', '<=', 'min_stock')->where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
}
