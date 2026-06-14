<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\TaxConfig;
use App\Models\Discount;
use App\Models\LoyaltyConfig;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Payment;
use App\Models\StockMovement;
use App\Models\Ingredient;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Branches
        $branch1 = Branch::create(['name' => 'Toko Pusat - Jakarta', 'address' => 'Jl. Sudirman No. 12, Jakarta Pusat', 'phone' => '021-5551234', 'is_active' => true]);
        $branch2 = Branch::create(['name' => 'Cabang Selatan - Jakarta', 'address' => 'Jl. Kemang Raya No. 45, Jakarta Selatan', 'phone' => '021-7775678', 'is_active' => true]);
        $branch3 = Branch::create(['name' => 'Cabang Bandung', 'address' => 'Jl. Dago No. 100, Bandung', 'phone' => '022-2501234', 'is_active' => true]);

        // 2. Users (Employees)
        $user1 = User::create(['name' => 'Budi Santoso', 'email' => 'budi@tokoku.id', 'password' => Hash::make('demo123'), 'role' => 'super_admin', 'branch_id' => $branch1->id, 'is_active' => true]);
        $user2 = User::create(['name' => 'Siti Rahayu', 'email' => 'siti@tokoku.id', 'password' => Hash::make('demo123'), 'role' => 'admin', 'branch_id' => $branch1->id, 'is_active' => true]);
        $user3 = User::create(['name' => 'Ahmad Fauzi', 'email' => 'ahmad@tokoku.id', 'password' => Hash::make('demo123'), 'role' => 'manager', 'branch_id' => $branch2->id, 'is_active' => true]);
        $user4 = User::create(['name' => 'Dewi Lestari', 'email' => 'dewi@tokoku.id', 'password' => Hash::make('demo123'), 'role' => 'cashier', 'branch_id' => $branch1->id, 'is_active' => true]);
        $user5 = User::create(['name' => 'Rizki Pratama', 'email' => 'rizki@tokoku.id', 'password' => Hash::make('demo123'), 'role' => 'cashier', 'branch_id' => $branch2->id, 'is_active' => true]);

        // 3. Categories
        $cat1 = Category::create(['name' => 'Makanan', 'slug' => 'makanan', 'icon' => '🍔', 'color' => 'orange', 'is_active' => true]);
        $cat2 = Category::create(['name' => 'Minuman', 'slug' => 'minuman', 'icon' => '🥤', 'color' => 'blue', 'is_active' => true]);
        $cat3 = Category::create(['name' => 'Snack', 'slug' => 'snack', 'icon' => '🍿', 'color' => 'yellow', 'is_active' => true]);
        $cat4 = Category::create(['name' => 'Rokok', 'slug' => 'rokok', 'icon' => '🚬', 'color' => 'red', 'is_active' => true]);
        $cat5 = Category::create(['name' => 'Toiletries', 'slug' => 'toiletries', 'icon' => '🧼', 'color' => 'teal', 'is_active' => true]);
        $cat6 = Category::create(['name' => 'Obat-obatan', 'slug' => 'obat-obatan', 'icon' => '💊', 'color' => 'emerald', 'is_active' => true]);
        $cat7 = Category::create(['name' => 'Lainnya', 'slug' => 'lainnya', 'icon' => '📦', 'color' => 'gray', 'is_active' => true]);

        // 4. Products
        $p1 = Product::create(['name' => 'Indomie Goreng Spesial', 'sku' => 'FD001', 'barcode' => '077655059881', 'category_id' => $cat1->id, 'cost_price' => 2500, 'sale_price' => 3500, 'stock' => 150, 'min_stock' => 20, 'unit' => 'pcs', 'is_active' => true, 'has_batch' => false]);
        $p2 = Product::create(['name' => 'Aqua Air Mineral 600ml', 'sku' => 'BV001', 'barcode' => '8886008101053', 'category_id' => $cat2->id, 'cost_price' => 1800, 'sale_price' => 3000, 'stock' => 240, 'min_stock' => 30, 'unit' => 'botol', 'is_active' => true, 'has_batch' => false]);
        $p3 = Product::create(['name' => 'Teh Botol Sosro Kotak 250ml', 'sku' => 'BV002', 'barcode' => '8992696404415', 'category_id' => $cat2->id, 'cost_price' => 2200, 'sale_price' => 3500, 'stock' => 80, 'min_stock' => 15, 'unit' => 'kotak', 'is_active' => true, 'has_batch' => false]);
        $p4 = Product::create(['name' => 'Chitato Sapi Panggang 68g', 'sku' => 'SN001', 'barcode' => '8998866200253', 'category_id' => $cat3->id, 'cost_price' => 8500, 'sale_price' => 11500, 'stock' => 45, 'min_stock' => 10, 'unit' => 'bungkus', 'is_active' => true, 'has_batch' => false]);
        $p5 = Product::create(['name' => 'Sampoerna Mild 16', 'sku' => 'RK001', 'barcode' => '8999909002241', 'category_id' => $cat4->id, 'cost_price' => 28000, 'sale_price' => 32000, 'stock' => 120, 'min_stock' => 12, 'unit' => 'bungkus', 'is_active' => true, 'has_batch' => false]);
        $p6 = Product::create(['name' => 'Pepsodent Pencegah Gigi Berlubang 190g', 'sku' => 'TL001', 'barcode' => '8999999052063', 'category_id' => $cat5->id, 'cost_price' => 11000, 'sale_price' => 14500, 'stock' => 60, 'min_stock' => 10, 'unit' => 'tubes', 'is_active' => true, 'has_batch' => false]);
        $p7 = Product::create(['name' => 'Panadol Extra 10 Tablet', 'sku' => 'MD001', 'barcode' => '8999999000101', 'category_id' => $cat6->id, 'cost_price' => 10500, 'sale_price' => 13500, 'stock' => 35, 'min_stock' => 8, 'unit' => 'blister', 'is_active' => true, 'has_batch' => true]);

        // 5. Product Batches for Panadol
        $p7->batches()->create(['batch_number' => 'BCH-2025-001', 'expiry_date' => '2027-12-31', 'quantity' => 20, 'cost_price' => 10500]);
        $p7->batches()->create(['batch_number' => 'BCH-2025-002', 'expiry_date' => '2028-06-30', 'quantity' => 15, 'cost_price' => 10500]);

        // 6. Customers
        $cust1 = Customer::create(['name' => 'Hendra Wijaya', 'phone' => '081234567890', 'email' => 'hendra@gmail.com', 'address' => 'Jakarta', 'membership_tier' => 'gold', 'loyalty_points' => 320, 'total_spent' => 2450000, 'total_transactions' => 18, 'last_visit' => Carbon::now()->subDays(2), 'is_active' => true]);
        $cust2 = Customer::create(['name' => 'Ani Suryani', 'phone' => '081398765432', 'email' => 'ani@gmail.com', 'address' => 'Jakarta', 'membership_tier' => 'silver', 'loyalty_points' => 120, 'total_spent' => 950000, 'total_transactions' => 8, 'last_visit' => Carbon::now()->subDays(5), 'is_active' => true]);
        $cust3 = Customer::create(['name' => 'Bambang Pamungkas', 'phone' => '081511223344', 'email' => 'bambang@outlook.com', 'address' => 'Tangerang', 'membership_tier' => 'bronze', 'loyalty_points' => 45, 'total_spent' => 350000, 'total_transactions' => 4, 'last_visit' => Carbon::now()->subDays(12), 'is_active' => true]);

        // 7. Suppliers
        $sup1 = Supplier::create(['name' => 'PT Indofood CBP Sukses Makmur', 'contact_person' => 'Bambang Hermawan', 'phone' => '021-8889900', 'email' => 'info@indofood.cbp', 'address' => 'Sudirman Plaza, Jakarta', 'is_active' => true]);
        $sup2 = Supplier::create(['name' => 'PT Unilever Indonesia Tbk', 'contact_person' => 'Rina Melati', 'phone' => '021-9990022', 'email' => 'customercare@unilever.id', 'address' => 'BSD City, Tangerang', 'is_active' => true]);

        // 8. Tax Configurations
        TaxConfig::create(['name' => 'PPN 11%', 'rate' => 11.0, 'type' => 'vat', 'is_inclusive' => false, 'apply_before_discount' => false, 'is_active' => true, 'label' => 'PPN (11%)']);
        TaxConfig::create(['name' => 'Restoran PB1 10%', 'rate' => 10.0, 'type' => 'restaurant', 'is_inclusive' => false, 'apply_before_discount' => false, 'is_active' => false, 'label' => 'Pajak PB1 (10%)']);
        TaxConfig::create(['name' => 'Service Charge 5%', 'rate' => 5.0, 'type' => 'service', 'is_inclusive' => false, 'apply_before_discount' => false, 'is_active' => false, 'label' => 'Service Charge (5%)']);

        // 9. Loyalty Config
        LoyaltyConfig::create([
            'points_per_amount' => 1,
            'amount_threshold' => 10000, // Rp 10.000 = 1 point
            'point_value' => 100, // 1 point = Rp 100 discount
            'min_redeem_points' => 10,
            'bronze_threshold' => 100,
            'silver_threshold' => 500,
            'gold_threshold' => 1500,
            'is_active' => true
        ]);

        // 10. Discounts
        Discount::create(['name' => 'Promo Gajian Akhir Bulan', 'code' => 'GAJIAN10', 'type' => 'percentage', 'value' => 10, 'scope' => 'cart', 'min_purchase' => 100000, 'max_discount' => 25000, 'membership_only' => false, 'is_active' => true]);
        Discount::create(['name' => 'Potongan Langsung Rp5.000', 'code' => 'HEMAT5', 'type' => 'fixed', 'value' => 5000, 'scope' => 'cart', 'min_purchase' => 50000, 'membership_only' => false, 'is_active' => true]);

        // 11. Create a historical Shift and Transactions
        $shift = Shift::create([
            'cashier_id' => $user4->id,
            'cashier_name' => $user4->name,
            'branch_id' => $branch1->id,
            'branch_name' => $branch1->name,
            'opening_cash' => 500000,
            'status' => 'open',
            'opened_at' => Carbon::now()->subHours(6),
        ]);

        // Save a mock completed transaction
        $subtotal = 3500 + 3000 + 11500; // Indomie + Aqua + Chitato = 18000
        $tax = (int)($subtotal * 0.11);
        $total = $subtotal + $tax;

        $trans = Transaction::create([
            'invoice_number' => 'INV-' . date('Ymd') . '-0001',
            'branch_id' => $branch1->id,
            'branch_name' => $branch1->name,
            'cashier_id' => $user4->id,
            'cashier_name' => $user4->name,
            'customer_id' => $cust1->id,
            'customer_name' => $cust1->name,
            'subtotal' => $subtotal,
            'discount_amount' => 0,
            'tax_amount' => $tax,
            'service_charge' => 0,
            'total' => $total,
            'change_amount' => 30000 - $total,
            'status' => 'completed',
            'shift_id' => $shift->id,
        ]);

        $trans->items()->create(['product_id' => $p1->id, 'product_name' => $p1->name, 'sku' => $p1->sku, 'quantity' => 1, 'unit_price' => $p1->sale_price, 'subtotal' => $p1->sale_price]);
        $trans->items()->create(['product_id' => $p2->id, 'product_name' => $p2->name, 'sku' => $p2->sku, 'quantity' => 1, 'unit_price' => $p2->sale_price, 'subtotal' => $p2->sale_price]);
        $trans->items()->create(['product_id' => $p4->id, 'product_name' => $p4->name, 'sku' => $p4->sku, 'quantity' => 1, 'unit_price' => $p4->sale_price, 'subtotal' => $p4->sale_price]);

        $trans->payments()->create(['method' => 'cash', 'amount' => 30000]);

        // Stock movement audit
        StockMovement::create(['product_id' => $p1->id, 'type' => 'out', 'quantity' => 1, 'reference' => $trans->invoice_number, 'reason' => 'Sale', 'user_name' => $user4->name, 'branch_name' => $branch1->name]);
        StockMovement::create(['product_id' => $p2->id, 'type' => 'out', 'quantity' => 1, 'reference' => $trans->invoice_number, 'reason' => 'Sale', 'user_name' => $user4->name, 'branch_name' => $branch1->name]);
        StockMovement::create(['product_id' => $p4->id, 'type' => 'out', 'quantity' => 1, 'reference' => $trans->invoice_number, 'reason' => 'Sale', 'user_name' => $user4->name, 'branch_name' => $branch1->name]);

        // Recalculate shift totals
        $shift->update([
            'total_sales' => $total,
            'total_transactions' => 1,
            'total_cash_sales' => $total,
        ]);

        // Seed Ingredients & Recipe (BOM)
        $ing1 = Ingredient::create([
            'name' => 'Mie Kering',
            'sku' => 'ING-MIE-01',
            'category_id' => $cat1->id,
            'supplier_id' => $sup1->id,
            'unit' => 'pcs',
            'stock' => 500.0,
            'min_stock' => 50.0,
            'cost_price' => 1500.00,
            'avg_cost_price' => 1500.00,
            'is_active' => true,
        ]);

        $ing2 = Ingredient::create([
            'name' => 'Bumbu Indomie',
            'sku' => 'ING-BUM-01',
            'category_id' => $cat1->id,
            'supplier_id' => $sup1->id,
            'unit' => 'pcs',
            'stock' => 500.0,
            'min_stock' => 50.0,
            'cost_price' => 500.00,
            'avg_cost_price' => 500.00,
            'is_active' => true,
        ]);

        $ing3 = Ingredient::create([
            'name' => 'Minyak Bumbu',
            'sku' => 'ING-MINYAK-01',
            'category_id' => $cat1->id,
            'supplier_id' => $sup1->id,
            'unit' => 'ml',
            'stock' => 1000.0,
            'min_stock' => 100.0,
            'cost_price' => 300.00,
            'avg_cost_price' => 300.00,
            'is_active' => true,
        ]);

        // Attach ingredients to Product 1 (Indomie Goreng Spesial)
        $p1->ingredients()->attach([
            $ing1->id => ['quantity_needed' => 1.000],
            $ing2->id => ['quantity_needed' => 1.000],
            $ing3->id => ['quantity_needed' => 5.000], // 5ml
        ]);

        // Recalculate HPP for product 1
        $p1->update([
            'use_recipe' => true,
            'hpp_auto' => (1500 * 1) + (500 * 1) + (300 * 5), // 3500 HPP
        ]);
    }
}
