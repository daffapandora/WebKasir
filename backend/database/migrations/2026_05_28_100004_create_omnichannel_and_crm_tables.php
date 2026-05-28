<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create omnichannel (GoFood, GrabFood, etc.) and CRM tables
     */
    public function up(): void
    {
        // Online platforms configuration
        Schema::create('online_platforms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->enum('platform_name', ['GOFOOD', 'GRABFOOD', 'SHOPEE', 'TOKOPEDIA', 'CUSTOM']);
            $table->string('merchant_id')->nullable();
            $table->string('api_key');
            $table->string('api_secret')->nullable();
            $table->string('webhook_secret')->nullable();
            $table->string('webhook_url')->nullable();
            $table->integer('sync_interval_minutes')->default(5);
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable(); // Platform-specific settings
            $table->timestamps();
            $table->unique(['outlet_id', 'platform_name']);
        });

        // Online orders from food delivery platforms
        Schema::create('online_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('online_platform_id')->constrained('online_platforms')->cascadeOnDelete();
            $table->string('external_order_id')->unique(); // Platform's order ID
            
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->text('delivery_address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            
            $table->decimal('total_amount', 15, 2);
            $table->json('order_items'); // JSON snapshot of items
            $table->json('delivery_fee')->nullable();
            
            $table->enum('order_status', [
                'NEW', 'ACCEPTED', 'PREPARING', 'READY', 
                'PICKED_UP', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED'
            ])->default('NEW');
            
            // Sync to main transaction
            $table->foreignId('synced_transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->enum('sync_status', ['PENDING', 'SYNCING', 'SYNCED', 'FAILED'])->default('PENDING');
            $table->dateTime('synced_at')->nullable();
            $table->text('sync_error_message')->nullable();
            
            // Scheduled delivery time
            $table->dateTime('scheduled_delivery_time')->nullable();
            
            // Metadata
            $table->json('raw_payload'); // Original platform payload for debugging
            $table->json('notes')->nullable();
            
            $table->timestamps();
            $table->index(['outlet_id', 'order_status']);
            $table->index(['platform_name' => 'online_platform_id', 'created_at']);
            $table->index(['sync_status', 'created_at']);
        });

        // Customer Relationship Management
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('outlet_id')->nullable()->constrained('outlets')->nullOnDelete();
            $table->string('name');
            $table->string('phone')->nullable()->unique();
            $table->string('email')->nullable()->unique();
            $table->text('address')->nullable();
            
            // Loyalty program
            $table->decimal('total_spent', 15, 2)->default(0);
            $table->integer('total_transactions')->default(0);
            $table->integer('loyalty_points_balance')->default(0);
            $table->enum('membership_tier', ['REGULAR', 'SILVER', 'GOLD', 'PLATINUM'])->default('REGULAR');
            
            // CRM info
            $table->dateTime('last_transaction_at')->nullable();
            $table->dateTime('member_since')->nullable();
            $table->json('metadata')->nullable(); // Custom fields
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['tenant_id', 'is_active']);
            $table->index(['membership_tier']);
        });

        // Loyalty point transactions
        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            
            $table->enum('type', ['EARN', 'REDEEM', 'ADJUSTMENT', 'EXPIRY']);
            $table->integer('points_value');
            $table->integer('balance_after');
            $table->string('description')->nullable();
            $table->dateTime('expiry_date')->nullable();
            
            $table->timestamps();
            $table->index(['customer_id', 'created_at']);
        });

        // Promotion/Promo codes
        Schema::create('promo_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('description')->nullable();
            
            $table->enum('discount_type', ['PERCENTAGE', 'FIXED_AMOUNT']);
            $table->decimal('discount_value', 10, 2);
            $table->decimal('minimum_amount', 15, 2)->nullable();
            $table->decimal('maximum_discount', 15, 2)->nullable();
            
            $table->integer('max_uses')->nullable();
            $table->integer('uses_count')->default(0);
            $table->dateTime('valid_from');
            $table->dateTime('valid_until');
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['tenant_id', 'code', 'is_active']);
        });

        // Purchase Orders for suppliers
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            
            $table->string('po_number')->unique();
            $table->dateTime('po_date');
            $table->dateTime('expected_delivery_date');
            $table->dateTime('actual_delivery_date')->nullable();
            
            $table->enum('status', ['DRAFT', 'SENT', 'ACKNOWLEDGED', 'DELIVERED', 'CANCELLED'])->default('DRAFT');
            $table->decimal('total_amount', 15, 2)->default(0);
            
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->dateTime('approved_at')->nullable();
            
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['outlet_id', 'status']);
        });

        // Purchase Order Items
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            
            $table->integer('quantity_ordered');
            $table->integer('quantity_received')->default(0);
            $table->integer('quantity_rejected')->default(0);
            
            $table->decimal('unit_price', 15, 2);
            $table->decimal('line_total', 15, 2);
            
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['purchase_order_id']);
        });

        // Inter-branch stock transfers
        Schema::create('inter_branch_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('from_outlet_id')->constrained('outlets');
            $table->foreignId('to_outlet_id')->constrained('outlets');
            
            $table->string('transfer_number')->unique();
            $table->enum('status', ['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED'])->default('DRAFT');
            
            $table->dateTime('transfer_date')->nullable();
            $table->dateTime('received_date')->nullable();
            
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->foreignId('received_by')->nullable()->constrained('users');
            
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['from_outlet_id', 'status']);
            $table->index(['to_outlet_id', 'status']);
        });

        // Transfer Items
        Schema::create('transfer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transfer_id')->constrained('inter_branch_transfers')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            
            $table->integer('quantity_sent');
            $table->integer('quantity_received')->default(0);
            $table->integer('quantity_lost')->default(0);
            
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['transfer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_items');
        Schema::dropIfExists('inter_branch_transfers');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('promo_codes');
        Schema::dropIfExists('loyalty_points');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('online_orders');
        Schema::dropIfExists('online_platforms');
    }
};
