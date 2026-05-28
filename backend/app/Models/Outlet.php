<?php
// ---- Outlet Model ----
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Outlet extends Model
{
    use HasUuids;

    protected $fillable = ['tenant_id', 'name', 'address', 'phone', 'timezone', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function tenant(): BelongsTo { return $this->belongsTo(Tenant::class); }
    public function users(): HasMany { return $this->hasMany(User::class); }
    public function shifts(): HasMany { return $this->hasMany(Shift::class); }
    public function inventory(): HasMany { return $this->hasMany(Inventory::class); }
    public function transactions(): HasMany { return $this->hasMany(Transaction::class); }
}
