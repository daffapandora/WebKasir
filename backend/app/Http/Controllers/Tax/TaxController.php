<?php

namespace App\Http\Controllers\Tax;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TaxConfig;

class TaxController extends Controller
{
    public function index()
    {
        $configs = TaxConfig::all();

        return response()->json([
            'success' => true,
            'data' => $configs
        ]);
    }

    public function update(Request $request, TaxConfig $tax)
    {
        $data = $request->validate([
            'rate' => 'numeric',
            'is_active' => 'boolean',
            'is_inclusive' => 'boolean',
            'apply_before_discount' => 'boolean',
            'label' => 'string',
        ]);

        $tax->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi pajak berhasil diperbarui.',
            'data' => $tax
        ]);
    }
}
