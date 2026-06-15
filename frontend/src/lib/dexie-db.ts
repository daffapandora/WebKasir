import Dexie, { type Table } from 'dexie';

export interface OfflineTransaction {
  id?: number;
  uuid: string;
  invoice_number: string;
  payload: {
    customerId: number | null;
    customerName: string | null;
    items: Array<{
      product_id: number;
      quantity: number;
      price: number;
      discount_amount: number;
      subtotal: number;
      product_name?: string;
      sku?: string;
    }>;
    payments: Array<{
      method: string;
      amount: number;
      reference?: string | null;
    }>;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    serviceCharge: number;
    total: number;
    change: number;
    notes?: string | null;
    shift_id?: number;
  };
  completed_at_client: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error_message?: string;
  sync_attempts: number;
}

export class TokoPosDexieDB extends Dexie {
  transactionsQueue!: Table<OfflineTransaction>;

  constructor() {
    super('TokoPosOfflineDB');
    this.version(1).stores({
      transactionsQueue: '++id, &uuid, invoice_number, status, completed_at_client',
    });
  }
}

export const db = new TokoPosDexieDB();
