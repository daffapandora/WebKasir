<?php

namespace App\Http\Controllers\Discount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Discount;

class DiscountController extends Controller
{
    public function index()
    {
        $discounts = Discount::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $discounts
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:191',
            'code' => 'nullable|string|unique:discounts,code',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|integer|min:1',
            'scope' => 'required|in:product,cart',
            'min_purchase' => 'nullable|integer',
            'max_discount' => 'nullable|integer',
            'membership_only' => 'boolean',
            'membership_tier' => 'nullable|in:bronze,silver,gold',
            'product_ids' => 'nullable|array',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'usage_limit' => 'nullable|integer',
        ]);

        $discount = Discount::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Diskon/Promo berhasil ditambahkan.',
            'data' => $discount
        ]);
    }

    public function update(Request $request, Discount $discount)
    {
        $data = $request->validate([
            'name' => 'string|max:191',
            'code' => 'nullable|string|unique:discounts,code,' . $discount->id,
            'type' => 'in:fixed,percentage',
            'value' => 'integer|min:1',
            'scope' => 'in:product,cart',
            'min_purchase' => 'nullable|integer',
            'max_discount' => 'nullable|integer',
            'membership_only' => 'boolean',
            'membership_tier' => 'nullable|in:bronze,silver,gold',
            'product_ids' => 'nullable|array',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'usage_limit' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $discount->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Diskon/Promo berhasil diperbarui.',
            'data' => $discount
        ]);
    }

    public function destroy(Discount $discount)
    {
        $discount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Diskon/Promo berhasil dihapus.'
        ]);
    }
}
