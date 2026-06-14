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
        ]);

        $data['password'] = Hash::make($data['password']);

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
        ]);

        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
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
