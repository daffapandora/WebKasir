<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = [
        'inventory_id', 'user_id', 'type', 'quantity_change', 'quantity_before',
        'quantity_after', 'reference_type', 'reference_id', 'notes', 'created_at'
    ];
    protected $casts = ['created_at' => 'datetime'];
    public function inventory(): BelongsTo { return $this->belongsTo(Inventory::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
