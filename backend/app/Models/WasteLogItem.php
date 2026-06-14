<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WasteLogItem extends Model
{
    protected $fillable = [
        'waste_log_id', 'wasted_type', 'wasted_id',
        'item_name', 'unit', 'quantity', 'cost_at_time', 'reason', 'reason_detail',
    ];

    protected $casts = [
        'quantity'      => 'decimal:3',
        'cost_at_time'  => 'decimal:2',
    ];

    /** Polymorphic: Ingredient | Product */
    public function wasted(): MorphTo
    {
        return $this->morphTo();
    }

    public function wasteLog(): BelongsTo
    {
        return $this->belongsTo(WasteLog::class);
    }

    public function getTotalCostAttribute(): float
    {
        return (float) $this->quantity * (float) $this->cost_at_time;
    }
}
