<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestockDraftItem extends Model
{
    protected $fillable = [
        'restock_draft_id', 'ingredient_id',
        'current_stock', 'min_stock', 'suggested_qty',
        'unit_cost', 'priority',
    ];

    protected $casts = [
        'current_stock' => 'decimal:3',
        'min_stock'     => 'decimal:3',
        'suggested_qty' => 'decimal:3',
        'unit_cost'     => 'decimal:2',
    ];

    public function restockDraft(): BelongsTo
    {
        return $this->belongsTo(RestockDraft::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function getEstimatedSubtotalAttribute(): float
    {
        return (float) $this->suggested_qty * (float) $this->unit_cost;
    }
}
