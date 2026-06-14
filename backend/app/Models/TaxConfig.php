<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxConfig extends Model
{
    protected $table = 'tax_configs';

    protected $fillable = [
        'name', 'rate', 'type', 'is_inclusive', 'apply_before_discount', 'is_active', 'label'
    ];

    protected $casts = [
        'rate' => 'float',
        'is_inclusive' => 'boolean',
        'apply_before_discount' => 'boolean',
        'is_active' => 'boolean',
    ];
}
