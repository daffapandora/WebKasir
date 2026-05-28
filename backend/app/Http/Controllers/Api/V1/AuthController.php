<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Authenticate user and return token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is deactivated'
            ], 403);
        }

        $user->update(['last_login_at' => now()]);

        // Revoke old tokens to ensure only one active session per device (optional depending on requirement)
        $user->tokens()->delete();

        // Create token with 15 minutes expiration equivalent (usually handled in Sanctum config, but we can set abilities)
        $token = $user->createToken('pos-client')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'accessToken' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'tenant' => $user->tenant_id ? [
                    'id' => $user->tenant->id,
                    'name' => $user->tenant->name,
                ] : null,
                'outlet' => $user->outlet_id ? [
                    'id' => $user->outlet->id,
                    'name' => $user->outlet->name,
                ] : null,
            ]
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['tenant', 'outlet']);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'tenant' => $user->tenant_id ? [
                    'id' => $user->tenant->id,
                    'name' => $user->tenant->name,
                ] : null,
                'outlet' => $user->outlet_id ? [
                    'id' => $user->outlet->id,
                    'name' => $user->outlet->name,
                ] : null,
            ]
        ]);
    }

    /**
     * Refresh the access token
     */
    public function refresh(Request $request)
    {
        $user = $request->user();
        $user->tokens()->where('id', $user->currentAccessToken()->id)->delete();
        $token = $user->createToken('pos-client')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'accessToken' => $token
            ]
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}
