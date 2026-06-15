import { supabase } from "./supabase";
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_CUSTOMERS,
  MOCK_USERS,
  MOCK_SUPPLIERS,
  MOCK_TAX_CONFIGS,
  MOCK_DISCOUNTS,
  MOCK_BRANCHES,
  MOCK_INGREDIENTS
} from "./mock-data";
import type { PurchaseOrder } from "@/types";
import type {
  Product,
  Customer,
  Employee,
  Category,
  Discount,
  Supplier,
  TaxConfig,
  Transaction,
  Shift,
  StockMovement,
  AuditLog,
  Branch
} from "@/types";
import type { Ingredient } from "@/types/ingredient";
import type { WasteLog, WasteLogItem, CreateWasteLogPayload, WasteAnalytics } from "@/types/waste-log";

// Helper to remove undefined fields
function cleanData<T>(obj: T): T {
  if (obj === undefined) return null as any;
  return JSON.parse(JSON.stringify(obj));
}

// ─── Seeding Logic ───
async function seedTableIfEmpty(tableName: string, mockData: any[]) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (!error && count === 0) {
    console.log(`Seeding Supabase table: ${tableName}`);
    const cleaned = mockData.map(item => JSON.parse(JSON.stringify(item)));
    const { error: insertError } = await supabase.from(tableName).insert(cleaned);
    if (insertError) {
      console.error(`Error seeding ${tableName}:`, insertError);
    }
  }
}

export async function seedInitialData() {
  try {
    await seedTableIfEmpty("branches", MOCK_BRANCHES);
    await seedTableIfEmpty("categories", MOCK_CATEGORIES);
    await seedTableIfEmpty("suppliers", MOCK_SUPPLIERS);
    await seedTableIfEmpty("users", MOCK_USERS);
    await seedTableIfEmpty("tax_configs", MOCK_TAX_CONFIGS);
    await seedTableIfEmpty("discounts", MOCK_DISCOUNTS);
    await seedTableIfEmpty("customers", MOCK_CUSTOMERS);
    await seedTableIfEmpty("products", MOCK_PRODUCTS);
    await seedTableIfEmpty("ingredients", MOCK_INGREDIENTS);
    console.log("Supabase seeding check completed successfully!");
  } catch (error) {
    console.error("Error seeding initial data to Supabase:", error);
  }
}

// ─── Branches ───
export async function getBranches(): Promise<Branch[]> {
  const { data, error } = await supabase.from("branches").select("*");
  if (error) throw error;
  return data || [];
}

// ─── Categories ───
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) throw error;
  return data || [];
}

export async function addCategory(category: Omit<Category, "id" | "product_count">): Promise<Category> {
  const id = Date.now();
  const newCategory: Category = {
    ...category,
    id,
    product_count: 0,
  };
  const { error } = await supabase.from("categories").insert([cleanData(newCategory)]);
  if (error) throw error;
  return newCategory;
}


// ─── Products CRUD ───
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*");
  if (error) throw error;
  return data || [];
}

export async function addProduct(product: Omit<Product, "id" | "created_at">): Promise<Product> {
  const id = Date.now();
  const newProduct: Product = {
    ...product,
    id,
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from("products").insert([cleanData(newProduct)]);
  if (error) throw error;
  return newProduct;
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<void> {
  const { error } = await supabase.from("products").update(cleanData(data)).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ─── Customers CRUD ───
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from("customers").select("*");
  if (error) throw error;
  return data || [];
}

export async function addCustomer(customer: Omit<Customer, "id" | "created_at">): Promise<Customer> {
  const id = Date.now();
  const newCustomer: Customer = {
    ...customer,
    id,
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from("customers").insert([cleanData(newCustomer)]);
  if (error) throw error;
  return newCustomer;
}

export async function updateCustomer(id: number, data: Partial<Customer>): Promise<void> {
  const { error } = await supabase.from("customers").update(cleanData(data)).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: number): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// ─── Employees (Users) CRUD ───
export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return (data || []).map(raw => ({
    id: raw.id,
    user_id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    branch_id: raw.branch_id,
    branch_name: raw.branch_name,
    is_active: raw.is_active,
    created_at: raw.created_at,
  }));
}

export async function addEmployee(employee: Omit<Employee, "id" | "created_at" | "user_id">): Promise<Employee> {
  const id = Date.now();
  const newEmployeeUser = {
    id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    branch_id: employee.branch_id,
    branch_name: employee.branch_name,
    permissions: employee.role === 'cashier' ? ['sales.create'] : ['*'],
    is_active: employee.is_active,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("users").insert([cleanData(newEmployeeUser)]);
  if (error) throw error;
  return {
    ...employee,
    id,
    user_id: id,
    created_at: newEmployeeUser.created_at
  };
}

export async function updateEmployee(id: number, data: Partial<Employee>): Promise<void> {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.branch_id !== undefined) updateData.branch_id = data.branch_id;
  if (data.branch_name !== undefined) updateData.branch_name = data.branch_name;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  
  const { error } = await supabase.from("users").update(cleanData(updateData)).eq("id", id);
  if (error) throw error;
}

export async function deleteEmployee(id: number): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
}

// ─── Discounts CRUD ───
export async function getDiscounts(): Promise<Discount[]> {
  const { data, error } = await supabase.from("discounts").select("*");
  if (error) throw error;
  const discounts = data || [];

  // Auto-deactivate expired discounts
  const today = new Date().toISOString().split('T')[0];
  for (const d of discounts) {
    if (d.is_active && d.end_date && d.end_date < today) {
      await supabase.from("discounts").update({ is_active: false }).eq("id", d.id);
      d.is_active = false;
    }
  }
  return discounts;
}

export async function addDiscount(discount: Omit<Discount, "id" | "created_at">): Promise<Discount> {
  const id = Date.now();
  const newDiscount: Discount = {
    ...discount,
    id,
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from("discounts").insert([cleanData(newDiscount)]);
  if (error) throw error;
  return newDiscount;
}

export async function updateDiscount(id: number, data: Partial<Discount>): Promise<void> {
  const { error } = await supabase.from("discounts").update(cleanData(data)).eq("id", id);
  if (error) throw error;
}

export async function deleteDiscount(id: number): Promise<void> {
  const { error } = await supabase.from("discounts").delete().eq("id", id);
  if (error) throw error;
}

// ─── Suppliers CRUD ───
export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from("suppliers").select("*");
  if (error) throw error;
  return data || [];
}

export async function addSupplier(supplier: Omit<Supplier, "id" | "created_at">): Promise<Supplier> {
  const id = Date.now();
  const newSupplier: Supplier = {
    ...supplier,
    id,
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from("suppliers").insert([cleanData(newSupplier)]);
  if (error) throw error;
  return newSupplier;
}

export async function updateSupplier(id: number, data: Partial<Supplier>): Promise<void> {
  const { error } = await supabase.from("suppliers").update(cleanData(data)).eq("id", id);
  if (error) throw error;
}

export async function deleteSupplier(id: number): Promise<void> {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}

// ─── Tax Configs CRUD ───
export async function getTaxConfigs(): Promise<TaxConfig[]> {
  const { data, error } = await supabase.from("tax_configs").select("*");
  if (error) throw error;
  return data || [];
}

export async function updateTaxConfig(id: number, data: Partial<TaxConfig>): Promise<void> {
  const { error } = await supabase.from("tax_configs").update(cleanData(data)).eq("id", id);
  if (error) throw error;
}

// ─── Stock Adjustments & Movements ───
export async function getStockMovements(): Promise<StockMovement[]> {
  const { data, error } = await supabase.from("stock_movements").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adjustStock(
  productId: number,
  quantity: number,
  type: 'add' | 'subtract' | 'set',
  reason: string,
  userName: string,
  branchName: string
): Promise<number> {
  const { data: prod, error: prodErr } = await supabase.from("products").select("name, stock").eq("id", productId).single();
  if (prodErr || !prod) throw new Error("Produk tidak ditemukan");

  const oldStock = prod.stock;
  let newStock = oldStock;
  let moveQty = quantity;

  if (type === 'add') {
    newStock = oldStock + quantity;
  } else if (type === 'subtract') {
    newStock = oldStock - quantity;
  } else {
    newStock = quantity;
    moveQty = Math.abs(newStock - oldStock);
  }

  const { error: updateErr } = await supabase.from("products").update({ stock: newStock }).eq("id", productId);
  if (updateErr) throw updateErr;

  // Log stock movement
  const newMovement: StockMovement = {
    id: Date.now(),
    product_id: productId,
    product_name: prod.name,
    type: type === 'subtract' ? 'out' : 'adjustment',
    quantity: moveQty,
    reference: `ADJ-${Date.now()}`,
    reason,
    user_name: userName,
    branch_name: branchName,
    created_at: new Date().toISOString()
  };
  await supabase.from("stock_movements").insert([cleanData(newMovement)]);

  // Log audit trail
  const newAudit: AuditLog = {
    id: Date.now(),
    user_id: Date.now(),
    user_name: userName,
    action: "adjust_stock",
    module: "inventory",
    description: `Penyesuaian stok produk ${prod.name} dari ${oldStock} ke ${newStock}.`,
    old_value: String(oldStock),
    new_value: String(newStock),
    branch_id: 1,
    created_at: new Date().toISOString()
  };
  await supabase.from("audit_logs").insert([cleanData(newAudit)]);

  return newStock;
}

// ─── Transactions CRUD ───
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addTransaction(transaction: Omit<Transaction, "id" | "created_at">): Promise<Transaction> {
  const id = Date.now();
  const newTransaction: Transaction = {
    ...transaction,
    id,
    created_at: new Date().toISOString()
  };

  const { error: txError } = await supabase.from("transactions").insert([cleanData(newTransaction)]);
  if (txError) throw txError;

  // Insert items
  const itemsToInsert = transaction.items.map((item, index) => ({
    id: Date.now() + index + Math.floor(Math.random() * 1000),
    transaction_id: id,
    product_id: item.product_id,
    product_name: item.product_name,
    sku: item.sku,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_amount: item.discount_amount,
    subtotal: item.subtotal
  }));
  const { error: itemsError } = await supabase.from("transaction_items").insert(itemsToInsert);
  if (itemsError) throw itemsError;

  // Deduct stocks
  for (const item of transaction.items) {
    const { data: product } = await supabase.from("products").select("stock, use_recipe, ingredients").eq("id", item.product_id).single();
    if (product) {
      await supabase.from("products").update({ stock: product.stock - item.quantity }).eq("id", item.product_id);

      const movementId = Date.now() + Math.floor(Math.random() * 1000);
      const movementData: StockMovement = {
        id: movementId,
        product_id: item.product_id,
        product_name: item.product_name,
        type: 'out',
        quantity: item.quantity,
        reference: transaction.invoice_number,
        reason: 'Penjualan Kasir',
        user_name: transaction.cashier_name,
        branch_name: transaction.branch_name,
        created_at: new Date().toISOString()
      };
      await supabase.from("stock_movements").insert([cleanData(movementData)]);

      // Check resep
      if (product.use_recipe && Array.isArray(product.ingredients)) {
        for (const recipeItem of product.ingredients) {
          const { data: ing } = await supabase.from("ingredients").select("stock").eq("id", recipeItem.ingredient_id).single();
          if (ing) {
            const qtyUsed = recipeItem.quantity_needed * item.quantity;
            await supabase.from("ingredients").update({ stock: Number(ing.stock) - qtyUsed }).eq("id", recipeItem.ingredient_id);

            const usageId = Date.now() + Math.floor(Math.random() * 10000);
            await supabase.from("ingredient_usage_logs").insert([cleanData({
              id: usageId,
              ingredient_id: recipeItem.ingredient_id,
              product_id: item.product_id,
              transaction_id: id,
              quantity_used: qtyUsed,
              notes: 'Pengurangan otomatis penjualan POS',
              created_at: new Date().toISOString()
            })]);
          }
        }
      }
    }
  }

  // Update cashier shift stats
  if (transaction.shift_id) {
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", transaction.shift_id).single();
    if (shift) {
      let cashReceived = 0;
      let nonCashReceived = 0;

      transaction.payments.forEach(p => {
        if (p.method === 'cash') {
          cashReceived += (p.amount - transaction.change_amount);
        } else {
          nonCashReceived += p.amount;
        }
      });

      await supabase.from("shifts").update({
        total_sales: Number(shift.total_sales) + transaction.total,
        total_transactions: shift.total_transactions + 1,
        total_cash_sales: Number(shift.total_cash_sales) + cashReceived,
        total_non_cash_sales: Number(shift.total_non_cash_sales) + nonCashReceived
      }).eq("id", transaction.shift_id);
    }
  }

  // Update customer loyalty
  if (transaction.customer_id) {
    const { data: customer } = await supabase.from("customers").select("*").eq("id", transaction.customer_id).single();
    if (customer) {
      const pointsEarned = Math.floor(transaction.total / 10000);
      await supabase.from("customers").update({
        loyalty_points: customer.loyalty_points + pointsEarned,
        total_spent: Number(customer.total_spent) + transaction.total,
        total_transactions: customer.total_transactions + 1,
        last_visit: new Date().toISOString()
      }).eq("id", transaction.customer_id);

      const loyaltyTransId = Date.now() + Math.floor(Math.random() * 1000);
      await supabase.from("loyalty_transactions").insert([cleanData({
        id: loyaltyTransId,
        customer_id: transaction.customer_id,
        customer_name: transaction.customer_name || 'Member',
        type: 'earn',
        points: pointsEarned,
        balance_after: customer.loyalty_points + pointsEarned,
        reference: transaction.invoice_number,
        notes: 'Belanja Kasir',
        created_at: new Date().toISOString()
      })]);
    }
  }

  return newTransaction;
}

export async function updateTransactionStatus(
  id: number,
  status: 'completed' | 'voided' | 'refunded',
  voidReason?: string,
  voidedBy?: string
): Promise<void> {
  const updateData: any = { status };
  if (voidReason) updateData.void_reason = voidReason;
  if (voidedBy) updateData.voided_by = voidedBy;

  if (status === 'voided' || status === 'refunded') {
    const { data: transaction } = await supabase.from("transactions").select("*").eq("id", id).single();
    if (transaction) {
      // Update transaction status
      await supabase.from("transactions").update(cleanData(updateData)).eq("id", id);

      // Restore product stock
      const { data: items } = await supabase.from("transaction_items").select("*").eq("transaction_id", id);
      for (const item of (items || [])) {
        const { data: product } = await supabase.from("products").select("stock, use_recipe, ingredients").eq("id", item.product_id).single();
        if (product) {
          await supabase.from("products").update({ stock: product.stock + item.quantity }).eq("id", item.product_id);

          const movementId = Date.now() + Math.floor(Math.random() * 1000);
          const movementData: StockMovement = {
            id: movementId,
            product_id: item.product_id,
            product_name: item.product_name,
            type: 'in',
            quantity: item.quantity,
            reference: transaction.invoice_number,
            reason: status === 'voided' ? 'Void Transaksi' : 'Refund Transaksi',
            user_name: voidedBy || 'System',
            branch_name: transaction.branch_name,
            created_at: new Date().toISOString()
          };
          await supabase.from("stock_movements").insert([cleanData(movementData)]);

          // Restore ingredients
          if (product.use_recipe && Array.isArray(product.ingredients)) {
            for (const recipeItem of product.ingredients) {
              const { data: ing } = await supabase.from("ingredients").select("stock").eq("id", recipeItem.ingredient_id).single();
              if (ing) {
                await supabase.from("ingredients").update({ stock: Number(ing.stock) + (recipeItem.quantity_needed * item.quantity) }).eq("id", recipeItem.ingredient_id);
              }
            }
          }
        }
      }

      // Adjust shift stats
      if (transaction.shift_id) {
        const { data: shift } = await supabase.from("shifts").select("*").eq("id", transaction.shift_id).single();
        if (shift) {
          let cashReceived = 0;
          let nonCashReceived = 0;
          transaction.payments?.forEach((p: any) => {
            if (p.method === 'cash') {
              cashReceived += (p.amount - transaction.change_amount);
            } else {
              nonCashReceived += p.amount;
            }
          });

          await supabase.from("shifts").update({
            total_sales: Number(shift.total_sales) - transaction.total,
            total_transactions: shift.total_transactions - 1,
            total_cash_sales: Number(shift.total_cash_sales) - cashReceived,
            total_non_cash_sales: Number(shift.total_non_cash_sales) - nonCashReceived
          }).eq("id", transaction.shift_id);
        }
      }

      // Adjust customer total_spent and points
      if (transaction.customer_id) {
        const { data: customer } = await supabase.from("customers").select("*").eq("id", transaction.customer_id).single();
        if (customer) {
          const pointsEarned = Math.floor(transaction.total / 10000);
          await supabase.from("customers").update({
            loyalty_points: customer.loyalty_points - pointsEarned,
            total_spent: Number(customer.total_spent) - transaction.total,
            total_transactions: customer.total_transactions - 1
          }).eq("id", transaction.customer_id);

          const loyaltyTransId = Date.now() + Math.floor(Math.random() * 1000);
          await supabase.from("loyalty_transactions").insert([cleanData({
            id: loyaltyTransId,
            customer_id: transaction.customer_id,
            customer_name: transaction.customer_name || 'Member',
            type: 'redeem',
            points: pointsEarned,
            balance_after: customer.loyalty_points - pointsEarned,
            reference: transaction.invoice_number,
            notes: status === 'voided' ? 'Deduction (Void)' : 'Deduction (Refund)',
            created_at: new Date().toISOString()
          })]);
        }
      }

      // Log Audit Trail
      const auditId = Date.now() + Math.floor(Math.random() * 1000);
      const auditLog: AuditLog = {
        id: auditId,
        user_id: 1,
        user_name: voidedBy || 'System',
        action: status === 'voided' ? 'VOID' : 'REFUND',
        module: 'transactions',
        description: `${status === 'voided' ? 'Void' : 'Refund'} Transaksi ${transaction.invoice_number} karena: ${voidReason || '-'}`,
        created_at: new Date().toISOString()
      };
      await supabase.from("audit_logs").insert([cleanData(auditLog)]);
      return;
    }
  }

  // Fallback
  await supabase.from("transactions").update(cleanData(updateData)).eq("id", id);
}

// ─── Shifts CRUD ───
export async function getShifts(): Promise<Shift[]> {
  const { data, error } = await supabase.from("shifts").select("*").order("opened_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function openShift(
  cashierId: number,
  cashierName: string,
  branchId: number,
  branchName: string,
  openingCash: number
): Promise<Shift> {
  const id = Date.now();
  const newShift: Shift = {
    id,
    cashier_id: cashierId,
    cashier_name: cashierName,
    branch_id: branchId,
    branch_name: branchName,
    opening_cash: openingCash,
    total_sales: 0,
    total_transactions: 0,
    total_cash_sales: 0,
    total_non_cash_sales: 0,
    status: 'open',
    opened_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("shifts").insert([cleanData(newShift)]);
  if (error) throw error;
  return newShift;
}

export async function closeShift(
  shiftId: number,
  closingCash: number,
  notes?: string
): Promise<Shift> {
  const { data: shift, error: shiftErr } = await supabase.from("shifts").select("*").eq("id", shiftId).single();
  if (shiftErr || !shift) throw new Error("Shift tidak ditemukan");

  const expectedCash = shift.opening_cash + shift.total_cash_sales;
  const difference = closingCash - expectedCash;

  const updateData: Partial<Shift> = {
    closing_cash: closingCash,
    expected_cash: expectedCash,
    difference,
    status: 'closed',
    closed_at: new Date().toISOString(),
    notes: notes || ""
  };

  const { error } = await supabase.from("shifts").update(cleanData(updateData)).eq("id", shiftId);
  if (error) throw error;

  return {
    ...shift,
    ...updateData
  };
}

export async function getCurrentShift(cashierId: number): Promise<Shift | null> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("cashier_id", cashierId)
    .eq("status", "open")
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

// ─── Purchase Orders CRUD ───
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { data, error } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updatePOStatus(
  poId: number,
  newStatus: PurchaseOrder['status']
): Promise<void> {
  if (newStatus === 'received') {
    const { data: po } = await supabase.from("purchase_orders").select("*").eq("id", poId).single();
    if (po) {
      await supabase.from("purchase_orders").update({ status: newStatus }).eq("id", poId);
      for (const item of (po.items || [])) {
        const { data: product } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
        if (product) {
          await supabase.from("products").update({ stock: product.stock + item.quantity }).eq("id", item.product_id);
          
          const movementId = Date.now() + Math.floor(Math.random() * 1000);
          await supabase.from("stock_movements").insert([cleanData({
            id: movementId,
            product_id: item.product_id,
            product_name: item.product_name,
            type: 'in',
            quantity: item.quantity,
            reference: po.po_number,
            reason: 'Penerimaan PO',
            user_name: po.created_by,
            branch_name: 'Toko Pusat',
            created_at: new Date().toISOString()
          })]);
        }
      }
      return;
    }
  }

  await supabase.from("purchase_orders").update({ status: newStatus }).eq("id", poId);
}

// ─── Audit Trail ───
export async function logAuditTrail(
  userName: string,
  action: string,
  module: string,
  description: string,
  oldValue?: string,
  newValue?: string
): Promise<void> {
  const id = Date.now();
  const auditData = {
    id,
    user_id: id,
    user_name: userName,
    action,
    module,
    description,
    old_value: oldValue || null,
    new_value: newValue || null,
    created_at: new Date().toISOString()
  };
  await supabase.from("audit_logs").insert([cleanData(auditData)]);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─── Backup & Restore ───
export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const tables = ['products', 'categories', 'customers', 'users', 'suppliers',
    'discounts', 'tax_configs', 'transactions', 'shifts', 'stock_movements',
    'audit_logs', 'branches', 'purchase_orders', 'loyalty_transactions', 'ingredients', 'ingredient_usage_logs', 'waste_logs'];

  const result: Record<string, unknown[]> = {};
  for (const table of tables) {
    try {
      const { data } = await supabase.from(table).select("*");
      result[table] = data || [];
    } catch { result[table] = []; }
  }
  return result;
}

export async function importData(data: Record<string, unknown[]>): Promise<number> {
  let count = 0;
  for (const [table, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      await supabase.from(table).upsert(cleanData(item) as any);
      count++;
    }
  }
  return count;
}

// ─── Ingredients CRUD ───
export async function getIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from("ingredients").select("*");
  if (error) throw error;
  return data || [];
}

export async function addIngredient(ingredient: Omit<Ingredient, "id" | "created_at" | "updated_at" | "deleted_at" | "avg_cost_price">): Promise<Ingredient> {
  const id = Date.now();
  const newIngredient: Ingredient = {
    ...ingredient,
    id,
    sku: ingredient.sku || `ING-${id.toString().slice(-6)}`,
    avg_cost_price: ingredient.cost_price,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };
  const { error } = await supabase.from("ingredients").insert([cleanData(newIngredient)]);
  if (error) throw error;
  return newIngredient;
}

export async function updateIngredient(id: number, data: Partial<Ingredient>): Promise<void> {
  const clean = cleanData({
    ...data,
    updated_at: new Date().toISOString()
  });
  const { error } = await supabase.from("ingredients").update(clean).eq("id", id);
  if (error) throw error;
}

export async function deleteIngredient(id: number): Promise<void> {
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) throw error;
}

export async function stockInIngredient(id: number, quantity: number, unitCost: number, reference?: string): Promise<void> {
  const { data: ingredient, error } = await supabase.from("ingredients").select("*").eq("id", id).single();
  if (error || !ingredient) throw new Error("Bahan baku tidak ditemukan");

  const oldStock = Number(ingredient.stock || 0);
  const oldAvg = Number(ingredient.avg_cost_price || ingredient.cost_price || 0);
  const totalStock = oldStock + quantity;
  const newAvg = totalStock > 0 ? (oldStock * oldAvg + quantity * unitCost) / totalStock : oldAvg;

  await supabase.from("ingredients").update({
    stock: totalStock,
    avg_cost_price: newAvg,
    cost_price: unitCost,
    updated_at: new Date().toISOString()
  }).eq("id", id);

  // Log stock movement
  const movementId = Date.now();
  await supabase.from("stock_movements").insert([cleanData({
    id: movementId,
    product_id: id,
    product_name: `[Bahan] ${ingredient.name}`,
    type: 'in',
    quantity: quantity,
    reference: reference || `STK-IN-${movementId}`,
    reason: 'Penerimaan Bahan Baku',
    user_name: 'Admin',
    branch_name: 'Toko Pusat',
    created_at: new Date().toISOString()
  })]);
}

// ─── Waste Logs CRUD ───
export async function getWasteLogs(): Promise<WasteLog[]> {
  const { data, error } = await supabase.from("waste_logs").select("*").order("logged_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function recordWasteAndDeductStock(
  payload: CreateWasteLogPayload,
  userName: string
): Promise<WasteLog> {
  const id = Date.now();
  let totalLossAmount = 0;
  const itemsWithDetails: WasteLogItem[] = [];

  for (let idx = 0; idx < payload.items.length; idx++) {
    const item = payload.items[idx];
    const itemId = id + idx + 1;
    let itemName = '';
    let unit = 'pcs';
    let costAtTime = 0;

    if (item.wasted_type === 'ingredient') {
      const { data: ing } = await supabase.from("ingredients").select("*").eq("id", item.wasted_id).single();
      if (!ing) throw new Error(`Bahan baku ID ${item.wasted_id} tidak ditemukan`);
      
      itemName = ing.name;
      unit = ing.unit;
      costAtTime = Number(ing.avg_cost_price || ing.cost_price || 0);

      await supabase.from("ingredients").update({
        stock: Number(ing.stock) - item.quantity,
        updated_at: new Date().toISOString()
      }).eq("id", item.wasted_id);

      const movementId = Date.now() + idx + 1000;
      await supabase.from("stock_movements").insert([cleanData({
        id: movementId,
        product_id: item.wasted_id,
        product_name: `[Bahan] ${ing.name}`,
        type: 'out',
        quantity: item.quantity,
        reference: `WASTE-${id}`,
        reason: `Limbah: ${item.reason}`,
        user_name: userName,
        branch_name: 'Toko Pusat',
        created_at: new Date().toISOString()
      })]);
    } else {
      const { data: prod } = await supabase.from("products").select("*").eq("id", item.wasted_id).single();
      if (!prod) throw new Error(`Produk ID ${item.wasted_id} tidak ditemukan`);

      itemName = prod.name;
      unit = prod.unit || 'pcs';
      costAtTime = Number(prod.cost_price || 0);

      await supabase.from("products").update({ stock: prod.stock - item.quantity }).eq("id", item.wasted_id);

      const movementId = Date.now() + idx + 2000;
      await supabase.from("stock_movements").insert([cleanData({
        id: movementId,
        product_id: item.wasted_id,
        product_name: prod.name,
        type: 'out',
        quantity: item.quantity,
        reference: `WASTE-${id}`,
        reason: `Limbah: ${item.reason}`,
        user_name: userName,
        branch_name: 'Toko Pusat',
        created_at: new Date().toISOString()
      })]);
    }

    const itemTotalCost = costAtTime * item.quantity;
    totalLossAmount += itemTotalCost;

    itemsWithDetails.push({
      id: itemId,
      waste_log_id: id,
      wasted_type: item.wasted_type,
      wasted_id: item.wasted_id,
      item_name: itemName,
      unit,
      quantity: item.quantity,
      cost_at_time: costAtTime,
      total_cost: itemTotalCost,
      reason: item.reason as any,
      reason_detail: item.reason_detail || null,
      created_at: new Date().toISOString()
    });
  }

  const newWasteLog: WasteLog = {
    id,
    user_id: 1,
    user_name: userName,
    total_loss_amount: totalLossAmount,
    logged_at: payload.logged_at,
    notes: payload.notes || null,
    items: itemsWithDetails,
    created_at: new Date().toISOString()
  };

  await supabase.from("waste_logs").insert([cleanData(newWasteLog)]);

  // Audit
  const auditId = Date.now() + 500;
  await supabase.from("audit_logs").insert([cleanData({
    id: auditId,
    user_id: 1,
    user_name: userName,
    action: "create_waste_log",
    module: "waste_logs",
    description: `Mencatat log limbah dengan total kerugian Rp ${totalLossAmount.toLocaleString('id-ID')}`,
    old_value: null,
    new_value: String(totalLossAmount),
    created_at: new Date().toISOString()
  })]);

  return newWasteLog;
}

export async function getWasteAnalytics(): Promise<WasteAnalytics> {
  const logs = await getWasteLogs();
  let totalLoss = 0;
  const reasonMap: Record<string, { count: number; cost: number }> = {};
  const itemMap: Record<string, { name: string; type: string; qty: number; cost: number }> = {};

  logs.forEach(log => {
    totalLoss += Number(log.total_loss_amount || 0);
    log.items?.forEach(item => {
      const r = item.reason;
      if (!reasonMap[r]) reasonMap[r] = { count: 0, cost: 0 };
      reasonMap[r].count += 1;
      reasonMap[r].cost += Number(item.total_cost || 0);

      const key = `${item.wasted_type}-${item.wasted_id}`;
      if (!itemMap[key]) {
        itemMap[key] = {
          name: item.item_name,
          type: item.wasted_type,
          qty: 0,
          cost: 0
        };
      }
      itemMap[key].qty += item.quantity;
      itemMap[key].cost += Number(item.total_cost || 0);
    });
  });

  const by_reason = Object.entries(reasonMap).map(([reason, data]) => ({
    reason: reason as any,
    count: data.count,
    total_cost: data.cost
  }));

  const top_items = Object.values(itemMap)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5)
    .map(x => ({
      item_name: x.name,
      wasted_type: x.type,
      total_qty: x.qty,
      total_cost: x.cost
    }));

  return {
    period: { from: '', to: '' },
    total_loss: totalLoss,
    by_reason,
    top_items
  };
}

export async function getIngredientUsageLogs(): Promise<any[]> {
  const { data, error } = await supabase.from("ingredient_usage_logs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
