<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = [
        'transaction_id', 'method', 'amount', 'reference_number', 'status', 'gateway_response',
    ];
    protected $casts = ['amount' => 'decimal:2', 'gateway_response' => 'array'];
    public function transaction(): BelongsTo { return $this->belongsTo(Transaction::class); }
}
