<?php

namespace App\Events;

use App\Models\Transaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithBroadcasting;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * TransactionCreated - Broadcast when transaction completes
 * Notifies CFD, dashboard, and other outlets about new transactions
 */
class TransactionCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithBroadcasting, SerializesModels;

    public function __construct(public Transaction $transaction) {
        $this->broadcastOn();
    }

    public function broadcastOn(): array
    {
        return [
            // Private channel for specific outlet (CFD display)
            new PrivateChannel('outlet.' . $this->transaction->outlet_id),
            // Broadcast to CFD (customer-facing display)
            new PrivateChannel('cfd.' . $this->transaction->outlet_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'transaction.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->transaction->id,
            'order_number' => $this->transaction->order_number,
            'total_amount' => $this->transaction->total_amount,
            'payment_method' => $this->transaction->payment_method,
            'status' => $this->transaction->status,
            'items_count' => $this->transaction->items()->count(),
            'created_at' => $this->transaction->created_at,
        ];
    }
}

/**
 * InventoryUpdated - Broadcast when inventory changes significantly
 * Alerts dashboard and other terminals about stock levels
 */
class InventoryUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithBroadcasting, SerializesModels;

    public function __construct(
        public int $productId,
        public int $outletId,
        public int $newQuantity,
        public int $previousQuantity
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('outlet.' . $this->outletId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'inventory.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'product_id' => $this->productId,
            'outlet_id' => $this->outletId,
            'quantity' => $this->newQuantity,
            'previous_quantity' => $this->previousQuantity,
            'is_low_stock' => $this->newQuantity <= 10,
        ];
    }
}

/**
 * TransactionVoided - Broadcast when transaction is voided
 * Notifies all connected terminals about the void action
 */
class TransactionVoided implements ShouldBroadcast
{
    use Dispatchable, InteractsWithBroadcasting, SerializesModels;

    public function __construct(
        public Transaction $transaction,
        public string $reason
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('outlet.' . $this->transaction->outlet_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'transaction.voided';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->transaction->id,
            'order_number' => $this->transaction->order_number,
            'reason' => $this->reason,
            'voided_by' => $this->transaction->voided_by,
            'voided_at' => $this->transaction->voided_at,
        ];
    }
}
