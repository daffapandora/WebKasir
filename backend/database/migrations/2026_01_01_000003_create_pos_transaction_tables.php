<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cashier_id')->constrained('users')->onDelete('cascade');
            $table->string('cashier_name');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('branch_name');
            $table->bigInteger('opening_cash');
            $table->bigInteger('closing_cash')->nullable();
            $table->bigInteger('expected_cash')->nullable();
            $table->bigInteger('difference')->nullable();
            $table->bigInteger('total_sales')->default(0);
            $table->integer('total_transactions')->default(0);
            $table->bigInteger('total_cash_sales')->default(0);
            $table->bigInteger('total_non_cash_sales')->default(0);
            $table->string('status')->default('open'); // open, closed
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('branch_name');
            $table->foreignId('cashier_id')->constrained('users')->onDelete('cascade');
            $table->string('cashier_name');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->string('customer_name')->nullable();
            $table->bigInteger('subtotal');
            $table->bigInteger('discount_amount')->default(0);
            $table->bigInteger('tax_amount')->default(0);
            $table->bigInteger('service_charge')->default(0);
            $table->bigInteger('total');
            $table->bigInteger('change_amount')->default(0);
            $table->string('status')->default('completed'); // completed, voided, refunded, held
            $table->string('voided_by')->nullable();
            $table->string('void_reason')->nullable();
            $table->string('refunded_by')->nullable();
            $table->string('refund_reason')->nullable();
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('product_name');
            $table->string('sku');
            $table->integer('quantity');
            $table->bigInteger('unit_price');
            $table->bigInteger('discount_amount')->default(0);
            $table->bigInteger('subtotal');
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->onDelete('cascade');
            $table->string('method'); // cash, qris, card, transfer, loyalty
            $table->bigInteger('amount');
            $table->string('reference')->nullable();
            $table->timestamps();
        });

        Schema::create('tax_configs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->double('rate');
            $table->string('type'); // vat, service, restaurant
            $table->boolean('is_inclusive')->default(false);
            $table->boolean('apply_before_discount')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('label')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('user_name');
            $table->string('action');
            $table->string('module');
            $table->string('description');
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->string('ip_address')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('tax_configs');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('transaction_items');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('shifts');
    }
};
