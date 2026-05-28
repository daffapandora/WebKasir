<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasUuids;
    protected $fillable = [
        'product_id', 'name', 'sku', 'barcode', 'cost_price',
        'selling_price', 'weight', 'unit', 'is_default', 'is_active',
    ];
    protected $casts = [
        'cost_price' => 'decimal:2', 'selling_price' => 'decimal:2',
        'weight' => 'decimal:3', 'is_default' => 'boolean', 'is_active' => 'boolean',
    ];
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function inventory(): HasMany { return $this->hasMany(Inventory::class, 'variant_id'); }
    public function transactionItems(): HasMany { return $this->hasMany(TransactionItem::class, 'variant_id'); }
}
