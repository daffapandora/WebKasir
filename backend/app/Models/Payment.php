<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['transaction_id', 'method', 'amount', 'reference'];

    protected $casts = [
        'amount' => 'integer',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
