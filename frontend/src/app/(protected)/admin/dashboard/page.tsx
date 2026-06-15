'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  Users, AlertTriangle, Tag, ArrowUpRight, ArrowDownRight,
  Calendar, Filter, RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatCompact, formatPercentage, formatDateTime, getStatusColor, getPaymentLabel } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const CHART_COLORS = ['#2D6A4F', '#457B9D', '#E09F3E', '#C1292E', '#6B7280'];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  
  // KPI values state
  const [kpis, setKpis] = useState({
    today_sales: 0,
    today_transactions: 0,
    today_avg_order: 0,
    today_items_sold: 0,
    yesterday_sales: 0,
    sales_growth: 0,
    low_stock_count: 0,
    active_discounts: 0,
  });

  // Chart data states
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [hourlySales, setHourlySales] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
      
      const [
        kpisRes,
        summaryRes,
        topRes,
        paymentRes,
        hourlyRes,
        historyRes
      ] = await Promise.all([
        apiClient.get<any>('/dashboard/kpis'),
        apiClient.get<any>(`/reports/sales-summary?days=${days}`),
        apiClient.get<any>('/reports/top-products'),
        apiClient.get<any>('/reports/payment-methods'),
        apiClient.get<any>('/reports/hourly-sales'),
        apiClient.get<any>('/pos/transactions/history')
      ]);

      if (kpisRes.data && kpisRes.data.success) {
        setKpis(kpisRes.data.data);
      }
      if (summaryRes.data && summaryRes.data.success) {
        setSalesTrend(summaryRes.data.data || []);
      }
      if (topRes.data && topRes.data.success) {
        setTopProducts(topRes.data.data || []);
      }
      if (paymentRes.data && paymentRes.data.success) {
        setPaymentSummary(paymentRes.data.data || []);
      }
      if (hourlyRes.data && hourlyRes.data.success) {
        setHourlySales(hourlyRes.data.data || []);
      }
      if (historyRes.data && historyRes.data.success) {
        setRecentTransactions((historyRes.data.data || []).slice(0, 8));
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // Map backend raw dates to chart format
  const mappedSalesTrend = salesTrend.map(s => ({
    date: s.period,
    sales: s.net_sales,
    profit: s.gross_profit,
    cogs: s.cogs,
  }));

  // KPI card structure with real database values
  const kpiCards = [
    {
      label: 'Penjualan Hari Ini',
      value: kpis.today_sales,
      prevValue: kpis.yesterday_sales,
      format: 'currency',
      icon: DollarSign,
      color: 'var(--color-accent)',
    },
    {
      label: 'Transaksi Hari Ini',
      value: kpis.today_transactions,
      format: 'number',
      icon: ShoppingCart,
      color: 'var(--color-info)',
    },
    {
      label: 'Rata-rata Order',
      value: kpis.today_avg_order,
      format: 'currency',
      icon: TrendingUp,
      color: 'var(--color-success)',
    },
    {
      label: 'Stok Menipis',
      value: kpis.low_stock_count,
      format: 'number',
      icon: AlertTriangle,
      color: 'var(--color-warning)',
      alert: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-1">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded-md" />
            <div className="h-4 w-60 bg-gray-200 dark:bg-gray-800 rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-md" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-md" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-md" />
          </div>
        </div>
        
        {/* KPI Cards Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="w-12 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>

        {/* Charts Row Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card p-5 h-[340px] bg-gray-200/50 dark:bg-gray-800/20" />
          <div className="card p-5 h-[340px] bg-gray-200/50 dark:bg-gray-800/20" />
        </div>

        {/* List Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5 h-[340px] bg-gray-200/50 dark:bg-gray-800/20" />
          <div className="card p-5 h-[340px] bg-gray-200/50 dark:bg-gray-800/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ringkasan bisnis Anda hari ini</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`}
            >
              {p === '7d' ? '7 Hari' : p === '30d' ? '30 Hari' : '90 Hari'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          const growth = kpi.prevValue ? ((kpi.value - kpi.prevValue) / kpi.prevValue * 100) : null;

          return (
            <div
              key={i}
              className="card p-5 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                {growth !== null && growth !== 0 && (
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(growth).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                {kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value.toLocaleString('id-ID')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Trend */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Tren Penjualan</h3>
          <div className="h-[280px]">
            {mappedSalesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mappedSalesTrend}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" tickFormatter={v => formatCompact(v)} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#2D6A4F" fill="url(#colorSales)" strokeWidth={2} name="Penjualan Bersih" />
                  <Area type="monotone" dataKey="profit" stroke="#457B9D" fill="transparent" strokeWidth={2} strokeDasharray="4 4" name="Laba Kotor" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Belum ada transaksi penjualan dalam periode ini.
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Metode Pembayaran</h3>
          <div className="h-[180px] flex items-center justify-center">
            {paymentSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="percentage"
                    nameKey="method"
                  >
                    {paymentSummary.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400 text-center">Belum ada data pembayaran</div>
            )}
          </div>
          <div className="space-y-2 mt-4 max-h-[120px] overflow-y-auto pr-1">
            {paymentSummary.map((pm, i) => (
              <div key={pm.method} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{getPaymentLabel(pm.method)}</span>
                </div>
                <span className="font-medium tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {pm.percentage}% ({formatCompact(pm.amount)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Produk Terlaris</h3>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.slice(0, 6).map((product, i) => (
                <div key={product.product_id} className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: i < 3 ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
                      color: i < 3 ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {product.product_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {product.quantity_sold} terjual • {product.category}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400 text-center py-10">Belum ada produk yang terjual</div>
            )}
          </div>
        </div>

        {/* Hourly Sales */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Penjualan Per Jam</h3>
          <div className="h-[280px]">
            {hourlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" tickFormatter={v => formatCompact(v)} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Penjualan']}
                  />
                  <Bar dataKey="total" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Belum ada data penjualan per jam</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Transaksi Terbaru</h3>
          <a href="/admin/transactions" className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
            Lihat Semua →
          </a>
        </div>
        <div className="overflow-x-auto">
          {recentTransactions.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Invoice</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Kasir</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Pelanggan</th>
                  <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total</th>
                  <th className="text-center py-2 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                  <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(txn => (
                  <tr
                    key={txn.id}
                    className="border-b hover:bg-[var(--color-bg-elevated)] transition-colors"
                    style={{ borderColor: 'var(--color-border-light)' }}
                  >
                    <td className="py-2.5 px-3 font-mono text-xs" style={{ color: 'var(--color-text-primary)' }}>{txn.invoice_number}</td>
                    <td className="py-2.5 px-3" style={{ color: 'var(--color-text-secondary)' }}>{txn.cashier_name}</td>
                    <td className="py-2.5 px-3" style={{ color: 'var(--color-text-secondary)' }}>{txn.customer_name || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                      {formatCurrency(txn.total)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`badge ${getStatusColor(txn.status)}`}>{txn.status}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDateTime(txn.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-gray-400 text-center py-10">Belum ada riwayat transaksi penjualan</div>
          )}
        </div>
      </div>
    </div>
  );
}
