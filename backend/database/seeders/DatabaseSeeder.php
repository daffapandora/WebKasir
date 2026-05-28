<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Tenant;
use App\Models\Outlet;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Tenant
        $tenant = Tenant::create([
            'name' => 'Demo Enterprise',
            'subscription_plan' => 'pro',
            'settings' => ['tax_rate' => 11]
        ]);

        // 2. Create Outlet
        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Toko KasirPro Pusat',
            'address' => 'Jl. Jend. Sudirman No. 1, Jakarta',
            'phone' => '081234567890',
            'timezone' => 'Asia/Jakarta'
        ]);

        // 3. Create Users
        User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Admin Owner',
            'email' => 'admin@kasirpro.com',
            'password' => Hash::make('password'),
            'pin_hash' => Hash::make('123456'), // Manager PIN
            'role' => 'owner'
        ]);

        User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Kasir 1',
            'email' => 'kasir@kasirpro.com',
            'password' => Hash::make('password'),
            'role' => 'cashier'
        ]);

        // 4. Create Categories
        $categories = [
            Category::create(['tenant_id' => $tenant->id, 'name' => 'Makanan', 'slug' => 'makanan', 'sort_order' => 1]),
            Category::create(['tenant_id' => $tenant->id, 'name' => 'Minuman', 'slug' => 'minuman', 'sort_order' => 2]),
            Category::create(['tenant_id' => $tenant->id, 'name' => 'Snack', 'slug' => 'snack', 'sort_order' => 3]),
        ];

        // 5. Create Products & Variants
        $this->createProductWithInventory($tenant, $outlet, $categories[0], 'Nasi Goreng Spesial', 'NG001', '8991234567890', [
            ['name' => 'Regular', 'sku' => 'NG001-R', 'cost' => 12000, 'price' => 18000, 'stock' => 50],
            ['name' => 'Jumbo', 'sku' => 'NG001-J', 'cost' => 16000, 'price' => 25000, 'stock' => 30],
        ]);

        $this->createProductWithInventory($tenant, $outlet, $categories[1], 'Es Teh Manis', 'ET001', '8991234567891', [
            ['name' => 'Default', 'sku' => 'ET001-D', 'cost' => 2000, 'price' => 5000, 'stock' => 100],
        ]);

        $this->createProductWithInventory($tenant, $outlet, $categories[1], 'Kopi Susu Gula Aren', 'KS001', '8991234567892', [
            ['name' => 'Small', 'sku' => 'KS001-S', 'cost' => 5000, 'price' => 12000, 'stock' => 40],
            ['name' => 'Large', 'sku' => 'KS001-L', 'cost' => 7000, 'price' => 18000, 'stock' => 25],
        ]);
        
        $this->createProductWithInventory($tenant, $outlet, $categories[2], 'Chitato Sapi Panggang', 'CT001', '8991234567894', [
            ['name' => 'Default', 'sku' => 'CT001-D', 'cost' => 7000, 'price' => 11000, 'stock' => 60],
        ]);
    }

    private function createProductWithInventory($tenant, $outlet, $category, $name, $sku, $barcode, $variantsData)
    {
        $product = Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
            'name' => $name,
            'sku' => $sku,
            'barcode' => $barcode,
        ]);

        $isFirst = true;
        foreach ($variantsData as $v) {
            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'name' => $v['name'],
                'sku' => $v['sku'],
                'cost_price' => $v['cost'],
                'selling_price' => $v['price'],
                'is_default' => $isFirst,
            ]);

            Inventory::create([
                'outlet_id' => $outlet->id,
                'variant_id' => $variant->id,
                'quantity_on_hand' => $v['stock'],
                'low_stock_threshold' => 10,
            ]);

            $isFirst = false;
        }
    }
}
