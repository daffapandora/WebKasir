<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;

class Shift extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'cashier_id', 'cashier_name', 'branch_id', 'branch_name',
        'opening_cash', 'closing_cash', 'expected_cash', 'difference',
        'total_sales', 'total_transactions', 'total_cash_sales', 'total_non_cash_sales',
        'status', 'opened_at', 'closed_at', 'notes'
    ];

    protected $casts = [
        'opening_cash' => 'integer',
        'closing_cash' => 'integer',
        'expected_cash' => 'integer',
        'difference' => 'integer',
        'total_sales' => 'integer',
        'total_transactions' => 'integer',
        'total_cash_sales' => 'integer',
        'total_non_cash_sales' => 'integer',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
