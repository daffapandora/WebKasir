'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs } from '@/lib/firebase-service';
import { formatDate, cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { ShieldAlert, Search, Filter, Calendar, RefreshCw, Eye, X } from 'lucide-react';
import { Pagination, usePagination } from '@/components/shared/pagination';
import type { AuditLog } from '@/types';

export default function AuditLogsPage() {
  const { addToast } = useUIStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  // Selected log for detailed view modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await getAuditLogs();
      setLogs(list);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat log audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = logs.filter(log => {
    if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.user_name.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.module || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const { currentPage, totalPages, perPage, paginatedItems, totalItems, handlePageChange, handlePerPageChange } = usePagination(filtered, 20);

  // Extract unique modules and actions for filter options
  const uniqueModules = Array.from(new Set(logs.map(l => l.module).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'add':
      case 'create_waste_log':
        return 'badge-success';
      case 'update':
      case 'adjust_stock':
        return 'badge-info';
      case 'delete':
      case 'archive':
        return 'badge-danger';
      default:
        return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Audit Log</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Rekam aktivitas dan riwayat perubahan sistem</p>
        </div>
        <button onClick={loadData} className="btn btn-outline btn-sm gap-1.5" disabled={loading}>
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Segarkan
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari pengguna, deskripsi, atau modul..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="input w-[150px] text-xs font-semibold"
          >
            <option value="all">Semua Modul</option>
            {uniqueModules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="input w-[150px] text-xs font-semibold"
          >
            <option value="all">Semua Aksi</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-bg-elevated)' }}>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Waktu</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Pengguna</th>
                <th className="text-center py-3 px-4 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Aksi</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Modul</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Deskripsi</th>
                <th className="text-center py-3 px-4 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4 px-4">
                      <div className="h-6 rounded animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
                    </td>
                  </tr>
                ))
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Tidak ada log audit yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--color-bg-elevated)] transition-colors">
                    <td className="py-3 px-4 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {log.user_name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn('badge badge-sm uppercase', getActionBadgeColor(log.action))}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                      {log.module}
                    </td>
                    <td className="py-3 px-4 text-xs max-w-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(log.old_value || log.new_value) ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn btn-ghost btn-icon btn-xs"
                          title="Lihat Detail Nilai"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 pb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="modal-content card w-full max-w-md p-5 space-y-4" style={{ background: 'var(--color-bg-surface)' }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Detail Perubahan Nilai</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>ID Log: #{selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="btn btn-ghost btn-icon btn-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 py-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>Deskripsi</span>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{selectedLog.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1 p-3 rounded-xl border flex flex-col min-h-[100px]" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-light)' }}>
                  <span className="text-[9px] uppercase font-bold text-red-400">Nilai Lama</span>
                  <div className="text-xs font-mono break-all mt-1 whitespace-pre-wrap flex-1 overflow-y-auto" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedLog.old_value || '—'}
                  </div>
                </div>

                <div className="space-y-1 p-3 rounded-xl border flex flex-col min-h-[100px]" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-light)' }}>
                  <span className="text-[9px] uppercase font-bold text-green-400">Nilai Baru</span>
                  <div className="text-xs font-mono break-all mt-1 whitespace-pre-wrap flex-1 overflow-y-auto" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedLog.new_value || '—'}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setSelectedLog(null)} className="btn btn-primary w-full btn-sm">
              Tutup Detail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
