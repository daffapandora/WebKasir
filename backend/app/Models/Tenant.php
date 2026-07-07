<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Tenant extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'slug',
        'plan',
        'is_active',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];

    /* ── Relationships ── */

    public function users()
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    public function branches()
    {
        return $this->hasMany(Branch::class, 'tenant_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'tenant_id');
    }

    public function categories()
    {
        return $this->hasMany(Category::class, 'tenant_id');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'tenant_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'tenant_id');
    }

    /* ── Helpers ── */

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isOnPlan(string $plan): bool
    {
        return $this->plan === $plan;
    }
}
