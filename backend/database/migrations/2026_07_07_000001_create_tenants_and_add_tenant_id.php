<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Create the tenants master table and add tenant_id to all operational tables.
     */
    public function up(): void
    {
        // 1. Create tenants master table
        Schema::create('tenants', function (Blueprint $table) {
            if (DB::getDriverName() === 'sqlite') {
                $table->uuid('id')->primary();
            } else {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            }
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('plan')->default('basic'); // basic, pro, enterprise
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // 2. Add tenant_id to all operational tables
        $tables = [
            'branches',
            'categories',
            'products',
            'product_batches',
            'customers',
            'users',
            'suppliers',
            'ingredients',
            'tax_configs',
            'discounts',
            'shifts',
            'transactions',
            'transaction_items',
            'stock_movements',
            'ingredient_usage_logs',
            'waste_logs',
            'purchase_orders',
            'audit_logs',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && !Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->uuid('tenant_id')->nullable()->after('id');
                    $table->index('tenant_id');
                });
            }
        }

        // 3. Add lock_pin and admin_pin to users table
        if (Schema::hasTable('users')) {
            if (!Schema::hasColumn('users', 'lock_pin')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('lock_pin')->nullable()->after('password');
                });
            }
            if (!Schema::hasColumn('users', 'admin_pin')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('admin_pin')->nullable()->after('lock_pin');
                });
            }
        }

        // 4. Create a default tenant and assign all existing data
        $uuid = (string) \Illuminate\Support\Str::uuid();
        $defaultTenantId = DB::table('tenants')->insertGetId([
            'id' => DB::getDriverName() === 'sqlite' ? $uuid : DB::raw('gen_random_uuid()'),
            'name' => 'Default Tenant',
            'slug' => 'default',
            'plan' => 'pro',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id');

        // Assign existing rows to the default tenant
        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                DB::table($tableName)
                    ->whereNull('tenant_id')
                    ->update(['tenant_id' => $defaultTenantId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'branches', 'categories', 'products', 'product_batches',
            'customers', 'users', 'suppliers', 'ingredients',
            'tax_configs', 'discounts', 'shifts', 'transactions',
            'transaction_items', 'stock_movements', 'ingredient_usage_logs',
            'waste_logs', 'purchase_orders', 'audit_logs',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropIndex(['tenant_id']);
                    $table->dropColumn('tenant_id');
                });
            }
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'lock_pin')) {
                    $table->dropColumn('lock_pin');
                }
                if (Schema::hasColumn('users', 'admin_pin')) {
                    $table->dropColumn('admin_pin');
                }
            });
        }

        Schema::dropIfExists('tenants');
    }
};
