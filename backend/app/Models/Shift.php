<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = [
        'outlet_id', 'user_id', 'opened_by', 'closed_by',
        'starting_cash', 'ending_cash', 'expected_cash', 'cash_difference',
        'total_transactions', 'total_revenue', 'status', 'opened_at', 'closed_at', 'notes',
    ];
    protected $casts = [
        'starting_cash' => 'decimal:2', 'ending_cash' => 'decimal:2',
        'expected_cash' => 'decimal:2', 'cash_difference' => 'decimal:2',
        'total_revenue' => 'decimal:2', 'opened_at' => 'datetime', 'closed_at' => 'datetime',
    ];
    public function outlet(): BelongsTo { return $this->belongsTo(Outlet::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function transactions(): HasMany { return $this->hasMany(Transaction::class); }
    public function isOpen(): bool { return $this->status === 'open'; }
}
