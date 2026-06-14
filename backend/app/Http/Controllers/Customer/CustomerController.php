<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Transaction;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $customers
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:191',
            'phone' => 'required|string|unique:customers,phone',
            'email' => 'nullable|email|max:191',
            'address' => 'nullable|string',
            'membership_tier' => 'string|in:bronze,silver,gold,none',
        ]);

        $customer = Customer::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil ditambahkan.',
            'data' => $customer
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'string|max:191',
            'phone' => 'string|unique:customers,phone,' . $customer->id,
            'email' => 'nullable|email|max:191',
            'address' => 'nullable|string',
            'membership_tier' => 'string|in:bronze,silver,gold,none',
            'is_active' => 'boolean',
        ]);

        $customer->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil diperbarui.',
            'data' => $customer
        ]);
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil dihapus.'
        ]);
    }

    public function purchaseHistory(Customer $customer)
    {
        $transactions = Transaction::where('customer_id', $customer->id)
            ->with(['items', 'payments'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }
}
