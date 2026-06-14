<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyStockRecord extends Model
{
    protected $fillable = [
        'ingredient_id', 'record_date',
        'opening_stock', 'stock_in', 'stock_used', 'stock_wasted',
        'closing_stock', 'source', 'recorded_by', 'notes',
    ];

    protected $casts = [
        'record_date'   => 'date',
        'opening_stock' => 'decimal:3',
        'stock_in'      => 'decimal:3',
        'stock_used'    => 'decimal:3',
        'stock_wasted'  => 'decimal:3',
        'closing_stock' => 'decimal:3',
    ];

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Auto-compute closing_stock sebelum disimpan.
     */
    protected static function booted(): void
    {
        static::saving(function (DailyStockRecord $record) {
            $record->closing_stock =
                $record->opening_stock
                + $record->stock_in
                - $record->stock_used
                - $record->stock_wasted;
        });
    }
}
