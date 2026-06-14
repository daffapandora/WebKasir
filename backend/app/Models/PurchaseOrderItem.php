<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id', 'product_id', 'product_name', 'quantity', 'received_quantity', 'unit_cost', 'subtotal'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'received_quantity' => 'integer',
        'unit_cost' => 'integer',
        'subtotal' => 'integer',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
