<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = [
        'purchase_order_id', 'variant_id', 'quantity_ordered', 'quantity_received', 'unit_cost', 'subtotal'
    ];
    protected $casts = ['unit_cost' => 'decimal:2', 'subtotal' => 'decimal:2'];
    public function purchaseOrder(): BelongsTo { return $this->belongsTo(PurchaseOrder::class); }
    public function variant(): BelongsTo { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
}
