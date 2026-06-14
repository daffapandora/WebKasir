<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Supplier;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $suppliers
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:191',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
        ]);

        $supplier = Supplier::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Supplier berhasil ditambahkan.',
            'data' => $supplier
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $data = $request->validate([
            'name' => 'string|max:191',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $supplier->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Supplier berhasil diperbarui.',
            'data' => $supplier
        ]);
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Supplier berhasil dihapus.'
        ]);
    }
}
