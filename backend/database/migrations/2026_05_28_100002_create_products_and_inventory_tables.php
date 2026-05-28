<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create products, variants, and inventory management tables
     */
    public function up(): void
    {
        // Product categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['tenant_id', 'is_active']);
        });

        // Products catalog
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->string('barcode')->nullable()->unique();
            $table->decimal('base_price', 15, 2);
            $table->decimal('cost_price', 15, 2)->nullable();
            $table->boolean('is_recipe_based')->default(false); // Recipe ingredient deduction
            $table->boolean('has_variants')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->string('image_url')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'is_active']);
            $table->fullText(['name', 'sku', 'barcode']); // For fast search
        });

        // Product variants (sizes, colors, preparation methods, etc.)
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name'); // e.g., "Large", "Extra Hot", "No Ice"
            $table->string('sku')->nullable();
            $table->decimal('price_modifier', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
            $table->index(['product_id', 'is_active']);
        });

        // Inventory per outlet
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->integer('quantity')->default(0);
            $table->integer('reserved_quantity')->default(0); // For pending transactions
            $table->integer('reorder_point')->default(10); // Low stock threshold
            $table->integer('reorder_quantity')->default(50);
            $table->string('unit')->default('pcs'); // pieces, kg, liter, etc.
            $table->dateTime('last_stock_check')->nullable();
            $table->timestamps();
            $table->unique(['product_id', 'outlet_id']);
            $table->index(['outlet_id', 'quantity']);
        });

        // Inventory movement logs (audit trail for all stock changes)
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained('inventories')->cascadeOnDelete();
            $table->enum('movement_type', [
                'SALE', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN', 
                'RETURN', 'WASTE', 'DAMAGE', 'STOCK_OPNAME', 'INITIAL_STOCK'
            ]);
            $table->integer('quantity_before');
            $table->integer('quantity_after');
            $table->integer('quantity_changed');
            $table->unsignedBigInteger('reference_id')->nullable(); // transaction_id, transfer_id, po_id
            $table->string('reference_type')->nullable(); // 'Transaction', 'Transfer', 'PO'
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->index(['inventory_id', 'created_at']);
            $table->index(['reference_id', 'reference_type']);
        });

        // Recipes (for food businesses with ingredient-based stock deduction)
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->string('name');
            $table->text('instructions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->index(['outlet_id', 'is_active']);
        });

        // Recipe ingredients with exact quantities needed
        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained('recipes')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('products');
            $table->decimal('quantity_needed', 10, 3);
            $table->string('unit');
            $table->timestamps();
        });

        // Suppliers for purchase orders
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('payment_terms')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['tenant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
