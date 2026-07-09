'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatCompact, cn } from '@/lib/utils';
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, FileSpreadsheet, Printer, Loader2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { DateRangePicker, type DateRange } from '@/components/shared/date-range-picker';
import { useUIStore } from '@/store/ui-store';
import { apiClient } from '@/lib/api-client';

interface SalesSummary {
  period: string;
  gross_sales: number;
  total_discounts: number;
  net_sales: number;
  cogs: number;
  gross_profit: number;
}

interface TopProduct {
  product_id: number;
  product_name: string;
  category: string;
  quantity_sold: number;
  revenue: number;
  profit: number;
}

interface HourlySales {
  hour: number;
  label: string;
  transaction_count: number;
  total: number;
}

export default function ReportsPage() {
  const { addToast } = useUIStore();
  const [tab, setTab] = useState<'summary' | 'products' | 'hourly'>('summary');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Date range picker state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    to: new Date().toISOString().split('T')[0], // today
    label: '7 Hari Terakhir'
  });

  // Report States
  const [salesSummary, setSalesSummary] = useState<SalesSummary[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const [summaryRes, topRes, hourlyRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: SalesSummary[] }>(`/reports/sales-summary?days=${days}`),
        apiClient.get<{ success: boolean; data: TopProduct[] }>('/reports/top-products'),
        apiClient.get<{ success: boolean; data: HourlySales[] }>('/reports/hourly-sales')
      ]);

      if (summaryRes.data.success) {
        setSalesSummary(summaryRes.data.data);
      }
      if (topRes.data.success) {
        setTopProducts(topRes.data.data);
      }
      if (hourlyRes.data.success) {
        setHourlySales(hourlyRes.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const totalGross = salesSummary.reduce((s, d) => s + d.gross_sales, 0);
  const totalDiscount = salesSummary.reduce((s, d) => s + d.total_discounts, 0);
  const totalNet = salesSummary.reduce((s, d) => s + d.net_sales, 0);
  const totalCogs = salesSummary.reduce((s, d) => s + d.cogs, 0);
  const totalProfit = salesSummary.reduce((s, d) => s + d.gross_profit, 0);
  const totalTxn = salesSummary.length; // Approximate from periods or backend
  const avgOrder = totalTxn > 0 ? Math.round(totalNet / totalTxn) : 0;

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    let filename = "";
    
    if (tab === 'summary') {
      filename = `laporan-harian-${dateRange.from}-to-${dateRange.to}.csv`;
      csvContent += "Tanggal,Penjualan Kotor,Diskon,Penjualan Bersih,HPP,Laba Kotor\n";
      salesSummary.forEach(s => {
        csvContent += `${s.period},${s.gross_sales},${s.total_discounts},${s.net_sales},${s.cogs},${s.gross_profit}\n`;
      });
    } else if (tab === 'products') {
      filename = `laporan-produk-terlaris.csv`;
      csvContent += "Rank,Produk,Kategori,Qty Terjual,Pendapatan,Profit\n";
      topProducts.forEach((p, i) => {
        csvContent += `${i+1},"${p.product_name}","${p.category}",${p.quantity_sold},${p.revenue},${p.profit}\n`;
      });
    } else {
      filename = `laporan-penjualan-jam.csv`;
      csvContent += "Jam,Total Penjualan\n";
      hourlySales.forEach(s => {
        csvContent += `"${s.label}",${s.total}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
    addToast('success', 'Laporan CSV berhasil diunduh');
  };

  // Export PDF/Print
  const handlePrintPDF = () => {
    setShowExportDropdown(false);
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:flex-col print:items-start print:gap-1">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Laporan Keuangan</h1>
          <p className="text-sm print:text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Periode: {dateRange.label || `${dateRange.from} – ${dateRange.to}`}
          </p>
        </div>
        
        <div className="flex items-center gap-2 print:hidden relative">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          
          <button 
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="btn btn-outline gap-2"
            disabled={loading}
          >
            <Download className="w-4 h-4" /> 
            Export
          </button>

          {showExportDropdown && (
            <div 
              className="absolute right-0 top-full mt-2 w-48 card p-1.5 shadow-xl z-50 animate-fade-in"
              style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)' }}
            >
              <button 
                onClick={handleExportCSV} 
                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-[var(--color-bg-elevated)] rounded-lg flex items-center gap-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Export ke CSV
              </button>
              <button 
                onClick={handlePrintPDF} 
                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-[var(--color-bg-elevated)] rounded-lg flex items-center gap-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Printer className="w-4 h-4 text-blue-500" />
                Cetak ke PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card p-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Memuat data laporan keuangan...</p>
        </div>
      ) : (
        <>
          {/* P&L Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-3 print:gap-2">
            {[
              { label: 'Penjualan Kotor', value: totalGross, color: 'var(--color-text-primary)' },
              { label: 'Total Diskon', value: totalDiscount, color: 'var(--color-danger)' },
              { label: 'Penjualan Bersih', value: totalNet, color: 'var(--color-accent)' },
              { label: 'HPP / COGS', value: totalCogs, color: 'var(--color-warning)' },
              { label: 'Laba Kotor', value: totalProfit, color: 'var(--color-success)' },
              { label: 'Rata-rata Order', value: avgOrder, color: 'var(--color-info)' },
            ].map((kpi, i) => (
              <div key={i} className="card p-4 print:p-2.5 print:border print:shadow-none">
                <p className="text-xs mb-1 print:text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{kpi.label}</p>
                <p className="text-lg font-bold tabular-nums print:text-sm" style={{ color: kpi.color }}>{formatCurrency(kpi.value)}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b print:hidden" style={{ borderColor: 'var(--color-border-light)' }}>
            {[
              { key: 'summary', label: 'Ringkasan Harian' },
              { key: 'products', label: 'Produk Terlaris' },
              { key: 'hourly', label: 'Per Jam' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px', tab === t.key ? 'border-[var(--color-accent)]' : 'border-transparent')}
                style={{ color: tab === t.key ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'summary' && (
            <div className="space-y-4 print:space-y-2">
              <div className="card p-5 print:hidden">
                <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Tren Penjualan & Profit</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesSummary.map(s => ({ date: s.period, sales: s.net_sales, profit: s.gross_profit, cogs: s.cogs }))}>
                      <defs>
                        <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.15} /><stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} /></linearGradient>
                        <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#457B9D" stopOpacity={0.15} /><stop offset="95%" stopColor="#457B9D" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" tickFormatter={v => formatCompact(v)} />
                      <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => [formatCurrency(Number(v)), '']} />
                      <Area type="monotone" dataKey="sales" stroke="#2D6A4F" fill="url(#gradSales)" strokeWidth={2} name="Net Sales" />
                      <Area type="monotone" dataKey="profit" stroke="#457B9D" fill="url(#gradProfit)" strokeWidth={2} name="Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card overflow-hidden print:border print:shadow-none">
                <table className="w-full text-sm print:text-xs">
                  <thead>
                    <tr style={{ background: 'var(--color-bg-elevated)' }}>
                      <th className="text-left py-3 px-4 font-semibold print:py-2" style={{ color: 'var(--color-text-secondary)' }}>Tanggal</th>
                      <th className="text-right py-3 px-4 font-semibold print:py-2" style={{ color: 'var(--color-text-secondary)' }}>Penjualan</th>
                      <th className="text-right py-3 px-4 font-semibold print:py-2" style={{ color: 'var(--color-text-secondary)' }}>Diskon</th>
                      <th className="text-right py-3 px-4 font-semibold print:py-2" style={{ color: 'var(--color-text-secondary)' }}>Bersih</th>
                      <th className="text-right py-3 px-4 font-semibold print:py-2" style={{ color: 'var(--color-text-secondary)' }}>HPP</th>
                      <th className="text-right py-3 px-4 font-semibold print:py-2" style={{ color: 'var(--color-text-secondary)' }}>Laba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                    {salesSummary.map(s => (
                      <tr key={s.period} className="hover:bg-[var(--color-bg-elevated)] transition-colors">
                        <td className="py-3 px-4 font-medium print:py-2" style={{ color: 'var(--color-text-primary)' }}>{s.period}</td>
                        <td className="py-3 px-4 text-right tabular-nums print:py-2">{formatCurrency(s.gross_sales)}</td>
                        <td className="py-3 px-4 text-right tabular-nums print:py-2" style={{ color: 'var(--color-danger)' }}>-{formatCurrency(s.total_discounts)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold print:py-2" style={{ color: 'var(--color-accent)' }}>{formatCurrency(s.net_sales)}</td>
                        <td className="py-3 px-4 text-right tabular-nums print:py-2" style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(s.cogs)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold print:py-2" style={{ color: 'var(--color-success)' }}>{formatCurrency(s.gross_profit)}</td>
                      </tr>
                    ))}
                    {salesSummary.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          Belum ada transaksi pada periode ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="card overflow-hidden print:border print:shadow-none">
              <table className="w-full text-sm print:text-xs">
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)' }}>
                    <th className="text-left py-3 px-4 font-medium w-8" style={{ color: 'var(--color-text-secondary)' }}>#</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Produk</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Kategori</th>
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Qty Terjual</th>
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Pendapatan</th>
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                  {topProducts.map((p, i) => (
                    <tr key={p.product_id} className="hover:bg-[var(--color-bg-elevated)] transition-colors">
                      <td className="py-3 px-4">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i < 3 ? 'var(--color-accent)' : 'var(--color-bg-elevated)', color: i < 3 ? 'white' : 'var(--color-text-muted)' }}>{i + 1}</span>
                      </td>
                      <td className="py-3 px-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.product_name}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--color-text-secondary)' }}>{p.category}</td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold">{p.quantity_sold}</td>
                      <td className="py-3 px-4 text-right tabular-nums" style={{ color: 'var(--color-accent)' }}>{formatCurrency(p.revenue)}</td>
                      <td className="py-3 px-4 text-right tabular-nums" style={{ color: 'var(--color-success)' }}>{formatCurrency(p.profit)}</td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Belum ada penjualan produk.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'hourly' && (
            <div className="card p-5 print:border print:shadow-none">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Penjualan Per Jam (Hari Ini)</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" tickFormatter={v => formatCompact(v)} />
                    <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => [formatCurrency(Number(v)), 'Penjualan']} />
                    <Bar dataKey="total" fill="#2D6A4F" radius={[4, 4, 0, 0]} name="Penjualan" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
