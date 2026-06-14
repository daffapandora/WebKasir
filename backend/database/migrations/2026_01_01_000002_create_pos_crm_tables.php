<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->unique();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('membership_tier')->default('none'); // bronze, silver, gold, none
            $table->integer('loyalty_points')->default(0);
            $table->bigInteger('total_spent')->default(0);
            $table->integer('total_transactions')->default(0);
            $table->timestamp('last_visit')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('customer_name');
            $table->string('type'); // earn, redeem, adjust, expire
            $table->integer('points');
            $table->integer('balance_after');
            $table->string('reference')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('loyalty_configs', function (Blueprint $table) {
            $table->id();
            $table->integer('points_per_amount');
            $table->bigInteger('amount_threshold');
            $table->integer('point_value');
            $table->integer('min_redeem_points');
            $table->integer('bronze_threshold')->default(100);
            $table->integer('silver_threshold')->default(500);
            $table->integer('gold_threshold')->default(1500);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('type'); // fixed, percentage
            $table->bigInteger('value');
            $table->string('scope'); // product, cart
            $table->bigInteger('min_purchase')->nullable();
            $table->bigInteger('max_discount')->nullable();
            $table->boolean('membership_only')->default(false);
            $table->string('membership_tier')->nullable();
            $table->json('product_ids')->nullable(); // JSON list of product IDs
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->integer('usage_limit')->nullable();
            $table->integer('usage_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->bigInteger('total');
            $table->string('status')->default('draft'); // draft, sent, partial, received, cancelled
            $table->string('notes')->nullable();
            $table->string('created_by');
            $table->timestamps();
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('product_name');
            $table->integer('quantity');
            $table->integer('received_quantity')->default(0);
            $table->bigInteger('unit_cost');
            $table->bigInteger('subtotal');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('discounts');
        Schema::dropIfExists('loyalty_configs');
        Schema::dropIfExists('loyalty_transactions');
        Schema::dropIfExists('customers');
    }
};
