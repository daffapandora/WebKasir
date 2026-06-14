<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name', 'sku', 'barcode', 'category_id',
        'cost_price', 'sale_price', 'stock', 'min_stock',
        'unit', 'image', 'is_active', 'has_batch',
        'hpp_auto', 'use_recipe'
    ];

    protected $casts = [
        'cost_price' => 'integer',
        'sale_price' => 'integer',
        'stock' => 'integer',
        'min_stock' => 'integer',
        'is_active' => 'boolean',
        'has_batch' => 'boolean',
        'use_recipe' => 'boolean',
        'hpp_auto' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function batches()
    {
        return $this->hasMany(ProductBatch::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'product_ingredients')
                    ->withPivot('quantity_needed')
                    ->withTimestamps();
    }

    public function productIngredients()
    {
        return $this->hasMany(ProductIngredient::class);
    }

    public function usageLogs()
    {
        return $this->hasMany(IngredientUsageLog::class);
    }

}
