<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Ingredient extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'sku', 'category_id', 'supplier_id',
        'unit', 'stock', 'min_stock', 'cost_price', 'avg_cost_price',
        'expiry_date', 'storage_location', 'is_active', 'notes',
    ];

    protected $casts = [
        'stock'          => 'decimal:3',
        'min_stock'      => 'decimal:3',
        'cost_price'     => 'decimal:2',
        'avg_cost_price' => 'decimal:2',
        'expiry_date'    => 'date',
        'is_active'      => 'boolean',
    ];

    // ── Relasi ──────────────────────────────────────

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function productIngredients(): HasMany
    {
        return $this->hasMany(ProductIngredient::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_ingredients')
                    ->withPivot('quantity_needed')
                    ->withTimestamps();
    }

    public function dailyStockRecords(): HasMany
    {
        return $this->hasMany(DailyStockRecord::class);
    }

    public function wasteLogs(): MorphMany
    {
        return $this->morphMany(WasteLogItem::class, 'wasted');
    }

    public function usageLogs(): HasMany
    {
        return $this->hasMany(IngredientUsageLog::class);
    }

    // ── Computed ─────────────────────────────────────

    public function getIsLowStockAttribute(): bool
    {
        return $this->stock <= $this->min_stock;
    }

    public function getIsExpiredSoonAttribute(): bool
    {
        return $this->expiry_date && $this->expiry_date->diffInDays(now()) <= 7;
    }
}
