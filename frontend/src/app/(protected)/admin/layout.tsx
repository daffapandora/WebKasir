'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { getProducts, getDiscounts } from '@/lib/firebase-service';
import Link from 'next/link';
import {
  LayoutDashboard, Package, Warehouse, Receipt, BarChart3, Users, UserCog,
  Truck, Tag, Star, Building2, Calculator, Settings, ShieldCheck, Monitor,
  Menu, X, Moon, Sun, LogOut, ChevronLeft, Store, Lock,
  FlaskConical, Trash2, History, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Produk', href: '/admin/products', icon: Package },
  { label: 'Inventaris', href: '/admin/inventory', icon: Warehouse },
  { label: 'Bahan Baku', href: '/admin/ingredients', icon: FlaskConical },
  { label: 'Log Limbah', href: '/admin/waste-logs', icon: Trash2 },
  { label: 'Transaksi', href: '/admin/transactions', icon: Receipt },
  { label: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { type: 'divider' as const },
  { label: 'Pelanggan', href: '/admin/customers', icon: Users },
  { label: 'Karyawan', href: '/admin/employees', icon: UserCog },
  { label: 'Supplier', href: '/admin/suppliers', icon: Truck },
  { type: 'divider' as const },
  { label: 'Diskon', href: '/admin/discounts', icon: Tag },
  { label: 'Loyalti', href: '/admin/loyalty', icon: Star },
  { label: 'Cabang', href: '/admin/branches', icon: Building2 },
  { label: 'Pajak', href: '/admin/tax', icon: Calculator },
  { type: 'divider' as const },
  { label: 'Akses Kontrol', href: '/admin/access-control', icon: ShieldCheck },
  { label: 'Audit Log', href: '/admin/audit-logs', icon: History },
  { label: 'Pengaturan', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuthStore();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useUIStore();

  const [notifications, setNotifications] = useState<{ id: string; title: string; desc: string; type: 'warning' | 'info' | 'error' }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [prodList, discList] = await Promise.all([getProducts(), getDiscounts()]);
        const alerts: typeof notifications = [];
        
        // 1. Low stock
        prodList.filter(p => p.is_active && p.stock <= p.min_stock).forEach(p => {
          alerts.push({
            id: `stock-${p.id}`,
            title: 'Stok Menipis!',
            desc: `${p.name} tersisa ${p.stock} ${p.unit}`,
            type: 'warning'
          });
        });

        // 2. Expiring discounts
        const today = new Date();
        discList.filter(d => d.is_active && d.end_date).forEach(d => {
          const end = new Date(d.end_date!);
          const diffDays = (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays >= 0 && diffDays <= 3) {
            alerts.push({
              id: `discount-${d.id}`,
              title: 'Diskon Segera Berakhir',
              desc: `${d.name} berakhir dalam ${Math.ceil(diffDays)} hari`,
              type: 'info'
            });
          }
        });

        setNotifications(alerts);
      } catch (e) {
        console.error('Error fetching layout alerts:', e);
      }
    };
    if (user) fetchAlerts();
  }, [user]);

  useEffect(() => {
    if (user && !isAdmin()) {
      router.replace('/pos');
    }
  }, [user, isAdmin, router]);

  if (!user || !isAdmin()) return null;

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {/* ═══ Sidebar ═══ */}
      <aside
        className={cn(
          'flex flex-col border-r transition-all duration-200 flex-shrink-0',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
        style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b h-14" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-accent)' }}>
            <Store className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <p className="text-sm font-bold leading-none" style={{ color: 'var(--color-text-primary)' }}>TokoPOS</p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV_ITEMS.map((item, i) => {
            if ('type' in item && item.type === 'divider') {
              return <div key={i} className="my-2 border-t" style={{ borderColor: 'var(--color-border-light)' }} />;
            }

            const navItem = item as { label: string; href: string; icon: typeof LayoutDashboard };
            const isActive = pathname === navItem.href;
            const Icon = navItem.icon;

            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'text-white'
                    : 'hover:bg-[var(--color-bg-elevated)]'
                )}
                style={{
                  background: isActive ? 'var(--color-accent)' : undefined,
                  color: isActive ? 'white' : 'var(--color-text-secondary)',
                }}
                title={!sidebarOpen ? navItem.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="animate-fade-in truncate">{navItem.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* POS & User */}
        <div className="border-t p-2 space-y-1" style={{ borderColor: 'var(--color-border-light)' }}>
          <Link
            href="/pos"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[var(--color-bg-elevated)]"
            style={{ color: 'var(--color-accent)' }}
          >
            <Monitor className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Buka Kasir</span>}
          </Link>

          <button
            onClick={toggleSidebar}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all hover:bg-[var(--color-bg-elevated)]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', !sidebarOpen && 'rotate-180')} />
            {sidebarOpen && <span>Tutup Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 h-14 border-b flex-shrink-0"
          style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="btn btn-ghost btn-icon btn-sm lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {NAV_ITEMS.find(n => 'href' in n && n.href === pathname)?.label || 'Admin'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn btn-ghost btn-icon btn-sm">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn btn-ghost btn-icon btn-sm relative"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[var(--color-bg-surface)] animate-pulse" />
                )}
              </button>
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-xl border shadow-lg z-50 p-4 space-y-3"
                  style={{
                    background: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-light)',
                  }}
                >
                  <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--color-border-light)' }}>
                    <h3 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Notifikasi ({notifications.length})</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        className="text-[10px] hover:underline"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Bersihkan
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>Tidak ada notifikasi</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="flex gap-2 p-2 rounded-lg text-xs" style={{ background: 'var(--color-bg-primary)' }}>
                          <span className={cn(
                            'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                            n.type === 'warning' ? 'bg-amber-500' : n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          )} />
                          <div>
                            <p className="font-semibold animate-fade-in" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>{n.desc}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--color-accent)' }}>
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{user.name}</p>
                <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-muted)' }}>{user.role.replace('_', ' ')}</p>
              </div>
            </div>

            <button onClick={logout} className="btn btn-ghost btn-icon btn-sm" title="Keluar">
              <LogOut className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
