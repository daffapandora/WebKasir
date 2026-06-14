<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Product;
use App\Models\Discount;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function kpis()
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        $todaySales = Transaction::whereDate('created_at', $today)->where('status', 'completed')->sum('total');
        $todayTransactions = Transaction::whereDate('created_at', $today)->where('status', 'completed')->count();
        $todayAvgOrder = $todayTransactions > 0 ? (int)($todaySales / $todayTransactions) : 0;
        
        $todayItemsSold = TransactionItem::whereHas('transaction', function($q) use ($today) {
            $q->whereDate('created_at', $today)->where('status', 'completed');
        })->sum('quantity');

        $yesterdaySales = Transaction::whereDate('created_at', $yesterday)->where('status', 'completed')->sum('total');

        $growth = 0;
        if ($yesterdaySales > 0) {
            $growth = (($todaySales - $yesterdaySales) / $yesterdaySales) * 100;
        } elseif ($todaySales > 0) {
            $growth = 100;
        }

        $lowStockCount = Product::where('stock', '<=', 'min_stock')->where('is_active', true)->count();
        $activeDiscounts = Discount::where('is_active', true)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'today_sales' => $todaySales,
                'today_transactions' => $todayTransactions,
                'today_avg_order' => $todayAvgOrder,
                'today_items_sold' => $todayItemsSold,
                'yesterday_sales' => $yesterdaySales,
                'sales_growth' => round($growth, 1),
                'low_stock_count' => $lowStockCount,
                'active_discounts' => $activeDiscounts,
            ]
        ]);
    }

    public function salesSummary(Request $request)
    {
        $days = $request->input('days', 7);
        $startDate = Carbon::now()->subDays($days)->startOfDay();

        $summary = Transaction::where('created_at', '>=', $startDate)
            ->where('status', 'completed')
            ->select(
                DB::raw("DATE(created_at) as date_label"),
                DB::raw("SUM(subtotal) as gross"),
                DB::raw("SUM(discount_amount) as discount"),
                DB::raw("SUM(total) as net")
            )
            ->groupBy('date_label')
            ->orderBy('date_label')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $summary->map(function($row) {
                // Approximate COGS to show profits
                $cogs = (int)($row->gross * 0.7);
                return [
                    'period' => Carbon::parse($row->date_label)->format('d M'),
                    'gross_sales' => (int)$row->gross,
                    'total_discounts' => (int)$row->discount,
                    'net_sales' => (int)$row->net,
                    'cogs' => $cogs,
                    'gross_profit' => (int)$row->net - $cogs,
                ];
            })
        ]);
    }

    public function topProducts()
    {
        $topProducts = TransactionItem::select(
            'product_id',
            'product_name',
            DB::raw('SUM(quantity) as quantity_sold'),
            DB::raw('SUM(subtotal) as revenue')
        )
        ->whereHas('transaction', function($q) {
            $q->where('status', 'completed');
        })
        ->groupBy('product_id', 'product_name')
        ->orderByDesc('quantity_sold')
        ->take(5)
        ->get();

        return response()->json([
            'success' => true,
            'data' => $topProducts->map(function($row) {
                return [
                    'product_id' => $row->product_id,
                    'product_name' => $row->product_name,
                    'category' => 'General',
                    'quantity_sold' => (int)$row->quantity_sold,
                    'revenue' => (int)$row->revenue,
                    'profit' => (int)($row->revenue * 0.3),
                ];
            })
        ]);
    }

    public function paymentMethods()
    {
        $methods = Payment::select(
            'method',
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(amount) as amount')
        )
        ->groupBy('method')
        ->get();

        $totalAmount = $methods->sum('amount');

        return response()->json([
            'success' => true,
            'data' => $methods->map(function($row) use ($totalAmount) {
                return [
                    'method' => $row->method,
                    'count' => (int)$row->count,
                    'amount' => (int)$row->amount,
                    'percentage' => $totalAmount > 0 ? round(($row->amount / $totalAmount) * 100, 1) : 0,
                ];
            })
        ]);
    }

    public function hourlySales()
    {
        // Simple mock hourly distribution based on last 7 days of completed sales
        $hourly = Transaction::where('status', 'completed')
            ->select(
                DB::raw("EXTRACT(HOUR FROM created_at) as hr"),
                DB::raw("COUNT(*) as cnt"),
                DB::raw("SUM(total) as sum_total")
            )
            ->groupBy('hr')
            ->orderBy('hr')
            ->get();

        $hours = [];
        for ($i = 8; $i <= 22; $i++) {
            $row = $hourly->firstWhere('hr', $i);
            $hours[] = [
                'hour' => $i,
                'label' => sprintf("%02d:00", $i),
                'transaction_count' => $row ? (int)$row->cnt : 0,
                'total' => $row ? (int)$row->sum_total : 0,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $hours
        ]);
    }
}
