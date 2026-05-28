<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * EnsureTenantContext - Ensures every request has valid tenant context
 * Sets tenant from authenticated user or request header for API consistency
 */
class EnsureTenantContext
{
    public function handle(Request $request, Closure $next)
    {
        $tenantId = null;

        // 1. Get tenant from authenticated user
        if (Auth::check()) {
            $tenantId = Auth::user()->tenant_id;
        }

        // 2. Fallback to X-Tenant-ID header (for testing/API clients)
        if (!$tenantId && $request->header('X-Tenant-ID')) {
            $tenantId = $request->header('X-Tenant-ID');
        }

        if (!$tenantId) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant context not found'
            ], 400);
        }

        // Store tenant context for later use (in BaseModel global scope)
        $request->attributes->set('tenant_id', $tenantId);

        return $next($request);
    }
}

/**
 * VerifyManagerPin - Middleware to verify manager PIN for sensitive operations
 * Used for transaction voids, refunds, and other authorization-required actions
 */
class VerifyManagerPin
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        // Check if user has manager role
        if (!$user->hasPermissionTo('void_transaction')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission for this operation'
            ], 403);
        }

        // Verify manager PIN from request
        if ($request->has('manager_pin')) {
            if (!\Illuminate\Support\Facades\Hash::check($request->manager_pin, $user->pin_hash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid manager PIN'
                ], 401);
            }
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Manager PIN required'
            ], 422);
        }

        return $next($request);
    }
}

/**
 * CheckOutletAccess - Verify user is authorized to access the requested outlet
 * Restricts users to their assigned outlet(s)
 */
class CheckOutletAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        $outletId = $request->outlet_id ?? $request->route('outlet_id');

        // Admins/owners have access to all outlets
        if ($user->role === 'owner' || $user->role === 'manager') {
            return $next($request);
        }

        // Regular users restricted to their assigned outlet
        if ($user->outlet_id && $user->outlet_id !== $outletId) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to access this outlet'
            ], 403);
        }

        return $next($request);
    }
}
