'use client';

import { useState, useEffect } from 'react';
import { X, Search, User, Star, Crown, Loader2 } from 'lucide-react';
import { getCustomers } from '@/lib/firebase-service';
import { formatCurrency, cn } from '@/lib/utils';
import type { Customer } from '@/types';

interface CustomerSearchModalProps {
  onSelect: (id: number, name: string) => void;
  onClose: () => void;
}

export function CustomerSearchModal({ onSelect, onClose }: CustomerSearchModalProps) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const tierIcons: Record<string, React.ReactNode> = {
    gold: <Crown className="w-3.5 h-3.5 text-yellow-500" />,
    silver: <Star className="w-3.5 h-3.5 text-gray-400" />,
    bronze: <Star className="w-3.5 h-3.5 text-orange-600" />,
  };

  return (
    <div className="modal-backdrop flex items-center justify-center p-4">
      <div
        className="modal-content card w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            <h2 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Pilih Pelanggan</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau nomor HP..."
              className="input pl-10"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* No customer option */}
          <button
            onClick={() => onSelect(0, '')}
            className="w-full p-3 flex items-center gap-3 border-b hover:bg-[var(--color-bg-elevated)] transition-colors"
            style={{ borderColor: 'var(--color-border-light)' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-elevated)' }}>
              <User className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p className="font-medium text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pelanggan Umum (tanpa nama)</p>
          </button>

          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
            </div>
          ) : (
            filtered.map(customer => (
              <button
                key={customer.id}
                onClick={() => onSelect(customer.id, customer.name)}
                className="w-full p-3 flex items-center gap-3 border-b hover:bg-[var(--color-bg-elevated)] transition-colors text-left"
                style={{ borderColor: 'var(--color-border-light)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {customer.name}
                    </p>
                    {tierIcons[customer.membership_tier]}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{customer.phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium tabular-nums" style={{ color: 'var(--color-accent)' }}>
                    {customer.loyalty_points} poin
                  </p>
                  <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    {customer.membership_tier !== 'none' ? customer.membership_tier : ''}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
