<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;

class Customer extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'phone', 'email', 'address', 'membership_tier',
        'loyalty_points', 'total_spent', 'total_transactions', 'last_visit', 'is_active'
    ];

    protected $casts = [
        'loyalty_points' => 'integer',
        'total_spent' => 'integer',
        'total_transactions' => 'integer',
        'last_visit' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function loyaltyTransactions()
    {
        return $this->hasMany(LoyaltyTransaction::class);
    }
}
