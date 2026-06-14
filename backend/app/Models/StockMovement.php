<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'product_id', 'type', 'quantity', 'reference', 'reason', 'user_name', 'branch_name'
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
