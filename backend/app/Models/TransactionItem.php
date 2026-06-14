<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionItem extends Model
{
    protected $fillable = [
        'transaction_id', 'product_id', 'product_name', 'sku', 'quantity', 'unit_price', 'discount_amount', 'subtotal'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'discount_amount' => 'integer',
        'subtotal' => 'integer',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
