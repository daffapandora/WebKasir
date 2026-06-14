<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('cashier'); // super_admin, admin, manager, cashier
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('barcode')->unique();
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->bigInteger('cost_price');
            $table->bigInteger('sale_price');
            $table->integer('stock')->default(0);
            $table->integer('min_stock')->default(5);
            $table->string('unit')->default('pcs');
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('has_batch')->default(false);
            $table->timestamps();
        });

        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('batch_number');
            $table->date('expiry_date');
            $table->integer('quantity');
            $table->bigInteger('cost_price');
            $table->timestamps();
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('type'); // in, out, adjustment, transfer, return
            $table->integer('quantity');
            $table->string('reference');
            $table->string('reason')->nullable();
            $table->string('user_name');
            $table->string('branch_name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('product_batches');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('users');
        Schema::dropIfExists('branches');
    }
};
