<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyConfig extends Model
{
    protected $table = 'loyalty_configs';

    protected $fillable = [
        'points_per_amount', 'amount_threshold', 'point_value', 'min_redeem_points',
        'bronze_threshold', 'silver_threshold', 'gold_threshold', 'is_active'
    ];

    protected $casts = [
        'points_per_amount' => 'integer',
        'amount_threshold' => 'integer',
        'point_value' => 'integer',
        'min_redeem_points' => 'integer',
        'bronze_threshold' => 'integer',
        'silver_threshold' => 'integer',
        'gold_threshold' => 'integer',
        'is_active' => 'boolean',
    ];
}
