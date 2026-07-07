-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 0. Penyewa (tenants)
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'basic',
  is_active boolean not null default true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Cabang (branches)
create table if not exists branches (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  address text not null,
  phone text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Kategori (categories)
create table if not exists categories (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  slug text not null unique,
  icon text,
  color text,
  product_count integer default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Produk (products)
create table if not exists products (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  sku text not null unique,
  barcode text not null,
  category_id bigint references categories(id) on delete set null,
  category_name text not null,
  cost_price numeric(12,2) not null default 0.00,
  sale_price numeric(12,2) not null default 0.00,
  stock integer not null default 0,
  min_stock integer not null default 0,
  unit text not null,
  image text,
  is_active boolean not null default true,
  has_batch boolean not null default false,
  use_recipe boolean not null default false,
  hpp_auto numeric(12,2) default 0.00,
  ingredients jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Pelanggan (customers)
create table if not exists customers (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  address text,
  membership_tier text not null default 'none',
  loyalty_points integer not null default 0,
  total_spent numeric(12,2) not null default 0.00,
  total_transactions integer not null default 0,
  last_visit timestamp with time zone,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Karyawan (users)
create table if not exists users (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  email text not null unique,
  password text not null,
  role text not null,
  branch_id bigint references branches(id) on delete set null,
  branch_name text not null,
  permissions text[] default '{}'::text[],
  is_active boolean not null default true,
  lock_pin text,
  admin_pin text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Supplier (suppliers)
create table if not exists suppliers (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  contact_person text not null,
  phone text not null,
  email text,
  address text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Bahan Baku (ingredients)
create table if not exists ingredients (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  sku text,
  category_id bigint references categories(id) on delete set null,
  supplier_id bigint references suppliers(id) on delete set null,
  unit text not null,
  stock numeric(10,3) not null default 0.000,
  min_stock numeric(10,3) not null default 0.000,
  cost_price numeric(12,2) not null default 0.00,
  avg_cost_price numeric(12,2) not null default 0.00,
  expiry_date date,
  storage_location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Konfigurasi Pajak (tax_configs)
create table if not exists tax_configs (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  rate numeric(5,2) not null,
  type text not null,
  is_inclusive boolean not null default false,
  apply_before_discount boolean not null default false,
  is_active boolean not null default true,
  label text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Diskon (discounts)
create table if not exists discounts (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  code text,
  type text not null,
  value numeric(12,2) not null,
  scope text not null,
  min_purchase numeric(12,2),
  max_discount numeric(12,2),
  membership_only boolean not null default false,
  membership_tier text,
  product_ids bigint[] default '{}'::bigint[],
  start_date date,
  end_date date,
  usage_limit integer,
  usage_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Shift Kasir (shifts)
create table if not exists shifts (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  cashier_id bigint references users(id) on delete set null,
  cashier_name text not null,
  branch_id bigint references branches(id) on delete set null,
  branch_name text not null,
  opening_cash numeric(12,2) not null default 0.00,
  closing_cash numeric(12,2),
  expected_cash numeric(12,2),
  difference numeric(12,2),
  total_sales numeric(12,2) not null default 0.00,
  total_transactions integer not null default 0,
  total_cash_sales numeric(12,2) not null default 0.00,
  total_non_cash_sales numeric(12,2) not null default 0.00,
  status text not null default 'open',
  opened_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Transaksi (transactions)
create table if not exists transactions (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  invoice_number text not null unique,
  branch_id bigint references branches(id) on delete set null,
  branch_name text not null,
  cashier_id bigint references users(id) on delete set null,
  cashier_name text not null,
  customer_id bigint references customers(id) on delete set null,
  customer_name text,
  subtotal numeric(12,2) not null default 0.00,
  discount_amount numeric(12,2) not null default 0.00,
  tax_amount numeric(12,2) not null default 0.00,
  service_charge numeric(12,2) not null default 0.00,
  total numeric(12,2) not null default 0.00,
  change_amount numeric(12,2) not null default 0.00,
  status text not null default 'completed',
  voided_by text,
  void_reason text,
  refunded_by text,
  refund_reason text,
  shift_id bigint references shifts(id) on delete set null,
  payments jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Item Transaksi (transaction_items)
create table if not exists transaction_items (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  transaction_id bigint references transactions(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  product_name text not null,
  sku text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0.00,
  discount_amount numeric(12,2) not null default 0.00,
  subtotal numeric(12,2) not null default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. Mutasi Stok (stock_movements)
create table if not exists stock_movements (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  product_name text not null,
  type text not null,
  quantity integer not null,
  reference text not null,
  reason text,
  user_name text not null,
  branch_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. Log Penggunaan Bahan Baku (ingredient_usage_logs)
create table if not exists ingredient_usage_logs (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  ingredient_id bigint references ingredients(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  transaction_id bigint references transactions(id) on delete set null,
  quantity_used numeric(10,3) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. Log Limbah (waste_logs)
create table if not exists waste_logs (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  user_id bigint references users(id) on delete set null,
  user_name text not null,
  total_loss_amount numeric(12,2) not null default 0.00,
  logged_at timestamp with time zone not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. PO (purchase_orders)
create table if not exists purchase_orders (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  po_number text not null unique,
  supplier_id bigint references suppliers(id) on delete set null,
  supplier_name text not null,
  branch_id bigint references branches(id) on delete set null,
  total numeric(12,2) not null default 0.00,
  status text not null default 'draft',
  notes text,
  created_by text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 17. Log Audit (audit_logs)
create table if not exists audit_logs (
  id bigint primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  user_id bigint references users(id) on delete set null,
  user_name text not null,
  action text not null,
  module text not null,
  description text not null,
  old_value text,
  new_value text,
  ip_address text,
  branch_id bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for all tables
alter table tenants enable row level security;
alter table branches enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table users enable row level security;
alter table suppliers enable row level security;
alter table ingredients enable row level security;
alter table tax_configs enable row level security;
alter table discounts enable row level security;
alter table shifts enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;
alter table stock_movements enable row level security;
alter table ingredient_usage_logs enable row level security;
alter table waste_logs enable row level security;
alter table purchase_orders enable row level security;
alter table audit_logs enable row level security;

-- Create simple RLS policies allowing all operations for authenticated and anonymous users
-- (Typical for local/intranet Admin & POS dashboard clients)
create policy "Allow all tenants" on tenants for all to anon, authenticated using (true) with check (true);
create policy "Allow all branches" on branches for all to anon, authenticated using (true) with check (true);
create policy "Allow all categories" on categories for all to anon, authenticated using (true) with check (true);
create policy "Allow all products" on products for all to anon, authenticated using (true) with check (true);
create policy "Allow all customers" on customers for all to anon, authenticated using (true) with check (true);
create policy "Allow all users" on users for all to anon, authenticated using (true) with check (true);
create policy "Allow all suppliers" on suppliers for all to anon, authenticated using (true) with check (true);
create policy "Allow all ingredients" on ingredients for all to anon, authenticated using (true) with check (true);
create policy "Allow all tax_configs" on tax_configs for all to anon, authenticated using (true) with check (true);
create policy "Allow all discounts" on discounts for all to anon, authenticated using (true) with check (true);
create policy "Allow all shifts" on shifts for all to anon, authenticated using (true) with check (true);
create policy "Allow all transactions" on transactions for all to anon, authenticated using (true) with check (true);
create policy "Allow all transaction_items" on transaction_items for all to anon, authenticated using (true) with check (true);
create policy "Allow all stock_movements" on stock_movements for all to anon, authenticated using (true) with check (true);
create policy "Allow all ingredient_usage_logs" on ingredient_usage_logs for all to anon, authenticated using (true) with check (true);
create policy "Allow all waste_logs" on waste_logs for all to anon, authenticated using (true) with check (true);
create policy "Allow all purchase_orders" on purchase_orders for all to anon, authenticated using (true) with check (true);
create policy "Allow all audit_logs" on audit_logs for all to anon, authenticated using (true) with check (true);
