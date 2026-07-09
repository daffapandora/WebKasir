'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDateTime, getStatusColor, getPaymentLabel, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { ArrowLeft, Search, Receipt, Eye, Printer, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { Transaction } from '@/types';

export default function POSHistoryPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<{ success: boolean; data: Transaction[] }>('/pos/transactions/history')
      .then(res => {
        if (res.success) {
          setTransactions(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const myTransactions = transactions.filter(t => {
    if (search) {
      const q = search.toLowerCase();
      return t.invoice_number.toLowerCase().includes(q) || (t.customer_name?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
        <Link href="/pos" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Riwayat Transaksi</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {user?.name} — {loading ? 'Memuat...' : `${myTransactions.length} transaksi`}
          </p>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari invoice..." className="input pl-10" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Memuat riwayat transaksi...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTransactions.map(txn => (
              <div key={txn.id} className="card p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    <span className="font-mono text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{txn.invoice_number}</span>
                  </div>
                  <span className={cn('badge', getStatusColor(txn.status))}>{txn.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {txn.customer_name || 'Pelanggan Umum'} • {txn.items?.length || 0} item
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDateTime(txn.created_at)} • {txn.payments && getPaymentLabel(txn.payments[0]?.method)}
                    </p>
                  </div>
                  <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>{formatCurrency(txn.total)}</p>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                  <button className="btn btn-outline btn-sm flex-1"><Eye className="w-3.5 h-3.5" /> Detail</button>
                  <button className="btn btn-outline btn-sm flex-1"><Printer className="w-3.5 h-3.5" /> Cetak</button>
                </div>
              </div>
            ))}
            {myTransactions.length === 0 && (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Belum ada transaksi.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
