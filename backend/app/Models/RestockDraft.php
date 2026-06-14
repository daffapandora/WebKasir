<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestockDraft extends Model
{
    protected $fillable = [
        'draft_number', 'supplier_id', 'created_by',
        'status', 'suggested_order_date', 'estimated_total', 'notes', 'approved_at',
    ];

    protected $casts = [
        'estimated_total'      => 'decimal:2',
        'suggested_order_date' => 'date',
        'approved_at'          => 'datetime',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RestockDraftItem::class);
    }

    /** Approve draft dan ubah status menjadi 'approved'. */
    public function approve(int $approverId): void
    {
        $this->update([
            'status'      => 'approved',
            'approved_at' => now(),
        ]);
    }

    /** Convert draft ke Purchase Order (stub - implementasi di PO service). */
    public function convertToPurchaseOrder(): void
    {
        $this->update(['status' => 'converted']);
    }
}
