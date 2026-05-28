<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionItem extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = [
        'transaction_id', 'variant_id', 'product_name', 'variant_name',
        'quantity', 'unit_price', 'cost_price', 'discount_amount', 'subtotal',
    ];
    protected $casts = [
        'unit_price' => 'decimal:2', 'cost_price' => 'decimal:2',
        'discount_amount' => 'decimal:2', 'subtotal' => 'decimal:2',
    ];
    public function transaction(): BelongsTo { return $this->belongsTo(Transaction::class); }
    public function variant(): BelongsTo { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
}
