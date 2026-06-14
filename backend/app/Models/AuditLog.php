<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id', 'user_name', 'action', 'module', 'description',
        'old_value', 'new_value', 'ip_address', 'branch_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
