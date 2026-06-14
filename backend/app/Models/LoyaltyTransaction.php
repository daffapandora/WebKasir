<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyTransaction extends Model
{
    protected $fillable = [
        'customer_id', 'customer_name', 'type', 'points', 'balance_after', 'reference', 'notes'
    ];

    protected $casts = [
        'points' => 'integer',
        'balance_after' => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
