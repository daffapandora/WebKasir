<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasUuids;
    protected $fillable = [
        'tenant_id', 'outlet_id', 'supplier_id', 'created_by', 'po_number',
        'status', 'total_amount', 'expected_date', 'received_date', 'notes'
    ];
    protected $casts = [
        'total_amount' => 'decimal:2', 'expected_date' => 'date', 'received_date' => 'date'
    ];
    public function tenant(): BelongsTo { return $this->belongsTo(Tenant::class); }
    public function outlet(): BelongsTo { return $this->belongsTo(Outlet::class); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function items(): HasMany { return $this->hasMany(PurchaseOrderItem::class); }
}
