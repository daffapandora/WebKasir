<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyPoint extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['customer_id', 'transaction_id', 'type', 'points', 'description', 'expires_at', 'created_at'];
    protected $casts = ['expires_at' => 'datetime', 'created_at' => 'datetime'];
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function transaction(): BelongsTo { return $this->belongsTo(Transaction::class); }
}
