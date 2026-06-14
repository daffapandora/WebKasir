<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained('transactions')->onDelete('cascade');
            $table->decimal('quantity_used', 10, 3);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        if (Schema::hasTable('ingredients')) {
            Schema::table('ingredients', function (Blueprint $table) {
                if (!Schema::hasColumn('ingredients', 'notes')) {
                    $table->text('notes')->nullable()->after('storage_location');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_usage_logs');
        
        if (Schema::hasTable('ingredients')) {
            Schema::table('ingredients', function (Blueprint $table) {
                if (Schema::hasColumn('ingredients', 'notes')) {
                    $table->dropColumn('notes');
                }
            });
        }
    }
};
