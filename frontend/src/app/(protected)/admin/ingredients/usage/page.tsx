'use client';

import { useState, useEffect } from 'react';
import {
  FlaskConical, Search, Plus, Filter, AlertTriangle,
  Package, Clock, ChevronRight, TrendingDown, Edit, Trash2,
  List, History, DollarSign, Layers, Download, FileSpreadsheet, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useIngredientStore } from '@/store/ingredient-store';
import { cn, formatCurrency } from '@/lib/utils';
import { getProducts } from '@/lib/firebase-service';
import type { Product } from '@/types';
import { DateRangePicker, type DateRange } from '@/components/shared/date-range-picker';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useUIStore } from '@/store/ui-store';

export default function IngredientUsageReportPage() {
  const { addToast } = useUIStore();
  const { ingredients, usageLogs, fetchIngredients, fetchUsageLogs, isLoading } = useIngredientStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  // Date range state: default to last 7 days
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    label: '7 Hari Terakhir'
  }));

  useEffect(() => {
    fetchIngredients();
    fetchUsageLogs();
    getProducts().then(setProducts).catch(console.error);
  }, [fetchIngredients, fetchUsageLogs]);

  // Filter logs by date range
  const filteredLogs = usageLogs.filter(log => {
    const logDate = log.created_at.split('T')[0];
    return logDate >= dateRange.from && logDate <= dateRange.to;
  });

  // Calculate statistics per ingredient
  const reportData = ingredients.map(ing => {
    const logsForIng = filteredLogs.filter(l => l.ingredient_id === ing.id);
    const totalUsed = logsForIng.reduce((sum, l) => sum + (l.quantity_used || 0), 0);
    
    // Unique menu names using this ingredient
    const menuIds = Array.from(new Set(logsForIng.map(l => l.product_id)));
    const menuNames = menuIds
      .map(id => products.find(p => p.id === id)?.name)
      .filter(Boolean) as string[];

    const avgCost = ing.avg_cost_price || ing.cost_price || 0;
    const estimatedCost = totalUsed * avgCost;

    const initialStockEstimate = ing.stock + totalUsed;
    const usePercent = initialStockEstimate > 0 ? (totalUsed / initialStockEstimate * 100) : 0;

    return {
      id: ing.id,
      name: ing.name,
      sku: ing.sku || '—',
      unit: ing.unit,
      totalUsed,
      menuNames,
      usePercent,
      estimatedCost,
      avgCost
    };
  }).filter(row => search === '' || row.name.toLowerCase().includes(search.toLowerCase()) || row.sku.toLowerCase().includes(search.toLowerCase()));

  // Group daily consumption for chart
  const dailyDataMap: Record<string, number> = {};
  
  // Initialize map with all dates in range
  const start = new Date(dateRange.from);
  const end = new Date(dateRange.to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyDataMap[dateStr] = 0;
  }

  // Populate map with usage cost
  filteredLogs.forEach(log => {
    const dateStr = log.created_at.split('T')[0];
    const ing = ingredients.find(i => i.id === log.ingredient_id);
    const cost = ing ? (ing.avg_cost_price || ing.cost_price || 0) : 0;
    const usageCost = (log.quantity_used || 0) * cost;
    if (dailyDataMap[dateStr] !== undefined) {
      dailyDataMap[dateStr] += usageCost;
    } else {
      dailyDataMap[dateStr] = usageCost;
    }
  });

  const chartData = Object.entries(dailyDataMap).map(([date, cost]) => {
    // Format date label (e.g. "15 Jun")
    const d = new Date(date);
    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    return {
      date,
      label,
      'Biaya Penggunaan': Math.round(cost)
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Total summary cost
  const totalUsageCost = reportData.reduce((sum, r) => sum + r.estimatedCost, 0);

  // CSV Export
  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Bahan Baku,SKU,Total Digunakan,Satuan,Dari Menu,Persentase dari Stok Awal,Estimasi Biaya (Rp)\n";
    
    reportData.forEach(r => {
      const menusStr = r.menuNames.join('; ');
      csvContent += `"${r.name}","${r.sku}",${r.totalUsed},"${r.unit}","${menusStr}",${r.usePercent.toFixed(1)}%,${Math.round(r.estimatedCost)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-penggunaan-bahan-${dateRange.from}-to-${dateRange.to}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Laporan CSV berhasil diunduh');
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
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <Link href="/admin/ingredients" className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
          Daftar Bahan Baku
        </Link>
        <Link href="/admin/ingredients/usage" className="px-4 py-2.5 text-sm font-semibold border-b-2 border-[var(--color-accent)]" style={{ color: 'var(--color-accent)' }}>
          Laporan Penggunaan
        </Link>
      </div>

      {/* ── Filters & Export ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Cari bahan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
        <button
          onClick={handleExportCSV}
          className="btn btn-outline btn-sm gap-2"
          disabled={reportData.length === 0}
        >
          <Download className="w-4 h-4" />
          Ekspor CSV
        </button>
      </div>

      {/* ── Chart ── */}
      {filteredLogs.length > 0 ? (
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Nilai Konsumsi Bahan Baku Harian</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400">
              Total Pengeluaran Bahan: Rp {Math.round(totalUsageCost).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-text-muted)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--color-text-muted)" tickFormatter={v => `Rp ${v.toLocaleString('id-ID')}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(v: any) => [formatCurrency(Number(v)), 'Biaya']}
                />
                <Bar dataKey="Biaya Penggunaan" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Tidak ada data konsumsi bahan baku pada periode ini.
        </div>
      )}

      {/* ── Usage Table ── */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              {['Bahan Baku', 'Total Digunakan', 'Satuan', 'Dari Menu Apa Saja', 'Porsi dari Stok Awal', 'Estimasi Biaya'].map((h, idx) => (
                <th key={h} className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left",
                  idx === 5 ? "text-right" : "text-left"
                )}
                  style={{ color: 'var(--color-text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3">
                  <div className="h-8 rounded animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
                </td></tr>
              ))
            ) : reportData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Tidak ada data penggunaan bahan baku.
                </td>
              </tr>
            ) : (
              reportData.map(row => (
                <tr key={row.id} className="hover:bg-[var(--color-bg-elevated)] transition-colors">
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    <div>
                      <span>{row.name}</span>
                      <span className="block text-[10px] text-gray-500 font-mono mt-0.5">{row.sku}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {row.totalUsed.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.menuNames.length === 0 ? (
                        <span className="text-xs text-gray-500">—</span>
                      ) : (
                        row.menuNames.map(name => (
                          <span key={name} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                            🍜 {name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums text-gray-500">
                    {row.usePercent.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400">
                    Rp {Math.round(row.estimatedCost).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
