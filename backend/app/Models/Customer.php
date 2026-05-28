<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasUuids;
    protected $fillable = ['tenant_id', 'name', 'phone', 'email', 'total_points', 'total_spent', 'visit_count', 'last_visit_at'];
    protected $casts = ['total_spent' => 'decimal:2', 'last_visit_at' => 'datetime'];
    public function tenant(): BelongsTo { return $this->belongsTo(Tenant::class); }
    public function transactions(): HasMany { return $this->hasMany(Transaction::class); }
    public function loyaltyPoints(): HasMany { return $this->hasMany(LoyaltyPoint::class); }
}
