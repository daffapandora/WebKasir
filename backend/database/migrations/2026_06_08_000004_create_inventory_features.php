<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ──────────────────────────────────────────────
        // 1. CATEGORIES: extend dengan parent & deskripsi
        // ──────────────────────────────────────────────
        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')
                  ->constrained('categories')->onDelete('set null');
            $table->text('description')->nullable()->after('color');
            $table->string('type')->default('product')->after('description'); // product, ingredient
            $table->integer('sort_order')->default(0)->after('type');
        });

        // ──────────────────────────────────────────────
        // 2. INGREDIENTS: inventaris bahan baku
        // ──────────────────────────────────────────────
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique()->nullable();
            $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->string('unit');                          // gram, ml, pcs, kg, liter
            $table->decimal('stock', 12, 3)->default(0);
            $table->decimal('min_stock', 12, 3)->default(0);
            $table->decimal('cost_price', 15, 2)->default(0); // harga beli per unit
            $table->decimal('avg_cost_price', 15, 2)->default(0); // weighted average cost
            $table->date('expiry_date')->nullable();
            $table->string('storage_location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'min_stock']);
        });

        // ──────────────────────────────────────────────
        // 3. PRODUCT_INGREDIENTS: resep / bill of materials
        // ──────────────────────────────────────────────
        Schema::create('product_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->decimal('quantity_needed', 10, 3); // takaran per 1 unit produk
            $table->timestamps();

            $table->unique(['product_id', 'ingredient_id']);
            $table->index('product_id');
        });

        // ──────────────────────────────────────────────
        // 4. PRODUCTS: tambah kolom hpp_auto
        // ──────────────────────────────────────────────
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('hpp_auto', 15, 2)->default(0)->after('cost_price')
                  ->comment('HPP kalkulasi otomatis dari product_ingredients');
            $table->boolean('use_recipe')->default(false)->after('hpp_auto')
                  ->comment('true = gunakan resep untuk HPP, false = manual cost_price');
            $table->json('ingredients')->nullable()->after('use_recipe');
        });

        // ──────────────────────────────────────────────
        // 5. DAILY_STOCK_RECORDS: sisa stok harian
        // ──────────────────────────────────────────────
        Schema::create('daily_stock_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->date('record_date');
            $table->decimal('opening_stock', 12, 3);
            $table->decimal('stock_in', 12, 3)->default(0);
            $table->decimal('stock_used', 12, 3)->default(0);
            $table->decimal('stock_wasted', 12, 3)->default(0);
            $table->decimal('closing_stock', 12, 3);
            $table->enum('source', ['auto', 'manual'])->default('auto');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['ingredient_id', 'record_date']);
            $table->index('record_date');
        });

        // ──────────────────────────────────────────────
        // 6. WASTE_LOGS: induk laporan limbah
        // ──────────────────────────────────────────────
        Schema::create('waste_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('user_name'); // snapshot untuk audit historis
            $table->decimal('total_loss_amount', 15, 2)->default(0);
            $table->timestamp('logged_at');
            $table->text('notes')->nullable();
            $table->json('items')->nullable();
            $table->timestamps();

            $table->index('logged_at');
            $table->index('user_id');
        });

        // ──────────────────────────────────────────────
        // 7. WASTE_LOG_ITEMS: detail item limbah (polimorfik)
        // ──────────────────────────────────────────────
        Schema::create('waste_log_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waste_log_id')->constrained('waste_logs')->onDelete('cascade');
            $table->string('wasted_type');           // App\Models\Ingredient | App\Models\Product
            $table->unsignedBigInteger('wasted_id');
            $table->string('item_name');             // snapshot nama untuk audit
            $table->string('unit');                  // snapshot satuan
            $table->decimal('quantity', 10, 3);
            $table->decimal('cost_at_time', 15, 2); // HPP terkunci saat pencatatan
            $table->decimal('total_cost', 15, 2)->storedAs('quantity * cost_at_time');
            $table->enum('reason', [
                'expired', 'spoiled', 'unsold', 'production_error', 'other'
            ]);
            $table->text('reason_detail')->nullable();
            $table->timestamps();

            $table->index(['wasted_type', 'wasted_id']); // optimasi query polimorfik
            $table->index('waste_log_id');
        });

        // ──────────────────────────────────────────────
        // 8. RESTOCK_DRAFTS: draf rekomendasi pemesanan
        // ──────────────────────────────────────────────
        Schema::create('restock_drafts', function (Blueprint $table) {
            $table->id();
            $table->string('draft_number')->unique();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['draft', 'approved', 'converted', 'cancelled'])->default('draft');
            $table->date('suggested_order_date')->nullable();
            $table->decimal('estimated_total', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('restock_draft_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restock_draft_id')->constrained('restock_drafts')->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->decimal('current_stock', 12, 3);
            $table->decimal('min_stock', 12, 3);
            $table->decimal('suggested_qty', 12, 3);
            $table->decimal('unit_cost', 15, 2);
            $table->decimal('estimated_subtotal', 15, 2)->storedAs('suggested_qty * unit_cost');
            $table->enum('priority', ['critical', 'low', 'normal'])->default('normal');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restock_draft_items');
        Schema::dropIfExists('restock_drafts');
        Schema::dropIfExists('waste_log_items');
        Schema::dropIfExists('waste_logs');
        Schema::dropIfExists('daily_stock_records');
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['hpp_auto', 'use_recipe']);
        });
        Schema::dropIfExists('product_ingredients');
        Schema::dropIfExists('ingredients');
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'description', 'type', 'sort_order']);
        });
    }
};
