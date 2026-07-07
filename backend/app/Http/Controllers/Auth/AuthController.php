<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan.'
            ], 403);
        }

        $token = $user->createToken('pos-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'branch_name' => $user->branch ? $user->branch->name : 'Semua Cabang',
                'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                'is_active' => $user->is_active,
                'created_at' => $user->created_at?->toIso8601String(),
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout.'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'branch_name' => $user->branch ? $user->branch->name : 'Semua Cabang',
                'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                'is_active' => $user->is_active,
            ]
        ]);
    }

    public function lock(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Aplikasi berhasil dikunci.'
        ]);
    }

    public function unlock(Request $request)
    {
        $request->validate(['pin' => 'required|string|min:4|max:6']);

        $user = $request->user();

        // Check against the user's stored lock PIN
        // Fall back to default '1234' if no custom PIN is set
        $storedPin = $user->lock_pin;

        if ($storedPin) {
            // Verify against hashed PIN
            if (Hash::check($request->pin, $storedPin)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Kunci berhasil dibuka.'
                ]);
            }
        } else {
            // No custom PIN set — accept default PIN
            if ($request->pin === '1234') {
                return response()->json([
                    'success' => true,
                    'message' => 'Kunci berhasil dibuka.'
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'PIN salah.'
        ], 422);
    }

    public function verifyAdminPin(Request $request)
    {
        $request->validate(['pin' => 'required|string|min:4|max:6']);

        $user = $request->user();

        // Check against the user's stored admin PIN
        // Fall back to default '0000' if no custom PIN is set
        $storedPin = $user->admin_pin;

        if ($storedPin) {
            // Verify against hashed PIN
            if (Hash::check($request->pin, $storedPin)) {
                return response()->json([
                    'success' => true,
                    'message' => 'PIN terverifikasi.'
                ]);
            }
        } else {
            // No custom PIN set — accept default for admin/manager roles only
            if (in_array($user->role, ['super_admin', 'admin', 'manager']) && $request->pin === '0000') {
                return response()->json([
                    'success' => true,
                    'message' => 'PIN terverifikasi.'
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'PIN Admin salah.'
        ], 422);
    }

    /**
     * Update the user's lock PIN or admin PIN.
     */
    public function updatePin(Request $request)
    {
        $request->validate([
            'type' => 'required|in:lock,admin',
            'current_pin' => 'required|string',
            'new_pin' => 'required|string|min:4|max:6',
        ]);

        $user = $request->user();
        $field = $request->type === 'admin' ? 'admin_pin' : 'lock_pin';
        $currentStored = $user->$field;

        // Verify current PIN
        if ($currentStored) {
            if (!Hash::check($request->current_pin, $currentStored)) {
                return response()->json([
                    'success' => false,
                    'message' => 'PIN saat ini salah.'
                ], 422);
            }
        } else {
            // First time setting — verify against default
            $defaultPin = $request->type === 'admin' ? '0000' : '1234';
            if ($request->current_pin !== $defaultPin) {
                return response()->json([
                    'success' => false,
                    'message' => 'PIN saat ini salah.'
                ], 422);
            }
        }

        // Store new hashed PIN
        $user->$field = Hash::make($request->new_pin);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'PIN berhasil diperbarui.'
        ]);
    }
}
