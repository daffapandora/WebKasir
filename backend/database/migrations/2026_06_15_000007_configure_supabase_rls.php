<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $tables = [
            'branches',
            'categories',
            'products',
            'customers',
            'users',
            'suppliers',
            'ingredients',
            'tax_configs',
            'discounts',
            'shifts',
            'transactions',
            'transaction_items',
            'payments',
            'stock_movements',
            'ingredient_usage_logs',
            'waste_logs',
            'waste_log_items',
            'purchase_orders',
            'purchase_order_items',
            'audit_logs',
            'loyalty_transactions',
            'loyalty_configs',
            'product_batches',
            'product_ingredients',
            'daily_stock_records'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                // Enable RLS and create public allow-all policies to restore access for the frontend
                DB::statement("ALTER TABLE \"{$table}\" ENABLE ROW LEVEL SECURITY;");
                DB::statement("DROP POLICY IF EXISTS \"Allow all {$table}\" ON \"{$table}\";");
                DB::statement("CREATE POLICY \"Allow all {$table}\" ON \"{$table}\" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $tables = [
            'branches',
            'categories',
            'products',
            'customers',
            'users',
            'suppliers',
            'ingredients',
            'tax_configs',
            'discounts',
            'shifts',
            'transactions',
            'transaction_items',
            'payments',
            'stock_movements',
            'ingredient_usage_logs',
            'waste_logs',
            'waste_log_items',
            'purchase_orders',
            'purchase_order_items',
            'audit_logs',
            'loyalty_transactions',
            'loyalty_configs',
            'product_batches',
            'product_ingredients',
            'daily_stock_records'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("DROP POLICY IF EXISTS \"Allow all {$table}\" ON \"{$table}\";");
                DB::statement("ALTER TABLE \"{$table}\" DISABLE ROW LEVEL SECURITY;");
            }
        }
    }
};
