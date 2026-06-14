<?php

namespace App\Http\Controllers\Loyalty;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LoyaltyConfig;
use App\Models\LoyaltyTransaction;
use App\Models\Customer;
use Illuminate\Support\Facades\Auth;

class LoyaltyController extends Controller
{
    public function getConfig()
    {
        $config = LoyaltyConfig::firstOrCreate([], [
            'points_per_amount' => 1,
            'amount_threshold' => 10000,
            'point_value' => 100,
            'min_redeem_points' => 10,
            'bronze_threshold' => 100,
            'silver_threshold' => 500,
            'gold_threshold' => 1500,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $config
        ]);
    }

    public function updateConfig(Request $request)
    {
        $config = LoyaltyConfig::first();
        if (!$config) {
            $config = new LoyaltyConfig();
        }

        $data = $request->validate([
            'points_per_amount' => 'integer',
            'amount_threshold' => 'integer',
            'point_value' => 'integer',
            'min_redeem_points' => 'integer',
            'bronze_threshold' => 'integer',
            'silver_threshold' => 'integer',
            'gold_threshold' => 'integer',
            'is_active' => 'boolean',
        ]);

        $config->fill($data)->save();

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi program loyalti berhasil diperbarui.',
            'data' => $config
        ]);
    }

    public function ledger()
    {
        $transactions = LoyaltyTransaction::latest()->take(100)->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    public function adjustPoints(Request $request)
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'type' => 'required|in:earn,redeem,adjust,expire',
            'points' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::find($data['customer_id']);
        $points = $data['points'];

        if ($data['type'] === 'earn' || $data['type'] === 'adjust') {
            $customer->increment('loyalty_points', $points);
        } else {
            if ($customer->loyalty_points < $points) {
                return response()->json([
                    'success' => false,
                    'message' => 'Poin pelanggan tidak mencukupi untuk pengurangan ini.'
                ], 422);
            }
            $customer->decrement('loyalty_points', $points);
        }

        $user = Auth::user();
        $loyaltyTrans = $customer->loyaltyTransactions()->create([
            'customer_name' => $customer->name,
            'type' => $data['type'],
            'points' => $points,
            'balance_after' => $customer->loyalty_points,
            'notes' => $data['notes'] . " (Disesuaikan oleh {$user->name})",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Poin pelanggan berhasil disesuaikan.',
            'data' => [
                'loyalty_points' => $customer->loyalty_points,
                'transaction' => $loyaltyTrans
            ]
        ]);
    }
}
