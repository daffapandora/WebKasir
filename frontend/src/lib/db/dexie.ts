// ============================================
// KasirPro — IndexedDB Schema (Dexie.js)
// Offline-first database for POS transactions
// ============================================

import Dexie, { type Table } from 'dexie';
import type {
  OfflineTransaction,
  Product,
  Customer,
  Category,
  Shift,
} from '../types';

// ---- Sync Queue Item ----
export interface SyncQueueItem {
  id?: number;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  error?: string;
  retryCount: number;
  createdAt: string;
}

// ---- App Settings ----
export interface AppSetting {
  key: string;
  value: string;
}

// ---- KasirPro Database ----
class KasirProDB extends Dexie {
  transactions!: Table<OfflineTransaction, string>;
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  customers!: Table<Customer, string>;
  shifts!: Table<Shift, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('kasirpro');

    this.version(1).stores({
      // Primary key + indexed fields
      transactions: 'clientUuid, syncStatus, createdAt, shiftId, outletId, invoiceNumber',
      products: 'id, sku, barcode, name, categoryId, isActive',
      categories: 'id, slug, sortOrder, isActive',
      customers: 'id, phone, name, tenantId',
      shifts: 'id, outletId, userId, status, openedAt',
      syncQueue: '++id, entityType, status, createdAt',
      settings: 'key',
    });
  }
}

export const db = new KasirProDB();

// ---- Helper Functions ----

/** Get current open shift */
export async function getCurrentShift(outletId: string): Promise<Shift | undefined> {
  return db.shifts
    .where({ outletId, status: 'open' })
    .first();
}

/** Search products by name, SKU, or barcode */
export async function searchProducts(query: string, categoryId?: string): Promise<Product[]> {
  let products = db.products.where('isActive').equals(1);

  const results = await products.toArray();

  let filtered = results.filter(p => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.variants?.some(v =>
        v.sku.toLowerCase().includes(q) ||
        v.barcode?.toLowerCase().includes(q)
      )
    );
  });

  if (categoryId) {
    filtered = filtered.filter(p => p.categoryId === categoryId);
  }

  return filtered;
}

/** Find product by barcode (checks product and variant barcodes) */
export async function findByBarcode(barcode: string): Promise<{ product: Product; variantId: string } | null> {
  const products = await db.products.where('isActive').equals(1).toArray();

  for (const product of products) {
    if (product.barcode === barcode) {
      const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
      if (defaultVariant) {
        return { product, variantId: defaultVariant.id };
      }
    }

    const matchingVariant = product.variants?.find(v => v.barcode === barcode);
    if (matchingVariant) {
      return { product, variantId: matchingVariant.id };
    }
  }

  return null;
}

/** Get pending transaction count */
export async function getPendingSyncCount(): Promise<number> {
  return db.transactions
    .where('syncStatus')
    .anyOf(['pending', 'error'])
    .count();
}

/** Get all pending transactions for sync */
export async function getPendingTransactions(): Promise<OfflineTransaction[]> {
  return db.transactions
    .where('syncStatus')
    .equals('pending')
    .toArray();
}

/** Generate local invoice number (temporary until synced) */
export function generateLocalInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LOC-${date}-${time}-${rand}`;
}

/** Save or get app setting */
export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.get(key);
  return setting?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}

export default db;
