<?php

namespace App\Http\Controllers\Setting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class SettingController extends Controller
{
    protected static $storeSettings = [
        'store_name' => 'TokoPOS Kita',
        'phone' => '08123456789',
        'address' => 'Jl. Sudirman No. 12, Jakarta',
        'receipt_header' => 'Terima Kasih Telah Berbelanja!',
        'receipt_footer' => 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
        'auto_backup' => true,
    ];

    public function getSettings()
    {
        return response()->json([
            'success' => true,
            'data' => self::$storeSettings
        ]);
    }

    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'store_name' => 'required|string|max:191',
            'phone' => 'required|string',
            'address' => 'required|string',
            'receipt_header' => 'nullable|string',
            'receipt_footer' => 'nullable|string',
            'auto_backup' => 'boolean',
        ]);

        self::$storeSettings = array_merge(self::$storeSettings, $data);

        $user = Auth::user();
        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => 'update_settings',
            'module' => 'settings',
            'description' => 'Memperbarui pengaturan profile toko dan template struk.',
            'branch_id' => $user->branch_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan toko berhasil disimpan.',
            'data' => self::$storeSettings
        ]);
    }
}
