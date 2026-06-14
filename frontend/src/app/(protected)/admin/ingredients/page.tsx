'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, Search, Plus, Filter, AlertTriangle,
  Package, Clock, ChevronRight, TrendingDown, Edit, Trash2,
  List, History, DollarSign, Layers
} from 'lucide-react';
import Link from 'next/link';
import { useIngredientStore } from '@/store/ingredient-store';
import { IngredientFormModal } from './IngredientFormModal';
import { StockInModal } from './StockInModal';
import { cn, formatCurrency } from '@/lib/utils';
import type { Ingredient } from '@/types/ingredient';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { EmptyState } from '@/components/shared/empty-state';
import { getProducts } from '@/lib/firebase-service';
import type { Product } from '@/types';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  const ratio = minStock > 0 ? stock / minStock : 1;
  const level = ratio <= 0 ? 'critical' : ratio <= 0.5 ? 'low' : ratio <= 1 ? 'warning' : 'ok';

  const styles = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    low:      'bg-orange-500/15 text-orange-400 border-orange-500/30',
    warning:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    ok:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium', styles[level])}>
      {level === 'critical' && <AlertTriangle className="w-3 h-3" />}
      {stock.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
    </span>
  );
}

function ExpiryBadge({ date }: { date?: string | null }) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
  if (diff > 30) return null;

  const cls = diff <= 0
    ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : diff <= 7
      ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
      : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';

  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border', cls)}>
      <Clock className="w-2.5 h-2.5" />
      {diff <= 0 ? 'Kadaluarsa' : `${diff}h`}
    </span>
  );
}

interface RowProps {
  ingredient: Ingredient;
  products: Product[];
  onEdit: (i: Ingredient) => void;
  onStockIn: (i: Ingredient) => void;
  onDelete: (i: Ingredient) => void;
}

function IngredientRow({
  ingredient,
  products,
  onEdit,
  onStockIn,
  onDelete,
}: RowProps) {
  const isLow = ingredient.stock <= ingredient.min_stock;

  // Cari menu/produk yang menggunakan bahan baku ini
  const usedMenus = products.filter(p =>
    p.use_recipe && Array.isArray(p.ingredients) && p.ingredients.some(ri => ri.ingredient_id === ingredient.id)
  );

  return (
    <tr
      className={cn(
        'group transition-colors hover:bg-[var(--color-bg-elevated)]',
        isLow && 'bg-red-500/5'
      )}
    >
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {ingredient.name}
          </span>
          <span className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {ingredient.sku}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StockBadge stock={ingredient.stock} minStock={ingredient.min_stock} />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {ingredient.unit}
          </span>
          <ExpiryBadge date={ingredient.expiry_date} />
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {ingredient.min_stock} {ingredient.unit}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-right font-mono" style={{ color: 'var(--color-text-secondary)' }}>
        Rp {Number(ingredient.avg_cost_price || ingredient.cost_price || 0).toLocaleString('id-ID')}
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          {ingredient.supplier?.name ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {usedMenus.length === 0 ? (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
          ) : (
            usedMenus.map(p => (
              <span key={p.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                🍜 {p.name}
              </span>
            ))
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn('badge badge-sm', ingredient.is_active ? 'badge-success' : 'badge-danger')}>
          {ingredient.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <button
            onClick={() => onStockIn(ingredient)}
            className="btn btn-ghost btn-icon btn-xs text-emerald-400"
            title="Stock In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(ingredient)}
            className="btn btn-ghost btn-icon btn-xs"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(ingredient)}
            className="btn btn-ghost btn-icon btn-xs text-red-400"
            title="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IngredientsPage() {
  const { ingredients, deleteIngredient, isLoading, fetchIngredients } = useIngredientStore();
  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch]           = useState('');
  const [filterLow, setFilterLow]     = useState(false);
  const [formModal, setFormModal]     = useState<{ open: boolean; ingredient?: Ingredient }>({ open: false });
  const [stockInTarget, setStockInTarget] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);

  // Load products to show usage links
  useEffect(() => {
    fetchIngredients();
    getProducts()
      .then(setProducts)
      .catch(console.error);
  }, [fetchIngredients]);

  const filtered = ingredients.filter((ing: Ingredient) => {
    const matchSearch = ing.name.toLowerCase().includes(search.toLowerCase())
      || (ing.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchLow    = !filterLow || ing.stock <= ing.min_stock;
    return matchSearch && matchLow;
  });

  const lowCount = ingredients.filter((i: Ingredient) => i.stock <= i.min_stock).length;
  const totalValue = ingredients.reduce((sum, ing) => sum + (ing.stock * (ing.avg_cost_price || ing.cost_price || 0)), 0);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteIngredient(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Bahan Baku</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Kelola inventaris bahan dasar dan komposisi produk (BOM)
            </p>
          </div>
        </div>
        <button
          onClick={() => setFormModal({ open: true })}
          className="btn btn-primary btn-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Bahan Baku
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total Bahan Baku</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{ingredients.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Stok Kritis (Reorder)</p>
            <p className="text-2xl font-bold text-orange-400">{lowCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Nilai Total Inventaris</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">{formatCurrency(totalValue)}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <Link href="/admin/ingredients" className="px-4 py-2.5 text-sm font-semibold border-b-2 border-[var(--color-accent)]" style={{ color: 'var(--color-accent)' }}>
          Daftar Bahan Baku
        </Link>
        <Link href="/admin/ingredients/usage" className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
          Laporan Penggunaan
        </Link>
      </div>

      {/* ── Onboarding / Empty State ── */}
      {!isLoading && ingredients.length === 0 ? (
        <EmptyState
          title="Bahan Baku Kosong"
          description="Mulai dengan menambahkan bahan baku pertama Anda untuk memantau penggunaan bahan dan HPP secara akurat."
          actionLabel="Tambah Bahan Baku Pertama"
          onAction={() => setFormModal({ open: true })}
        />
      ) : (
        <>
          {/* ── Low Stock Alert Banner ── */}
          {lowCount > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ background: 'rgb(239 68 68 / 0.08)', borderColor: 'rgb(239 68 68 / 0.25)' }}>
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">
                <strong>{lowCount} bahan baku</strong> di bawah stok minimum.{' '}
                <button
                  onClick={() => setFilterLow(true)}
                  className="underline underline-offset-2 hover:no-underline"
                >
                  Lihat sekarang
                </button>
              </p>
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Cari nama atau SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 w-full"
              />
            </div>
            <button
              onClick={() => setFilterLow(v => !v)}
              className={cn('btn btn-sm gap-2', filterLow ? 'btn-danger' : 'btn-ghost')}
            >
              <Filter className="w-3.5 h-3.5" />
              Stok Rendah
              {filterLow && lowCount > 0 && (
                <span className="badge badge-sm badge-danger">{lowCount}</span>
              )}
            </button>
          </div>

          {/* ── Table ── */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                  {['Nama Bahan Baku', 'Stok Saat Ini', 'Min. Stok', 'Harga Avg', 'Supplier', 'Digunakan di Menu', 'Status', ''].map((h, idx) => (
                    <th key={h} className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wider",
                      idx === 3 ? "text-right" : "text-left"
                    )}
                      style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-4 py-3">
                      <div className="h-8 rounded animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
                    </td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <Package className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Tidak ditemukan
                    </p>
                  </td></tr>
                ) : (
                  filtered.map((ing: Ingredient) => (
                    <IngredientRow
                      key={ing.id}
                      ingredient={ing}
                      products={products}
                      onEdit={(i: Ingredient) => setFormModal({ open: true, ingredient: i })}
                      onStockIn={(i: Ingredient) => setStockInTarget(i)}
                      onDelete={(i: Ingredient) => setDeleteTarget(i)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {formModal.open && (
        <IngredientFormModal
          ingredient={formModal.ingredient}
          onClose={() => setFormModal({ open: false })}
        />
      )}
      {stockInTarget && (
        <StockInModal
          ingredient={stockInTarget}
          onClose={() => setStockInTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Arsipkan Bahan Baku"
          message={`Apakah Anda yakin ingin mengarsipkan "${deleteTarget.name}"? Tindakan ini dapat diurungkan nanti.`}
          confirmLabel="Arsipkan"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
