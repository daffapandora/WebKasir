<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromoCode extends Model
{
    use HasUuids;
    protected $fillable = [
        'tenant_id', 'code', 'name', 'discount_type', 'discount_value',
        'min_purchase', 'max_discount', 'usage_limit', 'usage_count',
        'valid_from', 'valid_until', 'is_active',
    ];
    protected $casts = [
        'discount_value' => 'decimal:2', 'min_purchase' => 'decimal:2', 'max_discount' => 'decimal:2',
        'valid_from' => 'date', 'valid_until' => 'date', 'is_active' => 'boolean',
    ];
    public function tenant(): BelongsTo { return $this->belongsTo(Tenant::class); }
    public function isValid(): bool {
        return $this->is_active &&
            now()->between($this->valid_from, $this->valid_until) &&
            (is_null($this->usage_limit) || $this->usage_count < $this->usage_limit);
    }
}
