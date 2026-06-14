<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'invoice_number', 'branch_id', 'branch_name', 'cashier_id', 'cashier_name',
        'customer_id', 'customer_name', 'subtotal', 'discount_amount', 'tax_amount',
        'service_charge', 'total', 'change_amount', 'status', 'voided_by', 'void_reason',
        'refunded_by', 'refund_reason', 'shift_id'
    ];

    protected $casts = [
        'subtotal' => 'integer',
        'discount_amount' => 'integer',
        'tax_amount' => 'integer',
        'service_charge' => 'integer',
        'total' => 'integer',
        'change_amount' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function ingredientUsageLogs()
    {
        return $this->hasMany(IngredientUsageLog::class);
    }
}
