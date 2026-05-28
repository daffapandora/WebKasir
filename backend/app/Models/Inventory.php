<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    use HasUuids;
    protected $table = 'inventory';
    protected $fillable = ['outlet_id', 'variant_id', 'quantity_on_hand', 'low_stock_threshold', 'reorder_quantity', 'last_counted_at'];
    protected $casts = ['last_counted_at' => 'datetime'];
    public function outlet(): BelongsTo { return $this->belongsTo(Outlet::class); }
    public function variant(): BelongsTo { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
    public function isLowStock(): bool { return $this->quantity_on_hand <= $this->low_stock_threshold; }
}
