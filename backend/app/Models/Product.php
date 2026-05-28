<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * Product Model - Represents SKU items in inventory system
 * Supports variants, recipes, and multi-outlet tracking
 */
class Product extends BaseModel
{
    protected $fillable = [
        'tenant_id', 'category_id', 'name', 'sku', 'description',
        'barcode', 'base_price', 'cost_price', 'is_recipe_based',
        'has_variants', 'is_active', 'display_order', 'image_url'
    ];

    protected $casts = [
        'is_recipe_based' => 'boolean',
        'has_variants' => 'boolean',
        'is_active' => 'boolean',
        'base_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
    ];

    // Relationships
    public function category(): BelongsTo {
        return $this->belongsTo(Category::class);
    }

    public function tenant(): BelongsTo {
        return $this->belongsTo(Tenant::class);
    }

    public function variants(): HasMany {
        return $this->hasMany(ProductVariant::class);
    }

    public function inventories(): HasMany {
        return $this->hasMany(Inventory::class);
    }

    public function recipe(): \Illuminate\Database\Eloquent\Relations\HasOne {
        return $this->hasOne(Recipe::class);
    }

    public function recipeIngredients(): HasMany {
        return $this->hasMany(RecipeIngredient::class, 'ingredient_id');
    }

    public function transactionItems(): HasMany {
        return $this->hasMany(TransactionItem::class);
    }

    // Accessors - Calculate profit metrics
    public function profit(): Attribute {
        return Attribute::make(
            get: fn() => $this->base_price - ($this->cost_price ?? 0),
        );
    }

    public function profitMargin(): Attribute {
        return Attribute::make(
            get: fn() => $this->cost_price ? (($this->base_price - $this->cost_price) / $this->base_price * 100) : 0,
        );
    }

    // Query Scopes
    public function scopeActive($query) {
        return $query->where('is_active', true);
    }

    public function scopeWithLowStock($query, $outlet_id) {
        return $query->whereHas('inventories', function ($q) use ($outlet_id) {
            $q->where('outlet_id', $outlet_id)
              ->whereRaw('quantity <= reorder_point');
        });
    }

    public function scopeSearchable($query, $term) {
        return $query->whereRaw('MATCH(name, sku, barcode) AGAINST(? IN BOOLEAN MODE)', [$term]);
    }
}
