<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;

class Category extends Model
{
    use BelongsToTenant;

    protected $fillable = ['tenant_id', 'name', 'slug', 'icon', 'color', 'product_count', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'product_count' => 'integer',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
