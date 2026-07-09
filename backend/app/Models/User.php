<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Models\Traits\BelongsToTenant;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, BelongsToTenant;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'branch_id',
        'branch_name',
        'permissions',
        'is_active',
        'lock_pin',
        'admin_pin',
        'tenant_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'lock_pin',
        'admin_pin',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'permissions' => 'array',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function shifts()
    {
        return $this->hasMany(Shift::class, 'cashier_id');
    }
}
