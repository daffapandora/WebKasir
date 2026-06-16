/* ═══════════════════════════════════════════════════
   Core Type Definitions for Enterprise POS
   ═══════════════════════════════════════════════════ */

// ─── Auth & Users ───
export type Role = 'super_admin' | 'admin' | 'manager' | 'cashier';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  branch_id: number;
  branch_name: string;
  avatar?: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Branch ───
export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
  created_at?: string;
}

// ─── Categories ───
export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  product_count: number;
  is_active: boolean;
}

// ─── Products ───
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category_id: number;
  category_name: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  image?: string;
  is_active: boolean;
  has_batch: boolean;
  batches?: ProductBatch[];
  variants?: ProductVariant[];
  created_at: string;
  use_recipe?: boolean;
  hpp_auto?: number;
  ingredients?: Array<{ ingredient_id: number; quantity_needed: number }>;
}

export interface ProductBatch {
  id: number;
  product_id: number;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
}

// ─── Inventory ───
export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return';
  quantity: number;
  reference: string;
  reason?: string;
  user_name: string;
  branch_name: string;
  created_at: string;
}

export interface InventoryAdjustment {
  product_id: number;
  quantity: number;
  type: 'add' | 'subtract' | 'set';
  reason: string;
}

// ─── Cart & Transactions ───
export interface CartItem {
  id: string;
  product_id: number;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  quantity: number;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage' | 'none';
  discount_value: number;
  subtotal: number;
  notes?: string;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage' | 'none';
  discount_value: number;
  tax_amount: number;
  service_charge: number;
  total: number;
  customer_id?: number;
  customer_name?: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'qris' | 'card' | 'transfer' | 'loyalty';

export interface Payment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface Transaction {
  id: number;
  invoice_number: string;
  branch_id: number;
  branch_name: string;
  cashier_id: number;
  cashier_name: string;
  customer_id?: number;
  customer_name?: string;
  items: TransactionItem[];
  payments: Payment[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_charge: number;
  total: number;
  change_amount: number;
  status: 'completed' | 'voided' | 'refunded' | 'held';
  voided_by?: string;
  void_reason?: string;
  refunded_by?: string;
  refund_reason?: string;
  shift_id: number;
  created_at: string;
}

export interface TransactionItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  subtotal: number;
}

// ─── Shift ───
export interface Shift {
  id: number;
  cashier_id: number;
  cashier_name: string;
  branch_id: number;
  branch_name: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  difference?: number;
  total_sales: number;
  total_transactions: number;
  total_cash_sales: number;
  total_non_cash_sales: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
}

// ─── Customer ───
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  membership_tier: 'bronze' | 'silver' | 'gold' | 'none';
  loyalty_points: number;
  total_spent: number;
  total_transactions: number;
  last_visit?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Loyalty ───
export interface LoyaltyConfig {
  id: number;
  points_per_amount: number;
  amount_threshold: number;
  point_value: number;
  min_redeem_points: number;
  bronze_threshold: number;
  silver_threshold: number;
  gold_threshold: number;
  is_active: boolean;
}

export interface LoyaltyTransaction {
  id: number;
  customer_id: number;
  customer_name: string;
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  balance_after: number;
  reference?: string;
  notes?: string;
  created_at: string;
}

// ─── Discount ───
export interface Discount {
  id: number;
  name: string;
  code?: string;
  type: 'fixed' | 'percentage';
  value: number;
  scope: 'product' | 'cart';
  min_purchase?: number;
  max_discount?: number;
  membership_only: boolean;
  membership_tier?: 'bronze' | 'silver' | 'gold';
  product_ids?: number[];
  start_date?: string;
  end_date?: string;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

// ─── Supplier ───
export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  branch_id: number;
  items: PurchaseOrderItem[];
  total: number;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  received_quantity: number;
  unit_cost: number;
  subtotal: number;
}

// ─── Tax ───
export interface TaxConfig {
  id: number;
  name: string;
  rate: number;
  type: 'vat' | 'service' | 'restaurant';
  is_inclusive: boolean;
  apply_before_discount: boolean;
  is_active: boolean;
  label: string;
}

// ─── Employee / Access Control ───
export interface Employee {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  branch_id: number;
  branch_name: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface CashierPermissions {
  // Transaction actions
  can_apply_discount: boolean;
  can_apply_custom_discount: boolean;
  can_void_item: boolean;
  can_void_transaction: boolean;
  can_process_refund: boolean;
  can_reprint_receipt: boolean;
  can_edit_quantity: boolean;
  can_edit_price: boolean;
  can_hold_bill: boolean;
  can_use_offline_mode: boolean;
  // Data visibility
  can_view_cost_price: boolean;
  can_view_profit_margin: boolean;
  can_view_daily_omzet: boolean;
  can_view_own_shift_only: boolean;
  can_view_full_history: boolean;
  can_view_own_history_only: boolean;
  can_view_stock_levels: boolean;
  can_view_customer_profiles: boolean;
  // Approval controls
  discount_requires_pin: boolean;
  void_requires_pin: boolean;
  refund_requires_pin: boolean;
  price_override_requires_pin: boolean;
  // Session controls
  auto_logout_minutes: number;
  quick_lock_enabled: boolean;
  pin_required_to_unlock: boolean;
  // Hardware controls
  can_print_receipt: boolean;
  can_open_cash_drawer: boolean;
  can_use_scanner_override: boolean;
}

// ─── Audit Log ───
export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  module: string;
  description: string;
  old_value?: string | null;
  new_value?: string | null;
  ip_address?: string;
  branch_id?: number;
  created_at: string;
}

// ─── Reports ───
export interface SalesSummary {
  period: string;
  gross_sales: number;
  total_discounts: number;
  net_sales: number;
  cogs: number;
  gross_profit: number;
  tax_collected: number;
  transaction_count: number;
  average_order_value: number;
  items_sold: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  category: string;
  quantity_sold: number;
  revenue: number;
  profit: number;
}

export interface PaymentMethodSummary {
  method: PaymentMethod;
  count: number;
  amount: number;
  percentage: number;
}

export interface HourlySales {
  hour: number;
  label: string;
  transaction_count: number;
  total: number;
}

// ─── Dashboard ───
export interface DashboardKPI {
  today_sales: number;
  today_transactions: number;
  today_avg_order: number;
  today_items_sold: number;
  yesterday_sales: number;
  weekly_sales: number;
  monthly_sales: number;
  sales_growth: number;
  low_stock_count: number;
  active_discounts: number;
}

// ─── API Response ───
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ─── Table ───
export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

// ─── Toast ───
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ─── Held Bill ───
export interface HeldBill {
  id: string;
  items: CartItem[];
  subtotal: number;
  customer_name?: string;
  notes?: string;
  held_at: string;
}



// ─── Product Variant ───
export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  sale_price: number;
  cost_price: number;
  stock: number;
  is_active: boolean;
}

