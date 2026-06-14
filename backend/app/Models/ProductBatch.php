<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductBatch extends Model
{
    protected $fillable = ['product_id', 'batch_number', 'expiry_date', 'quantity', 'cost_price'];

    protected $casts = [
        'expiry_date' => 'date',
        'quantity' => 'integer',
        'cost_price' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
