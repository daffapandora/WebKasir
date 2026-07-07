<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * TenantMiddleware — validates that authenticated users have a tenant_id.
 *
 * This middleware:
 * 1. Ensures tenant_id exists on the authenticated user
 * 2. Checks tenant is active and not expired
 * 3. Rejects requests from users without valid tenants
 *
 * Applied after auth:sanctum on all protected routes.
 */
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Ensure user has a tenant_id
        if (!$user->tenant_id) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda belum terhubung ke tenant. Hubungi administrator.',
                'error' => 'TENANT_NOT_ASSIGNED',
            ], 403);
        }

        // Load and validate the tenant
        $tenant = \App\Models\Tenant::find($user->tenant_id);

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant tidak ditemukan.',
                'error' => 'TENANT_NOT_FOUND',
            ], 403);
        }

        if (!$tenant->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun bisnis Anda sedang dinonaktifkan.',
                'error' => 'TENANT_INACTIVE',
            ], 403);
        }

        if ($tenant->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Langganan Anda telah berakhir. Perpanjang untuk melanjutkan.',
                'error' => 'TENANT_EXPIRED',
            ], 403);
        }

        // Store tenant in request for downstream use
        $request->attributes->set('tenant', $tenant);

        return $next($request);
    }
}
