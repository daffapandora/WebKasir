<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * TenantScope automatically filters all queries by the current tenant_id.
 * Applied as a global scope on all tenant-aware models.
 *
 * The tenant_id is resolved from the authenticated user's tenant_id.
 * If no user is authenticated (e.g. artisan commands), the scope is bypassed.
 */
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user && $user->tenant_id) {
            $builder->where($model->getTable() . '.tenant_id', $user->tenant_id);
        }
    }
}
