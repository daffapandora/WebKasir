<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WasteLog extends Model
{
    protected $fillable = [
        'user_id', 'user_name', 'total_loss_amount', 'logged_at', 'notes',
    ];

    protected $casts = [
        'total_loss_amount' => 'decimal:2',
        'logged_at'         => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(WasteLogItem::class);
    }

    /**
     * Recalculate & persist total_loss_amount dari sum items.
     */
    public function recalculateTotal(): void
    {
        $this->update([
            'total_loss_amount' => $this->items()->sum('total_cost'),
        ]);
    }
}
