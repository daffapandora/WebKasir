'use client';

import { useState } from 'react';
import { X, Banknote, QrCode, CreditCard, ArrowRightLeft, Star, Check, Loader2 } from 'lucide-react';
import { formatCurrency, suggestCashAmount, cn, generateInvoiceNumber } from '@/lib/utils';
import type { CartItem, PaymentMethod, Payment as PaymentType } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { addTransaction } from '@/lib/firebase-service';

interface PaymentModalProps {
  total: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  items: CartItem[];
  customerName: string;
  shiftId?: number;
  onComplete: (invoiceNumber: string, change: number, total: number) => void;
  onClose: () => void;
}

const PAYMENT_METHODS: { method: PaymentMethod | 'split'; label: string; icon: React.ReactNode; desc: string }[] = [
  { method: 'cash', label: 'Tunai', icon: <Banknote className="w-6 h-6" />, desc: 'Bayar dengan uang tunai' },
  { method: 'qris', label: 'QRIS', icon: <QrCode className="w-6 h-6" />, desc: 'Scan QR code' },
  { method: 'card', label: 'Kartu', icon: <CreditCard className="w-6 h-6" />, desc: 'Debit / Kredit' },
  { method: 'transfer', label: 'Transfer', icon: <ArrowRightLeft className="w-6 h-6" />, desc: 'Transfer bank' },
  { method: 'loyalty', label: 'Poin', icon: <Star className="w-6 h-6" />, desc: 'Tukar poin loyalti' },
  { method: 'split', label: 'Split', icon: <ArrowRightLeft className="w-6 h-6" />, desc: 'Bagi pembayaran' },
];

export function PaymentModal({ total, subtotal, taxAmount, discountAmount, items, customerName, shiftId, onComplete, onClose }: PaymentModalProps) {
  const processPayment = useCartStore(s => s.processPayment);
  const customerId = useCartStore(s => s.customerId);
  const user = useAuthStore(s => s.user);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | 'split'>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [reference, setReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrisStatus, setQrisStatus] = useState<'pending' | 'paid' | 'failed' | 'timeout'>('pending');

  // Split payment states
  const [splitMethod1, setSplitMethod1] = useState<string>('cash');
  const [splitMethod2, setSplitMethod2] = useState<string>('card');
  const [splitAmount1, setSplitAmount1] = useState<number>(Math.round(total / 2));
  const [splitCashReceived1, setSplitCashReceived1] = useState<string>('');
  const [splitCashReceived2, setSplitCashReceived2] = useState<string>('');

  const cashValue = parseInt(cashAmount) || 0;
  
  // Real-time calculations for split payment
  const splitAmount2 = Math.max(0, total - splitAmount1);
  const splitCashReceived1Val = parseInt(splitCashReceived1) || 0;
  const splitCashReceived2Val = parseInt(splitCashReceived2) || 0;

  // Calculate change
  let change = 0;
  if (selectedMethod === 'cash') {
    change = Math.max(0, cashValue - total);
  } else if (selectedMethod === 'split') {
    const change1 = splitMethod1 === 'cash' ? Math.max(0, splitCashReceived1Val - splitAmount1) : 0;
    const change2 = splitMethod2 === 'cash' ? Math.max(0, splitCashReceived2Val - splitAmount2) : 0;
    change = change1 + change2;
  }

  // Validate payments
  const isSplitValid = selectedMethod === 'split'
    ? (splitAmount1 > 0 && splitAmount2 > 0 && splitMethod1 !== splitMethod2
       && (splitMethod1 === 'cash' ? splitCashReceived1Val >= splitAmount1 : true)
       && (splitMethod2 === 'cash' ? splitCashReceived2Val >= splitAmount2 : true))
    : true;

  const canPay = selectedMethod === 'split'
    ? isSplitValid
    : (selectedMethod === 'cash' ? cashValue >= total : true);

  const handlePay = async () => {
    setIsProcessing(true);

    try {
      if (selectedMethod === 'qris') {
        // Simulate QRIS flow
        setQrisStatus('pending');
        await new Promise(r => setTimeout(r, 1500));
        setQrisStatus('paid');
        await new Promise(r => setTimeout(r, 300));
      } else {
        await new Promise(r => setTimeout(r, 600));
      }

      const invoiceNumber = generateInvoiceNumber();

      let payments: PaymentType[] = [];
      if (selectedMethod === 'split') {
        payments = [
          { method: splitMethod1 as PaymentMethod, amount: splitAmount1 },
          { method: splitMethod2 as PaymentMethod, amount: splitAmount2 }
        ];
      } else {
        payments = [{
          method: selectedMethod as PaymentMethod,
          amount: selectedMethod === 'cash' ? cashValue : total,
          reference: reference || undefined,
        }];
      }

      // 1. Write the transaction to Firestore (with all database side effects)
      await addTransaction({
        invoice_number: invoiceNumber,
        branch_id: user?.branch_id || 1,
        branch_name: user?.branch_name || 'Toko Pusat',
        cashier_id: user?.id || 1,
        cashier_name: user?.name || 'Kasir',
        customer_id: customerId || undefined,
        customer_name: customerName || undefined,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        service_charge: 0,
        total,
        change_amount: change,
        status: 'completed',
        shift_id: shiftId || 0,
        items: items.map((item, idx) => ({
          id: idx + 1,
          product_id: item.product_id,
          product_name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.price,
          discount_amount: item.discount_amount,
          subtotal: item.subtotal,
        })),
        payments,
      });

      // 2. Clear local cart state
      processPayment(payments);

      // 3. Trigger receipt preview
      onComplete(invoiceNumber, change, total);

    } catch (err) {
      console.error(err);
      alert("Gagal memproses transaksi ke database.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop flex items-center justify-center p-4">
      <div
        className="modal-content card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Pembayaran</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {items.length} item • {customerName || 'Pelanggan umum'}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Total Display */}
          <div
            className="text-center p-6 rounded-2xl"
            style={{ background: 'var(--color-accent-subtle)' }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Total Pembayaran</p>
            <p className="text-4xl font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
              {formatCurrency(total)}
            </p>
            <div className="flex justify-center gap-4 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span>Subtotal: {formatCurrency(subtotal)}</span>
              {discountAmount > 0 && <span>Diskon: -{formatCurrency(discountAmount)}</span>}
              {taxAmount > 0 && <span>PPN: {formatCurrency(taxAmount)}</span>}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Metode Pembayaran</p>
            <div className="grid grid-cols-6 gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.method}
                  onClick={() => { setSelectedMethod(pm.method); setCashAmount(''); setReference(''); }}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all min-h-[88px]',
                    selectedMethod === pm.method
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                      : 'border-transparent bg-[var(--color-bg-elevated)] hover:border-[var(--color-border)]'
                  )}
                >
                  <div style={{ color: selectedMethod === pm.method ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                    {pm.icon}
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          {selectedMethod === 'cash' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Jumlah Uang Diterima
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  placeholder="Masukkan jumlah..."
                  className="input text-xl font-bold text-center tabular-nums"
                  autoFocus
                />
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-2">
                {suggestCashAmount(total).map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashAmount(String(amount))}
                    className={cn(
                      'btn btn-sm tabular-nums',
                      cashAmount === String(amount) ? 'btn-primary' : 'btn-outline'
                    )}
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>

              {/* A6: Change/shortfall display */}
              {cashAmount && (
                <div
                  className="p-4 rounded-xl text-center transition-colors"
                  style={{ 
                    background: cashValue >= total ? 'var(--color-success-light)' : 'rgb(239 68 68 / 0.1)' 
                  }}
                >
                  {cashValue >= total ? (
                    <>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Kembalian</p>
                      <p className="text-3xl font-bold tabular-nums text-green-500">
                        {formatCurrency(change)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-red-400">Kurang Uang</p>
                      <p className="text-3xl font-bold tabular-nums text-red-500">
                        {formatCurrency(total - cashValue)}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* B4-19: Split Payment */}
          {selectedMethod === 'split' && (
            <div className="space-y-4 p-4 rounded-2xl bg-[var(--color-bg-elevated)] border" style={{ borderColor: 'var(--color-border-light)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Detail Split Payment</p>
              
              {splitMethod1 === splitMethod2 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center gap-2">
                  <span className="text-xs text-red-400 font-medium">Metode pembayaran 1 dan 2 tidak boleh sama.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Kolom Pembayaran 1 */}
                <div className="space-y-3 p-3 rounded-xl bg-[var(--color-bg-surface)] border" style={{ borderColor: 'var(--color-border-light)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Pembayaran 1</p>
                  <select
                    value={splitMethod1}
                    onChange={e => {
                      setSplitMethod1(e.target.value);
                      setSplitCashReceived1('');
                    }}
                    className="input w-full text-sm"
                  >
                    <option value="cash">Tunai (Cash)</option>
                    <option value="card">Kartu (Debit/Kredit)</option>
                    <option value="transfer">Transfer Bank</option>
                    <option value="qris">QRIS</option>
                  </select>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Jumlah</label>
                    <input
                      type="number"
                      value={splitAmount1 || ''}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setSplitAmount1(Math.min(total, Math.max(0, val)));
                      }}
                      placeholder="Rp"
                      className="input w-full text-sm font-semibold font-mono"
                    />
                  </div>
                  {splitMethod1 === 'cash' && (
                    <div>
                      <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Uang Diterima</label>
                      <input
                        type="number"
                        value={splitCashReceived1}
                        onChange={e => setSplitCashReceived1(e.target.value)}
                        placeholder="Rp"
                        className="input w-full text-sm font-mono"
                      />
                      {splitCashReceived1 && (
                        <div className="mt-1">
                          {splitCashReceived1Val < splitAmount1 ? (
                            <span className="text-[10px] text-red-400 font-medium">Kurang: {formatCurrency(splitAmount1 - splitCashReceived1Val)}</span>
                          ) : (
                            <span className="text-[10px] text-green-400 font-medium">Kembalian: {formatCurrency(splitCashReceived1Val - splitAmount1)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Kolom Pembayaran 2 */}
                <div className="space-y-3 p-3 rounded-xl bg-[var(--color-bg-surface)] border" style={{ borderColor: 'var(--color-border-light)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Pembayaran 2</p>
                  <select
                    value={splitMethod2}
                    onChange={e => {
                      setSplitMethod2(e.target.value);
                      setSplitCashReceived2('');
                    }}
                    className="input w-full text-sm"
                  >
                    <option value="card">Kartu (Debit/Kredit)</option>
                    <option value="cash">Tunai (Cash)</option>
                    <option value="transfer">Transfer Bank</option>
                    <option value="qris">QRIS</option>
                  </select>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Jumlah</label>
                    <input
                      type="number"
                      value={splitAmount2}
                      disabled
                      className="input w-full text-sm font-semibold font-mono bg-[var(--color-bg-elevated)]"
                    />
                  </div>
                  {splitMethod2 === 'cash' && (
                    <div>
                      <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Uang Diterima</label>
                      <input
                        type="number"
                        value={splitCashReceived2}
                        onChange={e => setSplitCashReceived2(e.target.value)}
                        placeholder="Rp"
                        className="input w-full text-sm font-mono"
                      />
                      {splitCashReceived2 && (
                        <div className="mt-1">
                          {splitCashReceived2Val < splitAmount2 ? (
                            <span className="text-[10px] text-red-400 font-medium">Kurang: {formatCurrency(splitAmount2 - splitCashReceived2Val)}</span>
                          ) : (
                            <span className="text-[10px] text-green-400 font-medium">Kembalian: {formatCurrency(splitCashReceived2Val - splitAmount2)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'qris' && (
            <div className="text-center p-6">
              <div
                className="w-48 h-48 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--color-bg-elevated)' }}
              >
                {qrisStatus === 'pending' && !isProcessing && (
                  <QrCode className="w-24 h-24" style={{ color: 'var(--color-text-muted)' }} />
                )}
                {isProcessing && qrisStatus === 'pending' && (
                  <div className="animate-pulse-subtle">
                    <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--color-accent)' }} />
                  </div>
                )}
                {qrisStatus === 'paid' && (
                  <Check className="w-16 h-16" style={{ color: 'var(--color-success)' }} />
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {isProcessing && qrisStatus === 'pending' ? 'Menunggu pembayaran...' :
                 qrisStatus === 'paid' ? 'Pembayaran berhasil!' :
                 'Klik "Bayar" untuk menampilkan QR Code'}
              </p>
            </div>
          )}

          {(selectedMethod === 'card' || selectedMethod === 'transfer') && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Nomor Referensi (opsional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Masukkan nomor referensi..."
                className="input"
              />
            </div>
          )}

          {selectedMethod === 'loyalty' && (
            <div className="text-center p-4 rounded-xl" style={{ background: 'var(--color-warning-light)' }}>
              <Star className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-warning)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {customerName ? `${customerName} — Poin akan diredeem` : 'Pilih pelanggan terlebih dahulu'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--color-border-light)' }}>
          <button onClick={onClose} className="btn btn-outline flex-1">
            Batal
          </button>
          <button
            onClick={handlePay}
            disabled={!canPay || isProcessing}
            className="btn btn-primary btn-lg flex-[2]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Bayar {formatCurrency(total)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
