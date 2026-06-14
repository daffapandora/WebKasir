<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    protected $fillable = [
        'name', 'code', 'type', 'value', 'scope', 'min_purchase', 'max_discount',
        'membership_only', 'membership_tier', 'product_ids', 'start_date', 'end_date',
        'usage_limit', 'usage_count', 'is_active'
    ];

    protected $casts = [
        'value' => 'integer',
        'min_purchase' => 'integer',
        'max_discount' => 'integer',
        'membership_only' => 'boolean',
        'product_ids' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'usage_limit' => 'integer',
        'usage_count' => 'integer',
        'is_active' => 'boolean',
    ];
}
