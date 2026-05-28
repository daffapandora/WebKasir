<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

class VerifyManagerPin
{
    /**
     * Handle an incoming request requiring a manager PIN override.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Require manager_pin in the header or body
        $pin = $request->header('X-Manager-PIN') ?? $request->input('manager_pin');
        $managerId = $request->header('X-Manager-ID') ?? $request->input('manager_id');

        if (!$pin || !$managerId) {
            return response()->json([
                'success' => false,
                'message' => 'Manager PIN and ID are required for this action.',
            ], 403);
        }

        // Rate limit by IP + Manager ID to prevent brute-force
        $key = 'pin-attempt:' . $managerId . ':' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many PIN attempts. Please try again later.',
            ], 429);
        }

        $manager = User::where('id', $managerId)
            ->where('tenant_id', $request->user()->tenant_id)
            ->whereIn('role', ['owner', 'manager'])
            ->first();

        if (!$manager || !$manager->pin_hash || !Hash::check($pin, $manager->pin_hash)) {
            RateLimiter::hit($key, 300); // Lockout for 5 minutes after 5 fails
            return response()->json([
                'success' => false,
                'message' => 'Invalid Manager PIN.',
            ], 403);
        }

        RateLimiter::clear($key);

        // Append the manager to the request for the controller to use
        $request->attributes->add(['authorizing_manager' => $manager]);

        return $next($request);
    }
}
