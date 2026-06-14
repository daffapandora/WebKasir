<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AccessControlController extends Controller
{
    protected static $cashierPermissions = [
        'can_apply_discount' => true,
        'can_apply_custom_discount' => false,
        'can_void_item' => true,
        'can_void_transaction' => false,
        'can_process_refund' => false,
        'can_reprint_receipt' => true,
        'can_edit_quantity' => true,
        'can_edit_price' => false,
        'can_hold_bill' => true,
        'can_use_offline_mode' => true,
        'can_view_cost_price' => false,
        'can_view_profit_margin' => false,
        'can_view_daily_omzet' => true,
        'can_view_own_shift_only' => true,
        'can_view_full_history' => false,
        'can_view_own_history_only' => true,
        'can_view_stock_levels' => true,
        'can_view_customer_profiles' => true,
        'discount_requires_pin' => true,
        'void_requires_pin' => true,
        'refund_requires_pin' => true,
        'price_override_requires_pin' => true,
        'auto_logout_minutes' => 15,
        'quick_lock_enabled' => true,
        'pin_required_to_unlock' => true,
        'can_print_receipt' => true,
        'can_open_cash_drawer' => true,
        'can_use_scanner_override' => true,
    ];

    public function getPermissions()
    {
        return response()->json([
            'success' => true,
            'data' => self::$cashierPermissions
        ]);
    }

    public function updatePermissions(Request $request)
    {
        $data = $request->validate([
            'can_apply_discount' => 'boolean',
            'can_apply_custom_discount' => 'boolean',
            'can_void_item' => 'boolean',
            'can_void_transaction' => 'boolean',
            'can_process_refund' => 'boolean',
            'can_reprint_receipt' => 'boolean',
            'can_edit_quantity' => 'boolean',
            'can_edit_price' => 'boolean',
            'can_hold_bill' => 'boolean',
            'can_use_offline_mode' => 'boolean',
            'can_view_cost_price' => 'boolean',
            'can_view_profit_margin' => 'boolean',
            'can_view_daily_omzet' => 'boolean',
            'can_view_own_shift_only' => 'boolean',
            'can_view_full_history' => 'boolean',
            'can_view_own_history_only' => 'boolean',
            'can_view_stock_levels' => 'boolean',
            'can_view_customer_profiles' => 'boolean',
            'discount_requires_pin' => 'boolean',
            'void_requires_pin' => 'boolean',
            'refund_requires_pin' => 'boolean',
            'price_override_requires_pin' => 'boolean',
            'auto_logout_minutes' => 'integer',
            'quick_lock_enabled' => 'boolean',
            'pin_required_to_unlock' => 'boolean',
            'can_print_receipt' => 'boolean',
            'can_open_cash_drawer' => 'boolean',
            'can_use_scanner_override' => 'boolean',
        ]);

        self::$cashierPermissions = array_merge(self::$cashierPermissions, $data);

        $user = Auth::user();
        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => 'update_access_control',
            'module' => 'access_control',
            'description' => 'Memperbarui hak akses kasir dan kontrol persetujuan PIN.',
            'branch_id' => $user->branch_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Hak akses kontrol berhasil disimpan.',
            'data' => self::$cashierPermissions
        ]);
    }
}
