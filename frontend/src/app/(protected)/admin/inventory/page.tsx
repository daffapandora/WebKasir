'use client';

import { useState, useEffect } from 'react';
import { getProducts, getStockMovements, adjustStock, getCategories } from '@/lib/firebase-service';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { Warehouse, Search, ArrowUpDown, AlertTriangle, Package, TrendingDown, ArrowDown, ArrowUp, X, Loader2 } from 'lucide-react';
import type { Product, StockMovement, Category } from '@/types';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Stock adjustment modal states
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<number | ''>('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustQty, setAdjustQty] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, moves, cats] = await Promise.all([
        getProducts(),
        getStockMovements(),
        getCategories()
      ]);
      setProducts(prods);
      setMovements(moves);
      setCategories(cats);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat data inventaris');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId || !adjustType || adjustQty === '' || !adjustReason) {
      addToast('warning', 'Harap isi semua kolom penyesuaian');
      return;
    }

    try {
      setAdjusting(true);
      const prod = products.find(p => p.id === Number(adjustProductId));
      if (!prod) return;

      const userName = user?.name || 'Kasir';
      const branchName = user?.branch_name || 'Toko Pusat';

      await adjustStock(
        prod.id,
        Number(adjustQty),
        adjustType,
        adjustReason,
        userName,
        branchName
      );

      addToast('success', 'Stok berhasil disesuaikan!');
      setShowAdjust(false);
      
      // Reset form
      setAdjustProductId('');
      setAdjustQty('');
      setAdjustReason('');
      
      // Reload inventory & movements list
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menyesuaikan stok produk');
    } finally {
      setAdjusting(false);
    }
  };

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.min_stock);
  const outOfStock = products.filter(p => p.stock <= 0);

  const filtered = products.filter(p => {
    if (filter === 'low' && !(p.stock > 0 && p.stock <= p.min_stock)) return false;
    if (filter === 'out' && p.stock > 0) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Inventaris</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Kelola stok dan pergerakan barang</p>
        </div>
        <button onClick={() => setShowAdjust(true)} className="btn btn-primary">
          <ArrowUpDown className="w-4 h-4" /> Penyesuaian Stok
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-light)' }}>
            <Package className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{products.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Total Produk</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 cursor-pointer" onClick={() => setFilter('low')}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-warning-light)' }}>
            <TrendingDown className="w-6 h-6" style={{ color: 'var(--color-warning)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-warning)' }}>{lowStock.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Stok Menipis</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 cursor-pointer" onClick={() => setFilter('out')}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-danger-light)' }}>
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--color-danger)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-danger)' }}>{outOfStock.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Stok Habis</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..." className="input pl-10" />
        </div>
        <div className="flex gap-1">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'low', label: 'Menipis' },
            { key: 'out', label: 'Habis' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as typeof filter)} className={cn('btn btn-sm', filter === f.key ? 'btn-primary' : 'btn-outline')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Memuat data stok...</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)' }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Produk</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Kategori</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Stok Saat Ini</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Min. Stok</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Nilai Stok</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Batch/Exp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => {
                  const isLow = product.stock > 0 && product.stock <= product.min_stock;
                  const isOut = product.stock <= 0;
                  const stockValue = product.stock * product.cost_price;

                  return (
                    <tr key={product.id} className="border-b hover:bg-[var(--color-bg-elevated)] transition-colors" style={{ borderColor: 'var(--color-border-light)' }}>
                      <td className="py-3 px-4">
                        <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                        <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{product.sku}</p>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--color-text-secondary)' }}>{product.category_name}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums" style={{ color: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                        {product.stock} {product.unit}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{product.min_stock}</td>
                      <td className="py-3 px-4 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(stockValue)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn('badge', isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success')}>
                          {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {product.has_batch && product.batches?.[0] ? product.batches[0].expiry_date : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Movements */}
      {!loading && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Pergerakan Stok Terbaru</h3>
          <div className="space-y-3">
            {movements.map(mov => (
              <div key={mov.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', mov.type === 'in' ? 'bg-green-50' : 'bg-red-50')}>
                  {mov.type === 'in' ? <ArrowDown className="w-4 h-4 text-green-600" /> : <ArrowUp className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{mov.product_name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {mov.type === 'in' ? 'Masuk' : mov.type === 'out' ? 'Keluar' : 'Penyesuaian'} • {mov.reference} • {mov.user_name}
                  </p>
                  {mov.reason && <p className="text-[11px] italic" style={{ color: 'var(--color-text-muted)' }}>Alasan: {mov.reason}</p>}
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-bold tabular-nums', mov.type === 'in' ? 'text-green-600' : 'text-red-500')}>
                    {mov.type === 'in' ? '+' : '-'}{mov.quantity}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{formatDateTime(mov.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjust && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-content card w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                Penyesuaian Stok Manual
              </h3>
              <button onClick={() => setShowAdjust(false)} className="btn btn-ghost btn-icon btn-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Pilih Produk *</label>
                <select
                  value={adjustProductId}
                  onChange={e => setAdjustProductId(e.target.value ? Number(e.target.value) : '')}
                  className="input"
                  required
                >
                  <option value="">Pilih Produk...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock} {p.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Jenis Penyesuaian *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'add', label: 'Tambah (+)' },
                    { type: 'subtract', label: 'Kurang (-)' },
                    { type: 'set', label: 'Atur Baru (=)' }
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setAdjustType(item.type as any)}
                      className={cn('btn btn-sm', adjustType === item.type ? 'btn-primary' : 'btn-outline')}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Jumlah Stok *</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value ? Number(e.target.value) : '')}
                  className="input"
                  placeholder="Jumlah..."
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Alasan Penyesuaian *</label>
                <textarea
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Contoh: Stok opname berkala, barang rusak, restok supplier..."
                  required
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-border-light)' }}>
                <button type="button" onClick={() => setShowAdjust(false)} className="btn btn-outline" disabled={adjusting}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={adjusting}>
                  {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
