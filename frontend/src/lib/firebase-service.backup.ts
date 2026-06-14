import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  increment,
  Timestamp
} from "firebase/firestore";
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_CUSTOMERS,
  MOCK_USERS,
  MOCK_SUPPLIERS,
  MOCK_TAX_CONFIGS,
  MOCK_DISCOUNTS,
  MOCK_BRANCHES,
  DEFAULT_CASHIER_PERMISSIONS,
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
// Helper to recursively remove undefined fields so Firestore doesn't throw errors
function cleanData<T>(obj: T): T {
  if (obj === undefined) return null as any;
  return JSON.parse(JSON.stringify(obj));
}

// Helper to check if a collection is empty and seed it
async function seedCollectionIfEmpty<T>(collectionName: string, mockData: T[], idMapper: (item: T) => string) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) {
    console.log(`Seeding Firestore collection: ${collectionName}`);
    const batch = writeBatch(db);
    mockData.forEach((item) => {
      const docId = idMapper(item);
      const docRef = doc(db, collectionName, docId);
      // Remove undefined fields to avoid Firebase error
      const cleaned = JSON.parse(JSON.stringify(item));
      batch.set(docRef, cleaned);
    });
    await batch.commit();
  }
}

// Global seeding function
export async function seedInitialData() {
  try {
    await seedCollectionIfEmpty("branches", MOCK_BRANCHES, (item) => String(item.id));
    await seedCollectionIfEmpty("categories", MOCK_CATEGORIES, (item) => String(item.id));
    await seedCollectionIfEmpty("products", MOCK_PRODUCTS, (item) => String(item.id));
    await seedCollectionIfEmpty("customers", MOCK_CUSTOMERS, (item) => String(item.id));
    await seedCollectionIfEmpty("suppliers", MOCK_SUPPLIERS, (item) => String(item.id));
    await seedCollectionIfEmpty("tax_configs", MOCK_TAX_CONFIGS, (item) => String(item.id));
    await seedCollectionIfEmpty("discounts", MOCK_DISCOUNTS, (item) => String(item.id));
    await seedCollectionIfEmpty("users", MOCK_USERS, (item) => String(item.id));
    await seedCollectionIfEmpty("ingredients", MOCK_INGREDIENTS, (item) => String(item.id));
    console.log("Firestore seeding check completed successfully!");
  } catch (error) {
    console.error("Error seeding initial data to Firestore:", error);
  }
}

// ─── Branches ───
export async function getBranches(): Promise<Branch[]> {
  const colRef = collection(db, "branches");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => d.data() as Branch);
}

// ─── Categories ───
export async function getCategories(): Promise<Category[]> {
  const colRef = collection(db, "categories");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => d.data() as Category);
}

// ─── Products CRUD ───
export async function getProducts(): Promise<Product[]> {
  const colRef = collection(db, "products");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => d.data() as Product);
}

export async function addProduct(product: Omit<Product, "id" | "created_at">): Promise<Product> {
  const colRef = collection(db, "products");
  const id = Date.now();
  const newProduct: Product = {
    ...product,
    id,
    created_at: new Date().toISOString()
  };
  await setDoc(doc(db, "products", String(id)), cleanData(newProduct));
  return newProduct;
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<void> {
  const docRef = doc(db, "products", String(id));
  await updateDoc(docRef, cleanData(data));
}

export async function deleteProduct(id: number): Promise<void> {
  const docRef = doc(db, "products", String(id));
  await deleteDoc(docRef);
}

// ─── Customers CRUD ───
export async function getCustomers(): Promise<Customer[]> {
  const colRef = collection(db, "customers");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => d.data() as Customer);
}

export async function addCustomer(customer: Omit<Customer, "id" | "created_at">): Promise<Customer> {
  const colRef = collection(db, "customers");
  const id = Date.now();
  const newCustomer: Customer = {
    ...customer,
    id,
    created_at: new Date().toISOString()
  };
  await setDoc(doc(db, "customers", String(id)), cleanData(newCustomer));
  return newCustomer;
}

export async function updateCustomer(id: number, data: Partial<Customer>): Promise<void> {
  const docRef = doc(db, "customers", String(id));
  await updateDoc(docRef, cleanData(data));
}

export async function deleteCustomer(id: number): Promise<void> {
  const docRef = doc(db, "customers", String(id));
  await deleteDoc(docRef);
}

// ─── Employees (Users) CRUD ───
export async function getEmployees(): Promise<Employee[]> {
  const colRef = collection(db, "users");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => {
    const raw = d.data();
    return {
      id: raw.id,
      user_id: raw.id,
      name: raw.name,
      email: raw.email,
      role: raw.role,
      branch_id: raw.branch_id,
      branch_name: raw.branch_name,
      is_active: raw.is_active,
      created_at: raw.created_at,
    } as Employee;
  });
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
  await setDoc(doc(db, "users", String(id)), cleanData(newEmployeeUser));
  return {
    ...employee,
    id,
    user_id: id,
    created_at: newEmployeeUser.created_at
  };
}

export async function updateEmployee(id: number, data: Partial<Employee>): Promise<void> {
  const docRef = doc(db, "users", String(id));
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.branch_id !== undefined) updateData.branch_id = data.branch_id;
  if (data.branch_name !== undefined) updateData.branch_name = data.branch_name;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  await updateDoc(docRef, cleanData(updateData));
}

export async function deleteEmployee(id: number): Promise<void> {
  const docRef = doc(db, "users", String(id));
  await deleteDoc(docRef);
}

// ─── Discounts CRUD ───
export async function getDiscounts(): Promise<Discount[]> {
  const colRef = collection(db, "discounts");
  const snapshot = await getDocs(colRef);
  const discounts = snapshot.docs.map(d => d.data() as Discount);

  // A10: Auto-deactivate expired discounts
  const today = new Date().toISOString().split('T')[0];
  const batch = writeBatch(db);
  let batchNeeded = false;
  for (const d of discounts) {
    if (d.is_active && d.end_date && d.end_date < today) {
      const docRef = doc(db, "discounts", String(d.id));
      batch.update(docRef, { is_active: false });
      d.is_active = false;
      batchNeeded = true;
    }
  }
  if (batchNeeded) {
    try { await batch.commit(); } catch (e) { console.warn('Auto-deactivate expired discounts failed:', e); }
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
  await setDoc(doc(db, "discounts", String(id)), cleanData(newDiscount));
  return newDiscount;
}

export async function updateDiscount(id: number, data: Partial<Discount>): Promise<void> {
  const docRef = doc(db, "discounts", String(id));
  await updateDoc(docRef, cleanData(data));
}

export async function deleteDiscount(id: number): Promise<void> {
  const docRef = doc(db, "discounts", String(id));
  await deleteDoc(docRef);
}

// ─── Suppliers CRUD ───
export async function getSuppliers(): Promise<Supplier[]> {
  const colRef = collection(db, "suppliers");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => d.data() as Supplier);
}

export async function addSupplier(supplier: Omit<Supplier, "id" | "created_at">): Promise<Supplier> {
  const id = Date.now();
  const newSupplier: Supplier = {
    ...supplier,
    id,
    created_at: new Date().toISOString()
  };
  await setDoc(doc(db, "suppliers", String(id)), cleanData(newSupplier));
  return newSupplier;
}

export async function updateSupplier(id: number, data: Partial<Supplier>): Promise<void> {
  const docRef = doc(db, "suppliers", String(id));
  await updateDoc(docRef, cleanData(data));
}

export async function deleteSupplier(id: number): Promise<void> {
  const docRef = doc(db, "suppliers", String(id));
  await deleteDoc(docRef);
}

// ─── Tax Configs CRUD ───
export async function getTaxConfigs(): Promise<TaxConfig[]> {
  const colRef = collection(db, "tax_configs");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => d.data() as TaxConfig);
}

export async function updateTaxConfig(id: number, data: Partial<TaxConfig>): Promise<void> {
  const docRef = doc(db, "tax_configs", String(id));
  await updateDoc(docRef, cleanData(data));
}

// ─── Stock Adjustments & Movements ───
export async function getStockMovements(): Promise<StockMovement[]> {
  const colRef = collection(db, "stock_movements");
  const snapshot = await getDocs(query(colRef, orderBy("created_at", "desc")));
  return snapshot.docs.map(d => d.data() as StockMovement);
}

export async function adjustStock(
  productId: number,
  quantity: number,
  type: 'add' | 'subtract' | 'set',
  reason: string,
  userName: string,
  branchName: string
): Promise<number> {
  const prodDocRef = doc(db, "products", String(productId));
  
  // Find current stock
  const snapshot = await getDocs(query(collection(db, "products"), where("id", "==", productId)));
  if (snapshot.empty) throw new Error("Produk tidak ditemukan");
  
  const product = snapshot.docs[0].data() as Product;
  const oldStock = product.stock;
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

  // Update product stock
  await updateDoc(prodDocRef, { stock: newStock });

  // Log stock movement
  const movementRef = collection(db, "stock_movements");
  const newMovement: StockMovement = {
    id: Date.now(),
    product_id: productId,
    product_name: product.name,
    type: type === 'subtract' ? 'out' : 'adjustment',
    quantity: moveQty,
    reference: `ADJ-${Date.now()}`,
    reason,
    user_name: userName,
    branch_name: branchName,
    created_at: new Date().toISOString()
  };
  await setDoc(doc(db, "stock_movements", String(newMovement.id)), cleanData(newMovement));

  // Log audit trail
  const auditRef = collection(db, "audit_logs");
  const newAudit: AuditLog = {
    id: Date.now(),
    user_id: Date.now(), // Fallback
    user_name: userName,
    action: "adjust_stock",
    module: "inventory",
    description: `Penyesuaian stok produk ${product.name} dari ${oldStock} ke ${newStock}.`,
    old_value: String(oldStock),
    new_value: String(newStock),
    branch_id: 1, // Fallback
    created_at: new Date().toISOString()
  };
  await setDoc(doc(db, "audit_logs", String(newAudit.id)), cleanData(newAudit));

  return newStock;
}

// ─── Transactions CRUD ───
export async function getTransactions(): Promise<Transaction[]> {
  const colRef = collection(db, "transactions");
  const snapshot = await getDocs(query(colRef, orderBy("created_at", "desc")));
  return snapshot.docs.map(d => d.data() as Transaction);
}

export async function addTransaction(transaction: Omit<Transaction, "id" | "created_at">): Promise<Transaction> {
  const id = Date.now();
  const newTransaction: Transaction = {
    ...transaction,
    id,
    created_at: new Date().toISOString()
  };

  const batch = writeBatch(db);

  // 1. Save transaction doc
  const transRef = doc(db, "transactions", String(id));
  batch.set(transRef, cleanData(newTransaction));

  // 2. Reduce stock for each product & check recipes
  for (const item of transaction.items) {
    const productRef = doc(db, "products", String(item.product_id));
    batch.update(productRef, {
      stock: increment(-item.quantity)
    });

    const movementId = Date.now() + Math.floor(Math.random() * 1000);
    const movementRef = doc(db, "stock_movements", String(movementId));
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
    batch.set(movementRef, cleanData(movementData));

    // Check if product uses recipe (BOM) in Firestore
    const prodSnap = await getDocs(query(collection(db, "products"), where("id", "==", item.product_id)));
    if (!prodSnap.empty) {
      const product = prodSnap.docs[0].data() as any;
      if (product.use_recipe && Array.isArray(product.ingredients)) {
        for (const recipeItem of product.ingredients) {
          const ingDocRef = doc(db, "ingredients", String(recipeItem.ingredient_id));
          const qtyUsed = recipeItem.quantity_needed * item.quantity;
          
          batch.update(ingDocRef, {
            stock: increment(-qtyUsed)
          });

          // Log ingredient usage
          const usageId = Date.now() + Math.floor(Math.random() * 10000);
          const usageRef = doc(db, "ingredient_usage_logs", String(usageId));
          batch.set(usageRef, cleanData({
            id: usageId,
            ingredient_id: recipeItem.ingredient_id,
            product_id: item.product_id,
            transaksi_id: id,
            transaction_id: id,
            jumlah_digunakan: qtyUsed,
            quantity_used: qtyUsed,
            catatan: 'Pengurangan otomatis penjualan POS',
            notes: 'Pengurangan otomatis penjualan POS',
            created_at: new Date().toISOString()
          }));
        }
      }
    }
  }

  // 3. Update cashier shift stats
  if (transaction.shift_id) {
    const shiftRef = doc(db, "shifts", String(transaction.shift_id));
    let cashReceived = 0;
    let nonCashReceived = 0;

    transaction.payments.forEach(p => {
      if (p.method === 'cash') {
        cashReceived += (p.amount - transaction.change_amount);
      } else {
        nonCashReceived += p.amount;
      }
    });

    batch.update(shiftRef, {
      total_sales: increment(transaction.total),
      total_transactions: increment(1),
      total_cash_sales: increment(cashReceived),
      total_non_cash_sales: increment(nonCashReceived)
    });
  }

  // 4. Update customer stats & loyalty points
  if (transaction.customer_id) {
    const customerRef = doc(db, "customers", String(transaction.customer_id));
    const pointsEarned = Math.floor(transaction.total / 10000); // Rp 10.000 = 1 point

    batch.update(customerRef, {
      loyalty_points: increment(pointsEarned),
      total_spent: increment(transaction.total),
      total_transactions: increment(1),
      last_visit: new Date().toISOString()
    });

    // Log loyalty transaction
    const loyaltyTransId = Date.now() + Math.floor(Math.random() * 1000);
    const loyaltyTransRef = doc(db, "loyalty_transactions", String(loyaltyTransId));
    const loyaltyTransData = {
      id: loyaltyTransId,
      customer_id: transaction.customer_id,
      customer_name: transaction.customer_name || 'Member',
      type: 'earn',
      points: pointsEarned,
      balance_after: 0, // Fallback
      reference: transaction.invoice_number,
      notes: 'Belanja Kasir',
      created_at: new Date().toISOString()
    };
    batch.set(loyaltyTransRef, cleanData(loyaltyTransData));
  }

  // Commit all writes
  await batch.commit();

  return newTransaction;
}

export async function updateTransactionStatus(
  id: number,
  status: 'completed' | 'voided' | 'refunded',
  voidReason?: string,
  voidedBy?: string
): Promise<void> {
  const transRef = doc(db, "transactions", String(id));
  const updateData: any = { status };
  if (voidReason) updateData.void_reason = voidReason;
  if (voidedBy) updateData.voided_by = voidedBy;

  // If the status is being updated to voided or refunded, let's restore the stock!
  if (status === 'voided' || status === 'refunded') {
    const transSnap = await getDocs(query(collection(db, "transactions"), where("id", "==", id)));
    if (!transSnap.empty) {
      const transaction = transSnap.docs[0].data() as Transaction;
      const batch = writeBatch(db);

      // Update transaction status
      batch.update(transRef, cleanData(updateData));

      // Restore product stock
      for (const item of transaction.items) {
        const productRef = doc(db, "products", String(item.product_id));
        batch.update(productRef, {
          stock: increment(item.quantity)
        });

        const movementId = Date.now() + Math.floor(Math.random() * 1000);
        const movementRef = doc(db, "stock_movements", String(movementId));
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
        batch.set(movementRef, cleanData(movementData));

        // Restore ingredient stock
        const prodSnap = await getDocs(query(collection(db, "products"), where("id", "==", item.product_id)));
        if (!prodSnap.empty) {
          const product = prodSnap.docs[0].data() as any;
          if (product.use_recipe && Array.isArray(product.ingredients)) {
            for (const recipeItem of product.ingredients) {
              const ingDocRef = doc(db, "ingredients", String(recipeItem.ingredient_id));
              batch.update(ingDocRef, {
                stock: increment(recipeItem.quantity_needed * item.quantity)
              });
            }
          }
        }
      }

      // Also adjust shift statistics if shift_id is present
      if (transaction.shift_id) {
        const shiftRef = doc(db, "shifts", String(transaction.shift_id));
        let cashReceived = 0;
        let nonCashReceived = 0;

        transaction.payments.forEach(p => {
          if (p.method === 'cash') {
            cashReceived += (p.amount - transaction.change_amount);
          } else {
            nonCashReceived += p.amount;
          }
        });

        batch.update(shiftRef, {
          total_sales: increment(-transaction.total),
          total_transactions: increment(-1),
          total_cash_sales: increment(-cashReceived),
          total_non_cash_sales: increment(-nonCashReceived)
        });
      }

      // Also adjust customer total_spent and points if customer_id is present
      if (transaction.customer_id) {
        const customerRef = doc(db, "customers", String(transaction.customer_id));
        const pointsEarned = Math.floor(transaction.total / 10000);

        batch.update(customerRef, {
          loyalty_points: increment(-pointsEarned),
          total_spent: increment(-transaction.total),
          total_transactions: increment(-1)
        });

        // Log loyalty deduction
        const loyaltyTransId = Date.now() + Math.floor(Math.random() * 1000);
        const loyaltyTransRef = doc(db, "loyalty_transactions", String(loyaltyTransId));
        const loyaltyTransData = {
          id: loyaltyTransId,
          customer_id: transaction.customer_id,
          customer_name: transaction.customer_name || 'Member',
          type: 'redeem',
          points: pointsEarned,
          balance_after: 0,
          reference: transaction.invoice_number,
          notes: status === 'voided' ? 'Deduction (Void)' : 'Deduction (Refund)',
          created_at: new Date().toISOString()
        };
        batch.set(loyaltyTransRef, cleanData(loyaltyTransData));
      }

      // Log Audit Trail
      const auditId = Date.now() + Math.floor(Math.random() * 1000);
      const auditRef = doc(db, "audit_logs", String(auditId));
      const auditLog: AuditLog = {
        id: auditId,
        user_id: 1,
        user_name: voidedBy || 'System',
        action: status === 'voided' ? 'VOID' : 'REFUND',
        module: 'transactions',
        description: `${status === 'voided' ? 'Void' : 'Refund'} Transaksi ${transaction.invoice_number} karena: ${voidReason || '-'}`,
        created_at: new Date().toISOString()
      };
      batch.set(auditRef, cleanData(auditLog));

      await batch.commit();
      return;
    }
  }

  // Fallback / default status update (for non-void/refund or if transaction not found)
  await updateDoc(transRef, cleanData(updateData));

  // Log Audit Trail for regular status updates
  const auditId = Date.now() + Math.floor(Math.random() * 1000);
  const auditLog: AuditLog = {
    id: auditId,
    user_id: 1,
    user_name: voidedBy || 'System',
    action: 'UPDATE_STATUS',
    module: 'transactions',
    description: `Update Status Transaksi ke ${status}`,
    created_at: new Date().toISOString()
  };
  await setDoc(doc(db, "audit_logs", String(auditId)), cleanData(auditLog));
}


// ─── Shifts CRUD ───
export async function getShifts(): Promise<Shift[]> {
  const colRef = collection(db, "shifts");
  const snapshot = await getDocs(query(colRef, orderBy("opened_at", "desc")));
  return snapshot.docs.map(d => d.data() as Shift);
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
  await setDoc(doc(db, "shifts", String(id)), cleanData(newShift));
  return newShift;
}

export async function closeShift(
  shiftId: number,
  closingCash: number,
  notes?: string
): Promise<Shift> {
  const docRef = doc(db, "shifts", String(shiftId));
  const snapshot = await getDocs(query(collection(db, "shifts"), where("id", "==", shiftId)));
  if (snapshot.empty) throw new Error("Shift tidak ditemukan");
  
  const shift = snapshot.docs[0].data() as Shift;
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
  await updateDoc(docRef, cleanData(updateData));
  return {
    ...shift,
    ...updateData
  };
}

export async function getCurrentShift(cashierId: number): Promise<Shift | null> {
  const colRef = collection(db, "shifts");
  const q = query(
    colRef,
    where("cashier_id", "==", cashierId),
    where("status", "==", "open"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as Shift;
}

// ─── Purchase Orders CRUD ───
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const colRef = collection(db, "purchase_orders");
  const snapshot = await getDocs(query(colRef, orderBy("created_at", "desc")));
  if (snapshot.empty) {
    // Seed from mock data
    const { MOCK_PURCHASE_ORDERS } = await import('./mock-data');
    const batch = writeBatch(db);
    MOCK_PURCHASE_ORDERS.forEach(po => {
      batch.set(doc(db, "purchase_orders", String(po.id)), cleanData(po));
    });
    await batch.commit();
    return MOCK_PURCHASE_ORDERS;
  }
  return snapshot.docs.map(d => d.data() as PurchaseOrder);
}

export async function updatePOStatus(
  poId: number,
  newStatus: PurchaseOrder['status']
): Promise<void> {
  const docRef = doc(db, "purchase_orders", String(poId));

  // If receiving, also update product stock
  if (newStatus === 'received') {
    const snapshot = await getDocs(query(collection(db, "purchase_orders"), where("id", "==", poId)));
    if (!snapshot.empty) {
      const po = snapshot.docs[0].data() as PurchaseOrder;
      const batch = writeBatch(db);
      batch.update(docRef, { status: newStatus });

      for (const item of po.items) {
        const productRef = doc(db, "products", String(item.product_id));
        batch.update(productRef, { stock: increment(item.quantity) });

        // Log stock movement
        const movementId = Date.now() + Math.floor(Math.random() * 1000);
        const movementRef = doc(db, "stock_movements", String(movementId));
        batch.set(movementRef, cleanData({
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
        }));
      }
      await batch.commit();
      return;
    }
  }

  await updateDoc(docRef, { status: newStatus });
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
  await setDoc(doc(db, "audit_logs", String(id)), cleanData(auditData));
}

export async function getAuditLogs(): Promise<import('@/types').AuditLog[]> {
  const colRef = collection(db, "audit_logs");
  const snapshot = await getDocs(query(colRef, orderBy("created_at", "desc")));
  if (snapshot.empty) {
    // Seed from mock data
    const { MOCK_AUDIT_LOGS } = await import('./mock-data');
    const batch = writeBatch(db);
    MOCK_AUDIT_LOGS.forEach(log => {
      batch.set(doc(db, "audit_logs", String(log.id)), cleanData(log));
    });
    await batch.commit();
    return MOCK_AUDIT_LOGS;
  }
  return snapshot.docs.map(d => d.data() as import('@/types').AuditLog);
}

// ─── Backup & Restore (A1) ───
export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const collections = ['products', 'categories', 'customers', 'users', 'suppliers',
    'discounts', 'tax_configs', 'transactions', 'shifts', 'stock_movements',
    'audit_logs', 'branches', 'purchase_orders', 'loyalty_transactions'];

  const result: Record<string, unknown[]> = {};
  for (const colName of collections) {
    try {
      const snapshot = await getDocs(collection(db, colName));
      result[colName] = snapshot.docs.map(d => d.data());
    } catch { result[colName] = []; }
  }
  return result;
}

export async function importData(data: Record<string, unknown[]>): Promise<number> {
  let count = 0;
  for (const [colName, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    const batch = writeBatch(db);
    items.forEach((item: any) => {
      const docId = String(item.id || Date.now() + Math.random());
      batch.set(doc(db, colName, docId), cleanData(item));
      count++;
    });
    await batch.commit();
  }
  return count;
}

// ─── Ingredients CRUD ───
export async function getIngredients(): Promise<Ingredient[]> {
  const colRef = collection(db, "ingredients");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => d.data() as Ingredient);
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
  await setDoc(doc(db, "ingredients", String(id)), cleanData(newIngredient));
  return newIngredient;
}

export async function updateIngredient(id: number, data: Partial<Ingredient>): Promise<void> {
  const docRef = doc(db, "ingredients", String(id));
  const clean = cleanData({
    ...data,
    updated_at: new Date().toISOString()
  });
  await updateDoc(docRef, clean);
}

export async function deleteIngredient(id: number): Promise<void> {
  const docRef = doc(db, "ingredients", String(id));
  await deleteDoc(docRef);
}

export async function stockInIngredient(id: number, quantity: number, unitCost: number, reference?: string): Promise<void> {
  const docRef = doc(db, "ingredients", String(id));
  const snapshot = await getDocs(query(collection(db, "ingredients"), where("id", "==", id)));
  if (snapshot.empty) throw new Error("Bahan baku tidak ditemukan");

  const ingredient = snapshot.docs[0].data() as Ingredient;
  const oldStock = ingredient.stock || 0;
  const oldAvg = ingredient.avg_cost_price || ingredient.cost_price || 0;
  const totalStock = oldStock + quantity;
  const newAvg = totalStock > 0 ? (oldStock * oldAvg + quantity * unitCost) / totalStock : oldAvg;

  await updateDoc(docRef, {
    stock: totalStock,
    avg_cost_price: newAvg,
    cost_price: unitCost,
    updated_at: new Date().toISOString()
  });

  // Log stock movement for ingredient
  const movementRef = collection(db, "stock_movements");
  const movementId = Date.now();
  await setDoc(doc(db, "stock_movements", String(movementId)), cleanData({
    id: movementId,
    product_id: id,
    product_name: `[Bahan] ${ingredient.name}`,
    type: 'in',
    quantity: quantity,
    reference: reference || `STK-IN-${movementId}`,
    reason: 'Penerimaan Bahan Baku',
    user_name: 'Admin', // default
    branch_name: 'Toko Pusat',
    created_at: new Date().toISOString()
  }));
}

// ─── Waste Logs CRUD ───
export async function getWasteLogs(): Promise<WasteLog[]> {
  const colRef = collection(db, "waste_logs");
  const snapshot = await getDocs(query(colRef, orderBy("logged_at", "desc")));
  return snapshot.docs.map(d => d.data() as WasteLog);
}

export async function recordWasteAndDeductStock(
  payload: CreateWasteLogPayload,
  userName: string
): Promise<WasteLog> {
  const id = Date.now();
  const batch = writeBatch(db);

  let totalLossAmount = 0;
  const itemsWithDetails: WasteLogItem[] = [];

  for (let idx = 0; idx < payload.items.length; idx++) {
    const item = payload.items[idx];
    const itemId = id + idx + 1;

    let itemName = '';
    let unit = 'pcs';
    let costAtTime = 0;

    if (item.wasted_type === 'ingredient') {
      const ingDocRef = doc(db, "ingredients", String(item.wasted_id));
      const ingSnapshot = await getDocs(query(collection(db, "ingredients"), where("id", "==", item.wasted_id)));
      if (ingSnapshot.empty) throw new Error(`Bahan baku ID ${item.wasted_id} tidak ditemukan`);
      const ing = ingSnapshot.docs[0].data() as Ingredient;
      
      itemName = ing.name;
      unit = ing.unit;
      costAtTime = ing.avg_cost_price || ing.cost_price || 0;

      // Deduct stock of ingredient
      batch.update(ingDocRef, {
        stock: increment(-item.quantity),
        updated_at: new Date().toISOString()
      });

      // Log stock movement
      const movementId = Date.now() + idx + 1000;
      batch.set(doc(db, "stock_movements", String(movementId)), cleanData({
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
      }));
    } else {
      // Product
      const prodDocRef = doc(db, "products", String(item.wasted_id));
      const prodSnapshot = await getDocs(query(collection(db, "products"), where("id", "==", item.wasted_id)));
      if (prodSnapshot.empty) throw new Error(`Produk ID ${item.wasted_id} tidak ditemukan`);
      const prod = prodSnapshot.docs[0].data() as Product;

      itemName = prod.name;
      unit = prod.unit || 'pcs';
      costAtTime = prod.cost_price || 0;

      // Deduct stock of product
      batch.update(prodDocRef, {
        stock: increment(-item.quantity)
      });

      // Log stock movement
      const movementId = Date.now() + idx + 2000;
      batch.set(doc(db, "stock_movements", String(movementId)), cleanData({
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
      }));
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
    user_id: 1, // default admin
    user_name: userName,
    total_loss_amount: totalLossAmount,
    logged_at: payload.logged_at,
    notes: payload.notes || null,
    items: itemsWithDetails,
    created_at: new Date().toISOString()
  };

  batch.set(doc(db, "waste_logs", String(id)), cleanData(newWasteLog));

  // Log Audit Trail
  const auditId = Date.now() + 500;
  batch.set(doc(db, "audit_logs", String(auditId)), cleanData({
    id: auditId,
    user_id: 1,
    user_name: userName,
    action: "create_waste_log",
    module: "waste_logs",
    description: `Mencatat log limbah dengan total kerugian Rp ${totalLossAmount.toLocaleString('id-ID')}`,
    old_value: null,
    new_value: String(totalLossAmount),
    created_at: new Date().toISOString()
  }));

  await batch.commit();
  return newWasteLog;
}

export async function getWasteAnalytics(): Promise<WasteAnalytics> {
  const logs = await getWasteLogs();
  
  let totalLoss = 0;
  const reasonMap: Record<string, { count: number; cost: number }> = {};
  const itemMap: Record<string, { name: string; type: string; qty: number; cost: number }> = {};

  logs.forEach(log => {
    totalLoss += log.total_loss_amount;
    log.items?.forEach(item => {
      // Reason stats
      const r = item.reason;
      if (!reasonMap[r]) reasonMap[r] = { count: 0, cost: 0 };
      reasonMap[r].count += 1;
      reasonMap[r].cost += item.total_cost;

      // Item stats
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
      itemMap[key].cost += item.total_cost;
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
  const colRef = collection(db, "ingredient_usage_logs");
  const snapshot = await getDocs(query(colRef, orderBy("created_at", "desc")));
  return snapshot.docs.map(d => d.data());
}

