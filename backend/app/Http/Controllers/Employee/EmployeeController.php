<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index()
    {
        $users = User::with('branch')->get();

        return response()->json([
            'success' => true,
            'data' => $users->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'branch_id' => $user->branch_id,
                    'branch_name' => $user->branch ? $user->branch->name : 'Semua Cabang',
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at->toIso8601String(),
                    'has_lock_pin' => !empty($user->lock_pin),
                    'has_admin_pin' => !empty($user->admin_pin),
                ];
            })
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:191',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:super_admin,admin,manager,cashier',
            'branch_id' => 'required|exists:branches,id',
            'lock_pin' => 'nullable|string|min:4|max:6',
            'admin_pin' => 'nullable|string|min:4|max:6',
        ]);

        $data['password'] = Hash::make($data['password']);
        
        if (isset($data['lock_pin']) && !empty($data['lock_pin'])) {
            $data['lock_pin'] = Hash::make($data['lock_pin']);
        }
        if (isset($data['admin_pin']) && !empty($data['admin_pin'])) {
            $data['admin_pin'] = Hash::make($data['admin_pin']);
        }

        $user = User::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Karyawan berhasil ditambahkan.',
            'data' => $user
        ]);
    }

    public function update(Request $request, User $employee)
    {
        $data = $request->validate([
            'name' => 'string|max:191',
            'email' => 'email|unique:users,email,' . $employee->id,
            'password' => 'nullable|string|min:6',
            'role' => 'in:super_admin,admin,manager,cashier',
            'branch_id' => 'exists:branches,id',
            'is_active' => 'boolean',
            'lock_pin' => 'nullable|string|min:4|max:6',
            'admin_pin' => 'nullable|string|min:4|max:6',
        ]);

        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (isset($data['lock_pin'])) {
            if (!empty($data['lock_pin'])) {
                $data['lock_pin'] = Hash::make($data['lock_pin']);
            } else {
                $data['lock_pin'] = null;
            }
        }
        if (isset($data['admin_pin'])) {
            if (!empty($data['admin_pin'])) {
                $data['admin_pin'] = Hash::make($data['admin_pin']);
            } else {
                $data['admin_pin'] = null;
            }
        }

        $employee->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Data karyawan berhasil diperbarui.',
            'data' => $employee
        ]);
    }

    public function destroy(User $employee)
    {
        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Karyawan berhasil dihapus.'
        ]);
    }
}
