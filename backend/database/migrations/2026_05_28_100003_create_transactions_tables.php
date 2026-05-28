<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create transaction, payment, and shift management tables
     */
    public function up(): void
    {
        // Shifts for cashier accountability and daily reconciliation
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('cashier_id')->constrained('users');
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('closing_balance', 15, 2)->nullable();
            $table->enum('status', ['OPEN', 'CLOSED', 'ABANDONED'])->default('OPEN');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['outlet_id', 'status']);
            $table->index(['cashier_id', 'created_at']);
        });

        // Main transaction table (Point of Sale transaction)
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('shift_id')->nullable()->constrained('shifts')->nullOnDelete();
            $table->string('order_number')->unique()->index(); // ORD-20260528-0042
            $table->foreignId('created_by')->constrained('users');
            
            // Pricing breakdown (for accurate accounting)
            $table->decimal('subtotal_amount', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            
            // Payment details
            $table->enum('payment_method', ['CASH', 'CARD', 'QRIS', 'MIXED', 'OFFLINE'])->default('CASH');
            $table->enum('payment_status', ['PENDING', 'COMPLETED', 'FAILED'])->default('PENDING');
            $table->json('payment_details')->nullable(); // EDC response, reference numbers, QR code data
            
            // Transaction lifecycle
            $table->enum('status', ['PENDING', 'COMPLETED', 'VOIDED', 'REFUNDED', 'HELD'])->default('PENDING');
            $table->dateTime('held_at')->nullable(); // For held transactions
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('voided_at')->nullable();
            
            // Void information (audit trail)
            $table->text('void_reason')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users');
            $table->boolean('manager_pin_verified')->default(false);
            
            // Customer info (optional)
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->unsignedBigInteger('customer_id')->nullable();
            
            // Metadata (extra data, notes, custom fields)
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['outlet_id', 'status', 'created_at']);
            $table->index(['shift_id', 'created_at']);
            $table->index(['created_by']);
            $table->index(['payment_status']);
        });

        // Transaction line items (products sold)
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            
            // Item details snapshot (preserve historical data)
            $table->string('product_name');
            $table->string('product_sku');
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_per_item', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2);
            $table->text('notes')->nullable(); // Special instructions (no ice, extra spicy, etc.)
            
            $table->timestamps();
            $table->index(['transaction_id']);
        });

        // Payment records (support split payments)
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->enum('payment_method', ['CASH', 'CARD', 'QRIS']);
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['PENDING', 'COMPLETED', 'FAILED'])->default('PENDING');
            $table->json('gateway_response')->nullable(); // EDC or QRIS provider response
            $table->string('reference_number')->nullable(); // EDC approval code or QRIS reference
            $table->string('batch_number')->nullable(); // For EDC batch reconciliation
            $table->timestamps();
            $table->index(['transaction_id']);
        });

        // Transaction discounts/Promotions applied
        Schema::create('transaction_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->string('discount_code')->nullable();
            $table->enum('discount_type', ['PERCENTAGE', 'FIXED']);
            $table->decimal('discount_value', 10, 2);
            $table->decimal('discount_amount', 15, 2);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Audit log for all transaction modifications
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('action');
            $table->unsignedBigInteger('transaction_id')->nullable();
            $table->json('details')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
            $table->index(['transaction_id', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('transaction_discounts');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('transaction_items');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('shifts');
    }
};
