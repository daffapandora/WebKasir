<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * Transaction Model - Represents a point-of-sale transaction/order
 * Handles multi-payment methods, inventory deduction, and audit trails
 */
class Transaction extends BaseModel
{
    protected $fillable = [
        'tenant_id', 'outlet_id', 'shift_id', 'order_number', 'created_by',
        'subtotal_amount', 'discount_amount', 'tax_amount', 'total_amount',
        'payment_method', 'payment_status', 'status', 'customer_name',
        'customer_phone', 'customer_id', 'void_reason', 'voided_by',
        'manager_pin_verified', 'payment_details', 'metadata'
    ];

    protected $casts = [
        'payment_details' => 'json',
        'metadata' => 'json',
        'manager_pin_verified' => 'boolean',
        'held_at' => 'datetime',
        'completed_at' => 'datetime',
        'voided_at' => 'datetime',
        'subtotal_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    // Generate order number automatically
    protected static function boot() {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->order_number) {
                // Format: ORD-20260528-0042
                $count = self::where('outlet_id', $model->outlet_id)
                    ->whereDate('created_at', today())
                    ->count();
                    
                $model->order_number = 'ORD-' . now()->format('Ymd') . '-' . 
                    str_pad($count + 1, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    // Relationships
    public function items(): HasMany {
        return $this->hasMany(TransactionItem::class);
    }

    public function payments(): HasMany {
        return $this->hasMany(Payment::class);
    }

    public function discounts(): HasMany {
        return $this->hasMany(TransactionDiscount::class);
    }

    public function outlet(): BelongsTo {
        return $this->belongsTo(Outlet::class);
    }

    public function shift(): BelongsTo {
        return $this->belongsTo(Shift::class);
    }

    public function createdBy(): BelongsTo {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function voidedBy(): BelongsTo {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function customer(): BelongsTo {
        return $this->belongsTo(Customer::class);
    }

    // Status checks
    public function isCompleted(): bool {
        return $this->status === 'COMPLETED';
    }

    public function isVoided(): bool {
        return $this->status === 'VOIDED';
    }

    public function isHeld(): bool {
        return $this->status === 'HELD';
    }

    public function isPending(): bool {
        return $this->status === 'PENDING';
    }

    // Query scopes
    public function scopeCompleted($query) {
        return $query->where('status', 'COMPLETED');
    }

    public function scopeByOutlet($query, $outletId) {
        return $query->where('outlet_id', $outletId);
    }

    public function scopeByShift($query, $shiftId) {
        return $query->where('shift_id', $shiftId);
    }

    public function scopeRecent($query, $days = 7) {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeByDateRange($query, $startDate, $endDate) {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}

