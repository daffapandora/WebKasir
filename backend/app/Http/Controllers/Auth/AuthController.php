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
        $request->validate(['pin' => 'required|string']);

        // Pin simulation: 1234
        if ($request->pin === '1234') {
            return response()->json([
                'success' => true,
                'message' => 'Kunci berhasil dibuka.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'PIN salah.'
        ], 422);
    }

    public function verifyAdminPin(Request $request)
    {
        $request->validate(['pin' => 'required|string']);

        // Default admin PIN is 0000
        if ($request->pin === '0000') {
            return response()->json([
                'success' => true,
                'message' => 'PIN terverifikasi.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'PIN Admin salah.'
        ], 422);
    }
}
