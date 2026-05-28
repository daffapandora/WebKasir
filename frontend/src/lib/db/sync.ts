// ============================================
// KasirPro — Offline Sync Engine
// Handles data synchronization between IndexedDB and cloud server
// ============================================

import { db, getPendingTransactions } from './dexie';
import type { OfflineTransaction, Product, Customer, Category } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface SyncResult {
  synced: number;
  errors: number;
  details: Array<{
    clientUuid: string;
    status: 'synced' | 'error';
    serverId?: string;
    error?: string;
  }>;
}

type SyncEventType = 'sync:start' | 'sync:progress' | 'sync:complete' | 'sync:error' | 'online' | 'offline';
type SyncListener = (data: unknown) => void;

export class SyncEngine {
  private isSyncing = false;
  private listeners = new Map<SyncEventType, Set<SyncListener>>();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /** Initialize sync engine — call once on app load */
  init(): void {
    // Listen for connectivity changes
    window.addEventListener('online', () => {
      this.emit('online', null);
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      this.emit('offline', null);
    });

    // Register Background Sync (if supported)
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        (reg as unknown as { sync: { register: (tag: string) => Promise<void> } })
          .sync.register('sync-transactions').catch(() => {
            // Background sync not supported, fallback to polling
            this.startPolling();
          });
      });
    } else {
      // Fallback: poll every 30 seconds when online
      this.startPolling();
    }

    // Listen for messages from Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_TRIGGERED') {
          this.syncAll();
        }
      });
    }

    // Trigger initial sync if online
    if (navigator.onLine) {
      this.syncAll();
    }
  }

  /** Start polling fallback for browsers without Background Sync */
  private startPolling(): void {
    this.intervalId = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAll();
      }
    }, 30000);
  }

  /** Stop polling */
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Get auth token from localStorage */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('kasirpro_access_token');
  }

  /** Make authenticated API request */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw Object.assign(new Error(error.message || 'API Error'), {
        status: response.status,
        data: error,
      });
    }

    return response.json();
  }

  /** Sync all pending transactions to server */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing || !navigator.onLine) {
      return { synced: 0, errors: 0, details: [] };
    }

    this.isSyncing = true;
    this.emit('sync:start', null);

    const result: SyncResult = { synced: 0, errors: 0, details: [] };

    try {
      const pending = await getPendingTransactions();
      if (pending.length === 0) {
        this.emit('sync:complete', result);
        this.isSyncing = false;
        return result;
      }

      this.emit('sync:progress', { current: 0, total: pending.length });

      // Mark all as syncing
      for (const tx of pending) {
        await db.transactions.update(tx.clientUuid, { syncStatus: 'syncing' });
      }

      // Format payload for batch push
      const payload = pending.map(tx => ({
        client_uuid: tx.clientUuid,
        outlet_id: tx.outletId,
        user_id: tx.userId,
        shift_id: tx.shiftId,
        customer_id: tx.customerId || null,
        promo_code_id: tx.promoCode || null,
        invoice_number: tx.invoiceNumber,
        subtotal: tx.subtotal,
        discount_amount: tx.discountAmount,
        tax_amount: tx.taxAmount,
        total_amount: tx.totalAmount,
        amount_paid: tx.amountPaid,
        change_amount: tx.changeAmount,
        metadata: { cashierName: tx.cashierName },
        created_at: tx.createdAt,
        items: tx.items.map(item => ({
          variant_id: item.variantId,
          product_name: item.productName,
          variant_name: item.variantName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          cost_price: item.costPrice,
          discount_amount: item.discountAmount,
          subtotal: item.subtotal,
        })),
        payments: tx.payments.map(p => ({
          method: p.method,
          amount: p.amount,
          reference_number: p.referenceNumber || null,
        }))
      }));

      try {
        const response = await this.apiRequest<{
          success: boolean;
          data: { synced: number; errors: number; failed_uuids: { client_uuid: string; reason: string }[] };
          message: string;
        }>('/sync/transactions', {
          method: 'POST',
          body: JSON.stringify({ transactions: payload }),
        });

        const failedUuids = response.data.failed_uuids.map(f => f.client_uuid);

        for (const tx of pending) {
          if (failedUuids.includes(tx.clientUuid)) {
            const error = response.data.failed_uuids.find(f => f.client_uuid === tx.clientUuid)?.reason;
            await db.transactions.update(tx.clientUuid, {
              syncStatus: 'error',
              syncError: error,
            });
            result.errors++;
            result.details.push({ clientUuid: tx.clientUuid, status: 'error', error });
          } else {
            await db.transactions.update(tx.clientUuid, {
              syncStatus: 'synced',
              syncedAt: new Date().toISOString(),
            });
            result.synced++;
            result.details.push({ clientUuid: tx.clientUuid, status: 'synced' });
          }
        }
      } catch (error) {
        // If the whole request fails
        for (const tx of pending) {
          await db.transactions.update(tx.clientUuid, {
            syncStatus: 'error',
            syncError: (error as Error).message,
          });
        }
      }

      this.emit('sync:complete', result);
    } catch (error) {
      this.emit('sync:error', error);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /** Sync a single transaction immediately */
  async syncTransaction(tx: OfflineTransaction): Promise<void> {
    if (!navigator.onLine) return;

    try {
      await db.transactions.update(tx.clientUuid, { syncStatus: 'syncing' });

      await this.apiRequest('/sync/transactions', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [{
            client_uuid: tx.clientUuid,
            outlet_id: tx.outletId,
            user_id: tx.userId,
            shift_id: tx.shiftId,
            customer_id: tx.customerId || null,
            promo_code_id: tx.promoCode || null,
            invoice_number: tx.invoiceNumber,
            subtotal: tx.subtotal,
            discount_amount: tx.discountAmount,
            tax_amount: tx.taxAmount,
            total_amount: tx.totalAmount,
            amount_paid: tx.amountPaid,
            change_amount: tx.changeAmount,
            metadata: { cashierName: tx.cashierName },
            created_at: tx.createdAt,
            items: tx.items.map(item => ({
              variant_id: item.variantId,
              product_name: item.productName,
              variant_name: item.variantName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              cost_price: item.costPrice,
              discount_amount: item.discountAmount,
              subtotal: item.subtotal,
            })),
            payments: tx.payments.map(p => ({
              method: p.method,
              amount: p.amount,
              reference_number: p.referenceNumber || null,
            }))
          }]
        }),
      });

      await db.transactions.update(tx.clientUuid, {
        syncStatus: 'synced',
        syncedAt: new Date().toISOString(),
      });
    } catch {
      // Will be retried by syncAll
      await db.transactions.update(tx.clientUuid, { syncStatus: 'pending' });
    }
  }

  /** Pull latest master data (products, categories, customers) from server */
  async pullMasterData(): Promise<{ products: number; categories: number; customers: number }> {
    if (!navigator.onLine) return { products: 0, categories: 0, customers: 0 };

    const res = await this.apiRequest<{
      data: { products: Product[]; categories: Category[]; promos: any[] }
    }>('/sync/master-data');

    const { products, categories } = res.data;

    await db.transaction('rw', [db.products, db.categories], async () => {
      await db.products.clear();
      await db.products.bulkPut(products);
      await db.categories.clear();
      await db.categories.bulkPut(categories);
    });

    return {
      products: products.length,
      categories: categories.length,
      customers: 0,
    };
  }

  /** Check if currently online */
  get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /** Event system */
  on(event: SyncEventType, listener: SyncListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  private emit(event: SyncEventType, data: unknown): void {
    this.listeners.get(event)?.forEach(listener => listener(data));
  }
}

// Singleton instance
export const syncEngine = new SyncEngine();
