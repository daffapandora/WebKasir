<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientUsageLog extends Model
{
    protected $fillable = [
        'ingredient_id', 'product_id', 'transaction_id', 'quantity_used', 'notes'
    ];

    protected $casts = [
        'quantity_used' => 'decimal:3',
    ];

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
