<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * BaseModel - Multi-tenant scoped base class
 * Automatically scopes all queries to the current tenant
 */
abstract class BaseModel extends Model
{
    use SoftDeletes;

    protected static function boot()
    {
        parent::boot();

        // Auto-scope all queries to tenant_id
        static::addGlobalScope('tenant', function ($builder) {
            $tenantId = Auth::user()?->tenant_id ?? request()->header('X-Tenant-ID');
            
            if ($tenantId && property_exists($builder->getModel(), 'table')) {
                // Check if this model has a tenant_id column
                $columns = \Schema::getColumnListing($builder->getModel()->getTable());
                if (in_array('tenant_id', $columns)) {
                    $builder->where('tenant_id', $tenantId);
                }
            }
        });

        // Auto-set tenant_id on creation
        static::creating(function ($model) {
            if (! $model->tenant_id && Auth::check()) {
                $model->tenant_id = Auth::user()->tenant_id;
            }
        });
    }
}
