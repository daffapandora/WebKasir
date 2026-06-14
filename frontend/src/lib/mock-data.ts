/* ═══════════════════════════════════════════════════
   Mock Data — Indonesian-Realistic Demo Data
   ═══════════════════════════════════════════════════ */

import type {
  User, Branch, Category, Product, Customer, Supplier,
  Discount, TaxConfig, LoyaltyConfig, Transaction, Shift,
  DashboardKPI, SalesSummary, TopProduct, PaymentMethodSummary,
  HourlySales, Employee, CashierPermissions, AuditLog,
  PurchaseOrder, StockMovement, LoyaltyTransaction,
} from '@/types';

// ─── Users ───
export const MOCK_USERS: User[] = [
  {
    id: 1, name: 'Budi Santoso', email: 'budi@tokoku.id', role: 'super_admin',
    branch_id: 1, branch_name: 'Toko Pusat - Jakarta', permissions: ['*'], is_active: true, created_at: '2024-01-01',
  },
  {
    id: 2, name: 'Siti Rahayu', email: 'siti@tokoku.id', role: 'admin',
    branch_id: 1, branch_name: 'Toko Pusat - Jakarta', permissions: ['*'], is_active: true, created_at: '2024-01-15',
  },
  {
    id: 3, name: 'Ahmad Fauzi', email: 'ahmad@tokoku.id', role: 'manager',
    branch_id: 2, branch_name: 'Cabang Selatan - Jakarta', permissions: ['sales.create', 'sales.void', 'products.view_cost', 'reports.view_all', 'employees.manage'], is_active: true, created_at: '2024-02-01',
  },
  {
    id: 4, name: 'Dewi Lestari', email: 'dewi@tokoku.id', role: 'cashier',
    branch_id: 1, branch_name: 'Toko Pusat - Jakarta', permissions: ['sales.create', 'sales.discount.apply'], is_active: true, created_at: '2024-03-01',
  },
  {
    id: 5, name: 'Rizki Pratama', email: 'rizki@tokoku.id', role: 'cashier',
    branch_id: 2, branch_name: 'Cabang Selatan - Jakarta', permissions: ['sales.create'], is_active: true, created_at: '2024-03-15',
  },
];

// ─── Branches ───
export const MOCK_BRANCHES: Branch[] = [
  { id: 1, name: 'Toko Pusat - Jakarta', address: 'Jl. Sudirman No. 123, Jakarta Pusat', phone: '021-5551234', is_active: true, created_at: '2024-01-01' },
  { id: 2, name: 'Cabang Selatan - Jakarta', address: 'Jl. Fatmawati No. 45, Jakarta Selatan', phone: '021-7891234', is_active: true, created_at: '2024-02-01' },
  { id: 3, name: 'Cabang Bandung', address: 'Jl. Braga No. 78, Bandung', phone: '022-4201234', is_active: true, created_at: '2024-04-01' },
];

// ─── Categories ───
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Makanan', slug: 'makanan', icon: '🍜', color: '#E07A5F', product_count: 5, is_active: true },
  { id: 2, name: 'Minuman', slug: 'minuman', icon: '🥤', color: '#457B9D', product_count: 5, is_active: true },
  { id: 3, name: 'Snack', slug: 'snack', icon: '🍿', color: '#E09F3E', product_count: 4, is_active: true },
  { id: 4, name: 'Rokok', slug: 'rokok', icon: '🚬', color: '#6B7280', product_count: 3, is_active: true },
  { id: 5, name: 'Toiletries', slug: 'toiletries', icon: '🧴', color: '#81B29A', product_count: 4, is_active: true },
  { id: 6, name: 'Obat-obatan', slug: 'obat-obatan', icon: '💊', color: '#C1292E', product_count: 3, is_active: true },
  { id: 7, name: 'Lainnya', slug: 'lainnya', icon: '📦', color: '#9AA0A6', product_count: 3, is_active: true },
];

// ─── Products (27 products) ───
export const MOCK_PRODUCTS: Product[] = [
  // Makanan
  { id: 1, name: 'Indomie Goreng', sku: 'MKN001', barcode: '8991125120052', category_id: 1, category_name: 'Makanan', cost_price: 2500, sale_price: 3500, stock: 150, min_stock: 30, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 2, name: 'Indomie Kuah Soto', sku: 'MKN002', barcode: '8991125120069', category_id: 1, category_name: 'Makanan', cost_price: 2500, sale_price: 3500, stock: 120, min_stock: 30, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 3, name: 'Nasi Goreng Instant', sku: 'MKN003', barcode: '8991125140010', category_id: 1, category_name: 'Makanan', cost_price: 4000, sale_price: 6000, stock: 80, min_stock: 20, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 4, name: 'Sarden Kaleng ABC', sku: 'MKN004', barcode: '8998866610025', category_id: 1, category_name: 'Makanan', cost_price: 12000, sale_price: 16000, stock: 45, min_stock: 10, unit: 'pcs', is_active: true, has_batch: true, batches: [{ id: 1, product_id: 4, batch_number: 'B2024-001', expiry_date: '2026-06-15', quantity: 45, cost_price: 12000 }], created_at: '2024-01-01' },
  { id: 5, name: 'Roti Tawar Sari Roti', sku: 'MKN005', barcode: '8992917221013', category_id: 1, category_name: 'Makanan', cost_price: 13000, sale_price: 17000, stock: 25, min_stock: 10, unit: 'pcs', is_active: true, has_batch: true, batches: [{ id: 2, product_id: 5, batch_number: 'B2024-021', expiry_date: '2025-07-10', quantity: 25, cost_price: 13000 }], created_at: '2024-01-01' },

  // Minuman
  { id: 6, name: 'Aqua 600ml', sku: 'MNM001', barcode: '8996001600028', category_id: 2, category_name: 'Minuman', cost_price: 2000, sale_price: 3500, stock: 200, min_stock: 50, unit: 'botol', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 7, name: 'Teh Botol Sosro 450ml', sku: 'MNM002', barcode: '8993220180019', category_id: 2, category_name: 'Minuman', cost_price: 3000, sale_price: 5000, stock: 120, min_stock: 30, unit: 'botol', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 8, name: 'Coca-Cola 390ml', sku: 'MNM003', barcode: '8992222033013', category_id: 2, category_name: 'Minuman', cost_price: 4500, sale_price: 7000, stock: 96, min_stock: 24, unit: 'botol', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 9, name: 'Kopi Good Day 250ml', sku: 'MNM004', barcode: '8991002103818', category_id: 2, category_name: 'Minuman', cost_price: 3500, sale_price: 5500, stock: 72, min_stock: 24, unit: 'botol', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 10, name: 'Ultra Milk 200ml', sku: 'MNM005', barcode: '8998009000201', category_id: 2, category_name: 'Minuman', cost_price: 4000, sale_price: 6500, stock: 60, min_stock: 20, unit: 'kotak', is_active: true, has_batch: true, batches: [{ id: 3, product_id: 10, batch_number: 'B2024-050', expiry_date: '2025-09-01', quantity: 60, cost_price: 4000 }], created_at: '2024-01-01' },

  // Snack
  { id: 11, name: 'Chitato Sapi Panggang 68g', sku: 'SNK001', barcode: '8996001340042', category_id: 3, category_name: 'Snack', cost_price: 7000, sale_price: 10500, stock: 60, min_stock: 15, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 12, name: 'Oreo Original 137g', sku: 'SNK002', barcode: '7622210605016', category_id: 3, category_name: 'Snack', cost_price: 8000, sale_price: 12000, stock: 48, min_stock: 12, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 13, name: 'Tango Wafer 176g', sku: 'SNK003', barcode: '8991102221109', category_id: 3, category_name: 'Snack', cost_price: 9000, sale_price: 13500, stock: 36, min_stock: 10, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 14, name: 'Silverqueen 65g', sku: 'SNK004', barcode: '8991223045012', category_id: 3, category_name: 'Snack', cost_price: 10000, sale_price: 15000, stock: 30, min_stock: 10, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },

  // Rokok
  { id: 15, name: 'Gudang Garam Surya 16', sku: 'RKK001', barcode: '8998909900165', category_id: 4, category_name: 'Rokok', cost_price: 28000, sale_price: 32000, stock: 50, min_stock: 20, unit: 'bungkus', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 16, name: 'Sampoerna Mild 16', sku: 'RKK002', barcode: '8991720011166', category_id: 4, category_name: 'Rokok', cost_price: 27000, sale_price: 31000, stock: 45, min_stock: 15, unit: 'bungkus', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 17, name: 'Djarum Super 12', sku: 'RKK003', barcode: '8999908008121', category_id: 4, category_name: 'Rokok', cost_price: 20000, sale_price: 24000, stock: 8, min_stock: 15, unit: 'bungkus', is_active: true, has_batch: false, created_at: '2024-01-01' },

  // Toiletries
  { id: 18, name: 'Sabun Lifebuoy 80g', sku: 'TLT001', barcode: '8997020180011', category_id: 5, category_name: 'Toiletries', cost_price: 3000, sale_price: 5000, stock: 80, min_stock: 20, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 19, name: 'Shampoo Pantene 135ml', sku: 'TLT002', barcode: '4902430810203', category_id: 5, category_name: 'Toiletries', cost_price: 18000, sale_price: 25000, stock: 35, min_stock: 10, unit: 'botol', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 20, name: 'Pasta Gigi Pepsodent 190g', sku: 'TLT003', barcode: '8999999038014', category_id: 5, category_name: 'Toiletries', cost_price: 10000, sale_price: 14500, stock: 55, min_stock: 15, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 21, name: 'Tissue Paseo 250s', sku: 'TLT004', barcode: '8993012001015', category_id: 5, category_name: 'Toiletries', cost_price: 12000, sale_price: 17000, stock: 40, min_stock: 10, unit: 'pack', is_active: true, has_batch: false, created_at: '2024-01-01' },

  // Obat-obatan
  { id: 22, name: 'Paracetamol 500mg (10)', sku: 'OBT001', barcode: '8994001100010', category_id: 6, category_name: 'Obat-obatan', cost_price: 5000, sale_price: 8500, stock: 60, min_stock: 20, unit: 'strip', is_active: true, has_batch: true, batches: [{ id: 4, product_id: 22, batch_number: 'MED-2024-001', expiry_date: '2027-01-15', quantity: 60, cost_price: 5000 }], created_at: '2024-01-01' },
  { id: 23, name: 'Tolak Angin Cair', sku: 'OBT002', barcode: '8994001040014', category_id: 6, category_name: 'Obat-obatan', cost_price: 4000, sale_price: 7000, stock: 3, min_stock: 15, unit: 'sachet', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 24, name: 'Antangin Tablet (4)', sku: 'OBT003', barcode: '8994001510018', category_id: 6, category_name: 'Obat-obatan', cost_price: 2000, sale_price: 3500, stock: 50, min_stock: 15, unit: 'strip', is_active: true, has_batch: false, created_at: '2024-01-01' },

  // Lainnya
  { id: 25, name: 'Pulpen Standard AE7', sku: 'LNY001', barcode: '8997024710011', category_id: 7, category_name: 'Lainnya', cost_price: 2000, sale_price: 3500, stock: 100, min_stock: 20, unit: 'pcs', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 26, name: 'Baterai ABC AA (2)', sku: 'LNY002', barcode: '8997003500018', category_id: 7, category_name: 'Lainnya', cost_price: 8000, sale_price: 12000, stock: 40, min_stock: 10, unit: 'pack', is_active: true, has_batch: false, created_at: '2024-01-01' },
  { id: 27, name: 'Plastik Kresek Besar', sku: 'LNY003', barcode: '8999999990013', category_id: 7, category_name: 'Lainnya', cost_price: 15000, sale_price: 22000, stock: 25, min_stock: 5, unit: 'pack', is_active: true, has_batch: false, created_at: '2024-01-01' },
];

// ─── Customers ───
export const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Andi Wijaya', phone: '08123456789', email: 'andi@gmail.com', address: 'Jl. Kebon Jeruk No. 10, Jakarta Barat', membership_tier: 'gold', loyalty_points: 15200, total_spent: 8500000, total_transactions: 85, last_visit: '2025-05-30', is_active: true, created_at: '2024-02-01' },
  { id: 2, name: 'Maria Susanti', phone: '08134567890', email: 'maria@gmail.com', address: 'Jl. Melawai No. 22, Jakarta Selatan', membership_tier: 'silver', loyalty_points: 8400, total_spent: 4200000, total_transactions: 52, last_visit: '2025-05-29', is_active: true, created_at: '2024-02-15' },
  { id: 3, name: 'Hendra Gunawan', phone: '08145678901', address: 'Jl. Cempaka Putih No. 5, Jakarta Pusat', membership_tier: 'bronze', loyalty_points: 3100, total_spent: 1800000, total_transactions: 28, last_visit: '2025-05-28', is_active: true, created_at: '2024-03-01' },
  { id: 4, name: 'Ratna Dewi', phone: '08156789012', email: 'ratna@yahoo.com', address: 'Jl. Dago No. 88, Bandung', membership_tier: 'silver', loyalty_points: 6800, total_spent: 3500000, total_transactions: 40, last_visit: '2025-05-27', is_active: true, created_at: '2024-03-10' },
  { id: 5, name: 'Agus Salim', phone: '08167890123', membership_tier: 'bronze', loyalty_points: 1500, total_spent: 950000, total_transactions: 15, last_visit: '2025-05-25', is_active: true, created_at: '2024-04-01' },
  { id: 6, name: 'Putri Anggraini', phone: '08178901234', email: 'putri@gmail.com', membership_tier: 'gold', loyalty_points: 22500, total_spent: 12000000, total_transactions: 95, last_visit: '2025-05-31', is_active: true, created_at: '2024-01-20' },
  { id: 7, name: 'Doni Saputra', phone: '08189012345', membership_tier: 'none', loyalty_points: 0, total_spent: 350000, total_transactions: 5, last_visit: '2025-05-20', is_active: true, created_at: '2024-05-01' },
  { id: 8, name: 'Fitriani', phone: '08190123456', email: 'fitri@outlook.com', membership_tier: 'bronze', loyalty_points: 2200, total_spent: 1200000, total_transactions: 18, last_visit: '2025-05-26', is_active: true, created_at: '2024-04-15' },
  { id: 9, name: 'Bambang Suryadi', phone: '08201234567', membership_tier: 'silver', loyalty_points: 9100, total_spent: 5100000, total_transactions: 62, last_visit: '2025-05-29', is_active: true, created_at: '2024-02-20' },
  { id: 10, name: 'Sri Wahyuni', phone: '08212345678', email: 'sri@gmail.com', membership_tier: 'none', loyalty_points: 200, total_spent: 180000, total_transactions: 3, last_visit: '2025-05-15', is_active: true, created_at: '2024-06-01' },
  { id: 11, name: 'Rudi Hermawan', phone: '08223456789', membership_tier: 'bronze', loyalty_points: 4000, total_spent: 2100000, total_transactions: 30, last_visit: '2025-05-30', is_active: true, created_at: '2024-03-20' },
  { id: 12, name: 'Lina Marlina', phone: '08234567890', email: 'lina@tokobagus.com', address: 'Jl. Asia Afrika No. 100, Bandung', membership_tier: 'gold', loyalty_points: 18000, total_spent: 9800000, total_transactions: 110, last_visit: '2025-05-31', is_active: true, created_at: '2024-01-10' },
];

// ─── Suppliers ───
export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 1, name: 'PT Indofood Sukses Makmur', contact_person: 'Pak Joko', phone: '021-29537000', email: 'order@indofood.co.id', address: 'Jl. Jendral Sudirman Kav. 76-78, Jakarta', is_active: true, created_at: '2024-01-01' },
  { id: 2, name: 'PT Unilever Indonesia', contact_person: 'Ibu Mega', phone: '021-5274000', email: 'supply@unilever.co.id', address: 'Jl. Jendral Gatot Subroto Kav. 15, Jakarta', is_active: true, created_at: '2024-01-01' },
  { id: 3, name: 'CV Sumber Makmur Jaya', contact_person: 'Pak Hasan', phone: '021-88891234', email: 'sumberjaya@gmail.com', address: 'Jl. Kramat Jati No. 45, Jakarta Timur', is_active: true, created_at: '2024-02-01' },
];

// ─── Discounts ───
export const MOCK_DISCOUNTS: Discount[] = [
  { id: 1, name: 'Diskon Weekend 10%', code: 'WEEKEND10', type: 'percentage', value: 10, scope: 'cart', min_purchase: 50000, max_discount: 25000, membership_only: false, start_date: '2025-01-01', end_date: '2025-12-31', usage_limit: 1000, usage_count: 234, is_active: true, created_at: '2025-01-01' },
  { id: 2, name: 'Member Gold Spesial', type: 'percentage', value: 15, scope: 'cart', min_purchase: 100000, max_discount: 50000, membership_only: true, membership_tier: 'gold', usage_limit: undefined, usage_count: 89, is_active: true, created_at: '2025-01-01' },
  { id: 3, name: 'Potongan Minuman Rp 2000', type: 'fixed', value: 2000, scope: 'product', product_ids: [6, 7, 8, 9, 10], membership_only: false, usage_limit: 500, usage_count: 156, is_active: true, created_at: '2025-02-01' },
  { id: 4, name: 'Promo Ramadhan', code: 'RAMADHAN25', type: 'percentage', value: 5, scope: 'cart', min_purchase: 75000, membership_only: false, start_date: '2025-03-01', end_date: '2025-04-15', usage_limit: 2000, usage_count: 1823, is_active: false, created_at: '2025-03-01' },
];

// ─── Tax Config ───
export const MOCK_TAX_CONFIGS: TaxConfig[] = [
  { id: 1, name: 'PPN', rate: 11, type: 'vat', is_inclusive: false, apply_before_discount: false, is_active: true, label: 'PPN 11%' },
  { id: 2, name: 'Pajak Restoran (PB1)', rate: 10, type: 'restaurant', is_inclusive: false, apply_before_discount: false, is_active: false, label: 'PB1 10%' },
  { id: 3, name: 'Service Charge', rate: 5, type: 'service', is_inclusive: false, apply_before_discount: true, is_active: false, label: 'Service 5%' },
];

// ─── Loyalty Config ───
export const MOCK_LOYALTY_CONFIG: LoyaltyConfig = {
  id: 1,
  points_per_amount: 1,
  amount_threshold: 10000,
  point_value: 100,
  min_redeem_points: 100,
  bronze_threshold: 1000,
  silver_threshold: 5000,
  gold_threshold: 15000,
  is_active: true,
};

// ─── Employees ───
export const MOCK_EMPLOYEES: Employee[] = [
  { id: 1, user_id: 1, name: 'Budi Santoso', email: 'budi@tokoku.id', phone: '08111111111', role: 'super_admin', branch_id: 1, branch_name: 'Toko Pusat - Jakarta', is_active: true, last_login: '2025-05-31T08:00:00', created_at: '2024-01-01' },
  { id: 2, user_id: 2, name: 'Siti Rahayu', email: 'siti@tokoku.id', phone: '08122222222', role: 'admin', branch_id: 1, branch_name: 'Toko Pusat - Jakarta', is_active: true, last_login: '2025-05-31T07:30:00', created_at: '2024-01-15' },
  { id: 3, user_id: 3, name: 'Ahmad Fauzi', email: 'ahmad@tokoku.id', phone: '08133333333', role: 'manager', branch_id: 2, branch_name: 'Cabang Selatan - Jakarta', is_active: true, last_login: '2025-05-30T17:00:00', created_at: '2024-02-01' },
  { id: 4, user_id: 4, name: 'Dewi Lestari', email: 'dewi@tokoku.id', phone: '08144444444', role: 'cashier', branch_id: 1, branch_name: 'Toko Pusat - Jakarta', is_active: true, last_login: '2025-05-31T06:55:00', created_at: '2024-03-01' },
  { id: 5, user_id: 5, name: 'Rizki Pratama', email: 'rizki@tokoku.id', phone: '08155555555', role: 'cashier', branch_id: 2, branch_name: 'Cabang Selatan - Jakarta', is_active: true, last_login: '2025-05-31T07:00:00', created_at: '2024-03-15' },
];

// ─── Default Cashier Permissions ───
export const DEFAULT_CASHIER_PERMISSIONS: CashierPermissions = {
  can_apply_discount: true,
  can_apply_custom_discount: false,
  can_void_item: true,
  can_void_transaction: false,
  can_process_refund: false,
  can_reprint_receipt: true,
  can_edit_quantity: true,
  can_edit_price: false,
  can_hold_bill: true,
  can_use_offline_mode: true,
  can_view_cost_price: false,
  can_view_profit_margin: false,
  can_view_daily_omzet: false,
  can_view_own_shift_only: true,
  can_view_full_history: false,
  can_view_own_history_only: true,
  can_view_stock_levels: true,
  can_view_customer_profiles: true,
  discount_requires_pin: true,
  void_requires_pin: true,
  refund_requires_pin: true,
  price_override_requires_pin: true,
  auto_logout_minutes: 30,
  quick_lock_enabled: true,
  pin_required_to_unlock: true,
  can_print_receipt: true,
  can_open_cash_drawer: false,
  can_use_scanner_override: true,
};

// ─── Transactions (35+) ───
function generateTransactions(): Transaction[] {
  const txns: Transaction[] = [];
  const now = new Date();

  for (let i = 0; i < 38; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const hour = 7 + Math.floor(Math.random() * 14);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, Math.floor(Math.random() * 60));

    const numItems = 1 + Math.floor(Math.random() * 5);
    const items = [];
    let subtotal = 0;

    const usedProductIds = new Set<number>();
    for (let j = 0; j < numItems; j++) {
      let product;
      do {
        product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
      } while (usedProductIds.has(product.id));
      usedProductIds.add(product.id);

      const qty = 1 + Math.floor(Math.random() * 3);
      const itemSubtotal = product.sale_price * qty;
      subtotal += itemSubtotal;
      items.push({
        id: i * 10 + j,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: qty,
        unit_price: product.sale_price,
        discount_amount: 0,
        subtotal: itemSubtotal,
      });
    }

    const discountAmount = Math.random() < 0.2 ? Math.floor(subtotal * 0.1) : 0;
    const taxAmount = Math.floor((subtotal - discountAmount) * 0.11);
    const total = subtotal - discountAmount + taxAmount;
    const methods: ('cash' | 'qris' | 'card' | 'transfer')[] = ['cash', 'cash', 'cash', 'qris', 'card', 'transfer'];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const changeAmount = method === 'cash' ? Math.ceil(total / 10000) * 10000 - total : 0;
    const cashier = Math.random() < 0.6 ? MOCK_USERS[3] : MOCK_USERS[4];
    const customer = Math.random() < 0.4 ? MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)] : undefined;
    const statuses: Transaction['status'][] = ['completed', 'completed', 'completed', 'completed', 'completed', 'voided', 'refunded'];
    const status = i < 35 ? statuses[Math.floor(Math.random() * statuses.length)] : 'completed';

    txns.push({
      id: 1000 + i,
      invoice_number: `INV-2025${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate() - daysAgo).padStart(2, '0')}-${String(1000 + i).padStart(4, '0')}`,
      branch_id: cashier.branch_id,
      branch_name: cashier.branch_name,
      cashier_id: cashier.id,
      cashier_name: cashier.name,
      customer_id: customer?.id,
      customer_name: customer?.name,
      items,
      payments: [{ method, amount: total + changeAmount, reference: method !== 'cash' ? `REF${1000 + i}` : undefined }],
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      service_charge: 0,
      total,
      change_amount: changeAmount,
      status,
      voided_by: status === 'voided' ? 'Siti Rahayu' : undefined,
      void_reason: status === 'voided' ? 'Pelanggan membatalkan' : undefined,
      refunded_by: status === 'refunded' ? 'Siti Rahayu' : undefined,
      refund_reason: status === 'refunded' ? 'Barang rusak' : undefined,
      shift_id: daysAgo * 2 + (hour < 14 ? 1 : 2),
      created_at: date.toISOString(),
    });
  }

  return txns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const MOCK_TRANSACTIONS = generateTransactions();

// ─── Shifts ───
export const MOCK_SHIFTS: Shift[] = [
  {
    id: 1, cashier_id: 4, cashier_name: 'Dewi Lestari', branch_id: 1, branch_name: 'Toko Pusat - Jakarta',
    opening_cash: 500000, closing_cash: 1850000, expected_cash: 1820000, difference: 30000,
    total_sales: 2450000, total_transactions: 18, total_cash_sales: 1320000, total_non_cash_sales: 1130000,
    status: 'closed', opened_at: '2025-05-30T07:00:00', closed_at: '2025-05-30T15:00:00', notes: 'Shift pagi lancar',
  },
  {
    id: 2, cashier_id: 5, cashier_name: 'Rizki Pratama', branch_id: 2, branch_name: 'Cabang Selatan - Jakarta',
    opening_cash: 500000, closing_cash: 1620000, expected_cash: 1600000, difference: 20000,
    total_sales: 1980000, total_transactions: 14, total_cash_sales: 1100000, total_non_cash_sales: 880000,
    status: 'closed', opened_at: '2025-05-30T07:00:00', closed_at: '2025-05-30T15:30:00',
  },
  {
    id: 3, cashier_id: 4, cashier_name: 'Dewi Lestari', branch_id: 1, branch_name: 'Toko Pusat - Jakarta',
    opening_cash: 500000, total_sales: 780000, total_transactions: 6, total_cash_sales: 450000, total_non_cash_sales: 330000,
    status: 'open', opened_at: '2025-05-31T07:00:00',
  },
];

// ─── Dashboard KPIs ───
export const MOCK_DASHBOARD_KPI: DashboardKPI = {
  today_sales: 3280000,
  today_transactions: 24,
  today_avg_order: 136667,
  today_items_sold: 58,
  yesterday_sales: 4430000,
  weekly_sales: 22500000,
  monthly_sales: 89200000,
  sales_growth: 12.5,
  low_stock_count: 3,
  active_discounts: 3,
};

// ─── Sales Summary ───
export const MOCK_SALES_SUMMARY: SalesSummary[] = [
  { period: '2025-05-25', gross_sales: 3200000, total_discounts: 180000, net_sales: 3020000, cogs: 1800000, gross_profit: 1220000, tax_collected: 332200, transaction_count: 22, average_order_value: 137273, items_sold: 48 },
  { period: '2025-05-26', gross_sales: 2800000, total_discounts: 150000, net_sales: 2650000, cogs: 1550000, gross_profit: 1100000, tax_collected: 291500, transaction_count: 19, average_order_value: 139474, items_sold: 42 },
  { period: '2025-05-27', gross_sales: 3500000, total_discounts: 220000, net_sales: 3280000, cogs: 1950000, gross_profit: 1330000, tax_collected: 360800, transaction_count: 25, average_order_value: 131200, items_sold: 55 },
  { period: '2025-05-28', gross_sales: 4100000, total_discounts: 300000, net_sales: 3800000, cogs: 2200000, gross_profit: 1600000, tax_collected: 418000, transaction_count: 28, average_order_value: 135714, items_sold: 62 },
  { period: '2025-05-29', gross_sales: 3800000, total_discounts: 250000, net_sales: 3550000, cogs: 2050000, gross_profit: 1500000, tax_collected: 390500, transaction_count: 26, average_order_value: 136538, items_sold: 58 },
  { period: '2025-05-30', gross_sales: 4430000, total_discounts: 310000, net_sales: 4120000, cogs: 2400000, gross_profit: 1720000, tax_collected: 453200, transaction_count: 32, average_order_value: 128750, items_sold: 70 },
  { period: '2025-05-31', gross_sales: 3280000, total_discounts: 200000, net_sales: 3080000, cogs: 1780000, gross_profit: 1300000, tax_collected: 338800, transaction_count: 24, average_order_value: 128333, items_sold: 52 },
];

// ─── Top Products ───
export const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { product_id: 1, product_name: 'Indomie Goreng', category: 'Makanan', quantity_sold: 85, revenue: 297500, profit: 85000 },
  { product_id: 6, product_name: 'Aqua 600ml', category: 'Minuman', quantity_sold: 72, revenue: 252000, profit: 108000 },
  { product_id: 15, product_name: 'Gudang Garam Surya 16', category: 'Rokok', quantity_sold: 45, revenue: 1440000, profit: 180000 },
  { product_id: 7, product_name: 'Teh Botol Sosro 450ml', category: 'Minuman', quantity_sold: 38, revenue: 190000, profit: 76000 },
  { product_id: 11, product_name: 'Chitato Sapi Panggang 68g', category: 'Snack', quantity_sold: 32, revenue: 336000, profit: 112000 },
  { product_id: 18, product_name: 'Sabun Lifebuoy 80g', category: 'Toiletries', quantity_sold: 28, revenue: 140000, profit: 56000 },
  { product_id: 16, product_name: 'Sampoerna Mild 16', category: 'Rokok', quantity_sold: 25, revenue: 775000, profit: 100000 },
  { product_id: 2, product_name: 'Indomie Kuah Soto', category: 'Makanan', quantity_sold: 22, revenue: 77000, profit: 22000 },
];

// ─── Payment Method Summary ───
export const MOCK_PAYMENT_SUMMARY: PaymentMethodSummary[] = [
  { method: 'cash', count: 95, amount: 12500000, percentage: 55 },
  { method: 'qris', count: 45, amount: 5800000, percentage: 25 },
  { method: 'card', count: 18, amount: 2800000, percentage: 12 },
  { method: 'transfer', count: 12, amount: 1400000, percentage: 8 },
];

// ─── Hourly Sales ───
export const MOCK_HOURLY_SALES: HourlySales[] = [
  { hour: 7, label: '07:00', transaction_count: 2, total: 85000 },
  { hour: 8, label: '08:00', transaction_count: 5, total: 320000 },
  { hour: 9, label: '09:00', transaction_count: 4, total: 280000 },
  { hour: 10, label: '10:00', transaction_count: 6, total: 450000 },
  { hour: 11, label: '11:00', transaction_count: 8, total: 620000 },
  { hour: 12, label: '12:00', transaction_count: 12, total: 980000 },
  { hour: 13, label: '13:00', transaction_count: 10, total: 780000 },
  { hour: 14, label: '14:00', transaction_count: 6, total: 420000 },
  { hour: 15, label: '15:00', transaction_count: 5, total: 350000 },
  { hour: 16, label: '16:00', transaction_count: 7, total: 520000 },
  { hour: 17, label: '17:00', transaction_count: 9, total: 680000 },
  { hour: 18, label: '18:00', transaction_count: 11, total: 850000 },
  { hour: 19, label: '19:00', transaction_count: 8, total: 580000 },
  { hour: 20, label: '20:00', transaction_count: 5, total: 365000 },
];

// ─── Audit Logs ───
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 1, user_id: 2, user_name: 'Siti Rahayu', action: 'void_transaction', module: 'transactions', description: 'Void transaksi INV-20250530-1005', old_value: 'completed', new_value: 'voided', branch_id: 1, created_at: '2025-05-30T14:20:00' },
  { id: 2, user_id: 2, user_name: 'Siti Rahayu', action: 'refund_transaction', module: 'transactions', description: 'Refund transaksi INV-20250529-1012', old_value: 'completed', new_value: 'refunded', branch_id: 1, created_at: '2025-05-29T16:45:00' },
  { id: 3, user_id: 1, user_name: 'Budi Santoso', action: 'update_tax', module: 'settings', description: 'Update tarif PPN dari 10% ke 11%', old_value: '10', new_value: '11', created_at: '2025-05-28T09:00:00' },
  { id: 4, user_id: 1, user_name: 'Budi Santoso', action: 'update_permissions', module: 'access_control', description: 'Update izin kasir: aktifkan can_apply_discount', created_at: '2025-05-27T10:30:00' },
  { id: 5, user_id: 3, user_name: 'Ahmad Fauzi', action: 'stock_adjustment', module: 'inventory', description: 'Penyesuaian stok Tolak Angin Cair: -5 (rusak)', old_value: '8', new_value: '3', branch_id: 2, created_at: '2025-05-26T11:15:00' },
];

// ─── Purchase Orders ───
export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 1, po_number: 'PO-2025-001', supplier_id: 1, supplier_name: 'PT Indofood Sukses Makmur', branch_id: 1,
    items: [
      { id: 1, product_id: 1, product_name: 'Indomie Goreng', quantity: 100, received_quantity: 100, unit_cost: 2500, subtotal: 250000 },
      { id: 2, product_id: 2, product_name: 'Indomie Kuah Soto', quantity: 80, received_quantity: 80, unit_cost: 2500, subtotal: 200000 },
    ],
    total: 450000, status: 'received', notes: 'Pengiriman rutin bulanan', created_by: 'Siti Rahayu', created_at: '2025-05-20',
  },
  {
    id: 2, po_number: 'PO-2025-002', supplier_id: 2, supplier_name: 'PT Unilever Indonesia', branch_id: 1,
    items: [
      { id: 3, product_id: 18, product_name: 'Sabun Lifebuoy 80g', quantity: 50, received_quantity: 0, unit_cost: 3000, subtotal: 150000 },
      { id: 4, product_id: 19, product_name: 'Shampoo Pantene 135ml', quantity: 20, received_quantity: 0, unit_cost: 18000, subtotal: 360000 },
    ],
    total: 510000, status: 'sent', created_by: 'Siti Rahayu', created_at: '2025-05-28',
  },
];

// ─── Stock Movements ───
export const MOCK_STOCK_MOVEMENTS: StockMovement[] = [
  { id: 1, product_id: 23, product_name: 'Tolak Angin Cair', type: 'adjustment', quantity: -5, reference: 'ADJ-001', reason: 'Barang rusak', user_name: 'Ahmad Fauzi', branch_name: 'Cabang Selatan - Jakarta', created_at: '2025-05-26T11:15:00' },
  { id: 2, product_id: 1, product_name: 'Indomie Goreng', type: 'in', quantity: 100, reference: 'PO-2025-001', user_name: 'Siti Rahayu', branch_name: 'Toko Pusat - Jakarta', created_at: '2025-05-22T10:00:00' },
  { id: 3, product_id: 6, product_name: 'Aqua 600ml', type: 'out', quantity: -3, reference: 'INV-20250531-1001', user_name: 'Dewi Lestari', branch_name: 'Toko Pusat - Jakarta', created_at: '2025-05-31T08:30:00' },
  { id: 4, product_id: 15, product_name: 'Gudang Garam Surya 16', type: 'out', quantity: -2, reference: 'INV-20250531-1002', user_name: 'Dewi Lestari', branch_name: 'Toko Pusat - Jakarta', created_at: '2025-05-31T09:15:00' },
];

// ─── Loyalty Transactions ───
export const MOCK_LOYALTY_TRANSACTIONS: LoyaltyTransaction[] = [
  { id: 1, customer_id: 1, customer_name: 'Andi Wijaya', type: 'earn', points: 85, balance_after: 15200, reference: 'INV-20250530-1001', created_at: '2025-05-30T12:00:00' },
  { id: 2, customer_id: 6, customer_name: 'Putri Anggraini', type: 'redeem', points: -500, balance_after: 22500, reference: 'INV-20250531-1005', notes: 'Redeem 500 poin', created_at: '2025-05-31T10:30:00' },
  { id: 3, customer_id: 2, customer_name: 'Maria Susanti', type: 'earn', points: 42, balance_after: 8400, reference: 'INV-20250529-1008', created_at: '2025-05-29T14:20:00' },
  { id: 4, customer_id: 12, customer_name: 'Lina Marlina', type: 'adjust', points: 1000, balance_after: 18000, notes: 'Bonus pendaftaran', created_at: '2025-05-28T09:00:00' },
];

export const MOCK_INGREDIENTS: any[] = [
  { id: 1, name: 'Mie Kering', sku: 'ING-MIE-01', category_id: 1, supplier_id: 1, unit: 'gram', stock: 5000, min_stock: 500, cost_price: 15, avg_cost_price: 15, is_active: true, expiry_date: '2027-12-31', storage_location: 'Gudang A Rak 1', created_at: '2025-01-01', updated_at: '2025-01-01', deleted_at: null },
  { id: 2, name: 'Telur Ayam', sku: 'ING-ELR-02', category_id: 1, supplier_id: 1, unit: 'butir', stock: 100, min_stock: 15, cost_price: 2000, avg_cost_price: 2000, is_active: true, expiry_date: '2026-07-31', storage_location: 'Kulkas Dapur', created_at: '2025-01-01', updated_at: '2025-01-01', deleted_at: null },
  { id: 3, name: 'Minyak Goreng', sku: 'ING-MINYAK-01', category_id: 1, supplier_id: 2, unit: 'ml', stock: 2000, min_stock: 300, cost_price: 20, avg_cost_price: 20, is_active: true, expiry_date: '2027-06-30', storage_location: 'Rak Dapur', created_at: '2025-01-01', updated_at: '2025-01-01', deleted_at: null },
  { id: 4, name: 'Bumbu Instan', sku: 'ING-BUM-01', category_id: 1, supplier_id: 3, unit: 'sachet', stock: 150, min_stock: 20, cost_price: 500, avg_cost_price: 500, is_active: true, expiry_date: '2028-01-01', storage_location: 'Gudang B', created_at: '2025-01-01', updated_at: '2025-01-01', deleted_at: null }
];



