<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class EnsureTenantScope
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            
            // Set the tenant scope implicitly for all subsequent queries
            // This can be done via Global Scopes on the models, or by injecting into the request.
            // For simplicity, we'll ensure the request always carries the tenant_id.
            $request->merge(['tenant_id' => $user->tenant_id]);
            
            // If the user is scoped to a specific outlet, enforce that too
            if ($user->outlet_id) {
                $request->merge(['outlet_id' => $user->outlet_id]);
            }
        }

        return $next($request);
    }
}
