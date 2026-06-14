<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category');

        if ($request->has('category_id') && $request->category_id != '') {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        $products = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $products->map(function($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'category_id' => $product->category_id,
                    'category_name' => $product->category->name,
                    'cost_price' => $product->cost_price,
                    'sale_price' => $product->sale_price,
                    'stock' => $product->stock,
                    'min_stock' => $product->min_stock,
                    'unit' => $product->unit,
                    'image' => $product->image,
                    'is_active' => $product->is_active,
                    'has_batch' => $product->has_batch,
                ];
            })
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:191',
            'sku' => 'required|string|unique:products,sku',
            'barcode' => 'required|string|unique:products,barcode',
            'category_id' => 'required|exists:categories,id',
            'cost_price' => 'required|integer',
            'sale_price' => 'required|integer',
            'stock' => 'integer',
            'min_stock' => 'integer',
            'unit' => 'string',
            'has_batch' => 'boolean',
        ]);

        $product = Product::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan.',
            'data' => $product
        ], 211);
    }

    public function show(Product $product)
    {
        return response()->json([
            'success' => true,
            'data' => $product->load('batches')
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => 'string|max:191',
            'sku' => 'string|unique:products,sku,' . $product->id,
            'barcode' => 'string|unique:products,barcode,' . $product->id,
            'category_id' => 'exists:categories,id',
            'cost_price' => 'integer',
            'sale_price' => 'integer',
            'stock' => 'integer',
            'min_stock' => 'integer',
            'unit' => 'string',
            'is_active' => 'boolean',
            'has_batch' => 'boolean',
        ]);

        $product->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product
        ]);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.'
        ]);
    }
}
