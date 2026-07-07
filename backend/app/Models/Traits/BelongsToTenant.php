<?php

namespace App\Models\Traits;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;

/**
 * BelongsToTenant trait — add to any model that has a tenant_id column.
 *
 * This trait:
 * 1. Applies the TenantScope global scope (auto-filter by tenant_id)
 * 2. Auto-sets tenant_id on creation from the authenticated user
 * 3. Provides a tenant() relationship
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        // Auto-assign tenant_id on creation
        static::creating(function ($model) {
            if (!$model->tenant_id) {
                $user = auth()->user();
                if ($user && $user->tenant_id) {
                    $model->tenant_id = $user->tenant_id;
                }
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
