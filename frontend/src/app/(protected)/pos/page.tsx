'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useIngredientStore } from '@/store/ingredient-store';
import { getProducts, getCategories, getCurrentShift, openShift, closeShift } from '@/lib/firebase-service';
import { formatCurrency, isBarcode, cn } from '@/lib/utils';
import {
  Search, Pause, Receipt, Moon, Sun, Lock, LogOut, Store, History, Loader2, ArrowUpDown, X, Trash2, HelpCircle, Keyboard
} from 'lucide-react';
import { PaymentModal } from '@/components/pos/payment-modal';
import { ReceiptModal } from '@/components/pos/receipt-modal';
import { HeldBillsDrawer } from '@/components/pos/held-bills-drawer';
import { DiscountModal } from '@/components/pos/discount-modal';
import { CustomerSearchModal } from '@/components/pos/customer-search-modal';
import Link from 'next/link';
import type { Product, Category, Shift } from '@/types';

export default function POSPage() {
  const { user, logout, lock, isAdmin } = useAuthStore();
  const cart = useCartStore();
  const { theme, toggleTheme, addToast } = useUIStore();
  const { ingredients, fetchIngredients } = useIngredientStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoice, setLastInvoice] = useState('');
  const [lastChange, setLastChange] = useState(0);
  const [lastTotal, setLastTotal] = useState(0);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  
  // B4-24: Keyboard shortcut help state
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Shift Management State
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState<number | ''>('');
  const [openingShiftLoading, setOpeningShiftLoading] = useState(false);

  // B4-18: Shift Closing State
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [closingCashInput, setClosingCashInput] = useState<number | ''>('');
  const [shiftNotesInput, setShiftNotesInput] = useState('');
  const [closeShiftLoading, setCloseShiftLoading] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch products and categories on mount
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodList, catList] = await Promise.all([getProducts(), getCategories(), fetchIngredients()]);
      setProducts(prodList);
      setCategories(catList);

      // Check current open shift
      if (user) {
        const activeShift = await getCurrentShift(user.id);
        setCurrentShift(activeShift);
        if (!activeShift) {
          setShowOpenShiftModal(true);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat data POS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Keyboard shortcut listener (B4-24)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' && document.activeElement !== searchRef.current) return;
      if (e.key === 'F1') { e.preventDefault(); setShowShortcutHelp(prev => !prev); return; }
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === 'F3' && cart.items.length > 0) { e.preventDefault(); setShowPayment(true); return; }
      if (e.key === 'F4') { e.preventDefault(); handleHoldBill(); return; }
      if (e.key === 'F5') { e.preventDefault(); setShowDiscount(true); return; }
      if (e.key === 'F8') { e.preventDefault(); setShowCustomerSearch(true); return; }
      if (e.key === 'Escape') { setSearchQuery(''); searchRef.current?.blur(); return; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.items.length]);

  // Handle open shift
  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || openingCashInput === '') return;

    try {
      setOpeningShiftLoading(true);
      const newShift = await openShift(
        user.id,
        user.name,
        user.branch_id,
        user.branch_name,
        Number(openingCashInput)
      );
      setCurrentShift(newShift);
      setShowOpenShiftModal(false);
      addToast('success', 'Shift kasir berhasil dibuka');
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal membuka shift kasir');
    } finally {
      setOpeningShiftLoading(false);
    }
  };

  // B4-18: Handle close shift
  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift || closingCashInput === '') return;

    try {
      setCloseShiftLoading(true);
      await closeShift(currentShift.id, Number(closingCashInput), shiftNotesInput);
      addToast('success', 'Shift kasir berhasil ditutup', 'Laporan shift dicatat');
      setCurrentShift(null);
      setShowCloseShiftModal(false);
      setClosingCashInput('');
      setShiftNotesInput('');
      setShowOpenShiftModal(true);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menutup shift kasir');
    } finally {
      setCloseShiftLoading(false);
    }
  };

  // Search & filter
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (isBarcode(val)) {
      const match = products.find(p => p.barcode === val && p.is_active);
      if (match) {
        let isAvailable = false;
        if (match.use_recipe) {
          const hasInsufficient = match.ingredients?.some(req => {
            const ing = ingredients.find(i => i.id === req.ingredient_id);
            return !ing || ing.stock < req.quantity_needed;
          });
          isAvailable = !hasInsufficient;
        } else {
          isAvailable = match.stock > 0;
        }

        if (isAvailable) {
          cart.addItem(match.id);
          setSearchQuery('');
          addToast('success', `${match.name} ditambahkan`);
        } else {
          addToast('warning', match.use_recipe ? 'Bahan baku habis' : 'Stok habis', `${match.name} tidak tersedia`);
        }
      }
    }
  };

  const handleAddProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.use_recipe) {
      const hasInsufficientIngredients = product.ingredients?.some(req => {
        const ing = ingredients.find(i => i.id === req.ingredient_id);
        return !ing || ing.stock < req.quantity_needed;
      });
      if (hasInsufficientIngredients) {
        addToast('warning', 'Bahan baku habis', `${product.name} tidak dapat dibuat`);
        return;
      }
    } else {
      if (product.stock <= 0) {
        addToast('warning', 'Stok habis', `${product.name} tidak tersedia`);
        return;
      }
    }
    cart.addItem(productId);
  };

  const handleHoldBill = () => {
    if (cart.items.length === 0) return;
    cart.holdBill();
    addToast('info', 'Transaksi ditahan', 'Bill disimpan sementara');
  };

  const handlePaymentComplete = (invoiceNumber: string, change: number, total: number) => {
    setLastInvoice(invoiceNumber);
    setLastChange(change);
    setLastTotal(total);
    setShowPayment(false);
    setShowReceipt(true);
    addToast('success', 'Pembayaran berhasil!', `Invoice: ${invoiceNumber}`);
    loadData(); // reload product stocks from Firestore
  };

  const filteredProducts = products.filter(p => {
    if (!p.is_active) return false;
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
    }
    return true;
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {/* ═══ Top Bar ═══ */}
      <header
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>TokoPOS</h1>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {user?.branch_name} {currentShift ? `• Shift #${currentShift.id}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {currentShift && (
            <button
              onClick={() => setShowCloseShiftModal(true)}
              className="btn btn-outline btn-sm text-xs font-semibold px-2.5 py-1.5 gap-1.5 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
              style={{ color: 'rgb(239 68 68)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Tutup Shift
            </button>
          )}

          {cart.heldBills.length > 0 && (
            <button onClick={() => setShowHeldBills(true)} className="btn btn-ghost btn-sm relative">
              <Pause className="w-4 h-4" />
              <span className="text-xs">Ditahan</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: 'var(--color-warning)' }}>
                {cart.heldBills.length}
              </span>
            </button>
          )}

          {isAdmin() && (
            <Link href="/admin/dashboard" className="btn btn-ghost btn-sm">
              <span className="text-xs font-semibold">Dashboard Admin</span>
            </Link>
          )}

          <Link href="/pos/history" className="btn btn-ghost btn-sm" title="Riwayat Penjualan">
            <History className="w-4 h-4" />
          </Link>

          <button onClick={() => setShowShortcutHelp(true)} className="btn btn-ghost btn-icon btn-sm" title="Bantuan Shortcut (F1)">
            <HelpCircle className="w-4 h-4" />
          </button>

          <button onClick={toggleTheme} className="btn btn-ghost btn-icon btn-sm">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button onClick={lock} className="btn btn-ghost btn-icon btn-sm">
            <Lock className="w-4 h-4" />
          </button>

          <div className="w-px h-6 mx-1" style={{ background: 'var(--color-border)' }} />

          <div className="flex items-center gap-2 mr-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--color-accent)' }}>
              {user?.name.charAt(0)}
            </div>
            <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--color-text-primary)' }}>
              {user?.name}
            </span>
          </div>

          <button onClick={logout} className="btn btn-ghost btn-icon btn-sm" title="Keluar">
            <LogOut className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
          </button>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Memuat data produk kasir...</p>
          </div>
        ) : (
          <>
            {/* Left Panel: Catalog */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="p-3 space-y-3 flex-shrink-0" style={{ background: 'var(--color-bg-surface)' }}>
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Cari produk, scan barcode... (F2)"
                    className="input pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                  )}
                </div>

                {/* Categories Tab */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn('btn btn-sm whitespace-nowrap flex-shrink-0', !selectedCategory ? 'btn-primary' : 'btn-outline')}
                  >
                    Semua
                  </button>
                  {categories.filter(c => c.is_active).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      className={cn('btn btn-sm whitespace-nowrap flex-shrink-0', selectedCategory === cat.id ? 'btn-primary' : 'btn-outline')}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto p-3">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <Search className="w-12 h-12 mb-3" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="font-medium">Produk tidak ditemukan</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {filteredProducts.map(product => {
                      const inCart = cart.items.find(i => i.product_id === product.id);
                      
                      // Check if product uses recipe and has insufficient ingredients
                      const hasInsufficientIngredients = product.use_recipe && product.ingredients && product.ingredients.some(req => {
                        const ing = ingredients.find(i => i.id === req.ingredient_id);
                        return !ing || ing.stock < req.quantity_needed;
                      });

                      const isOutOfStock = product.use_recipe ? hasInsufficientIngredients : product.stock <= 0;
                      
                      const hasLowIngredients = product.use_recipe && product.ingredients && product.ingredients.some(req => {
                        const ing = ingredients.find(i => i.id === req.ingredient_id);
                        return ing && ing.stock > req.quantity_needed && ing.stock <= ing.min_stock;
                      });
                      const isLowStock = product.use_recipe 
                        ? hasLowIngredients 
                        : (product.stock > 0 && product.stock <= product.min_stock);

                      // Calculate maximum serving portions based on ingredient stock
                      const maxServings = (() => {
                        if (!product.use_recipe || !product.ingredients || product.ingredients.length === 0) {
                          return null;
                        }
                        let minServings = Infinity;
                        for (const req of product.ingredients) {
                          const ing = ingredients.find(i => i.id === req.ingredient_id);
                          if (!ing) return 0;
                          const servings = Math.floor(ing.stock / req.quantity_needed);
                          if (servings < minServings) {
                            minServings = servings;
                          }
                        }
                        return minServings === Infinity ? 0 : minServings;
                      })();

                      return (
                        <button
                          key={product.id}
                          onClick={() => handleAddProduct(product.id)}
                          disabled={isOutOfStock}
                          className={cn(
                            'pos-product-card card p-3 text-left relative group',
                            isOutOfStock && 'opacity-50 cursor-not-allowed',
                            inCart && 'ring-2'
                          )}
                          style={{
                            borderColor: inCart
                              ? 'var(--color-accent)'
                              : isLowStock
                                ? 'rgb(249 115 22 / 0.5)'
                                : 'var(--color-border-light)',
                          }}
                        >
                          <div className="aspect-square w-full rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center mb-2 overflow-hidden relative border" style={{ borderColor: 'var(--color-border-light)' }}>
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                            ) : (
                              <span className="text-3xl">{categories.find(c => c.id === product.category_id)?.icon || '📦'}</span>
                            )}
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-[11px] font-bold px-2 py-0.5 rounded bg-red-600">
                                  {product.use_recipe ? 'Bahan Habis' : 'Habis'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xs font-semibold line-clamp-2 leading-tight" style={{ color: 'var(--color-text-primary)' }}>{product.name}</h3>
                            <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>{formatCurrency(product.sale_price)}</p>
                            <div className="flex justify-between items-center text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                              <span>{product.use_recipe ? `Porsi: ${maxServings}` : `Stok: ${product.stock}`}</span>
                              {inCart && <span className="font-bold text-[var(--color-accent)]">x{inCart.quantity}</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Cart */}
            <div className="hidden lg:flex w-[380px] xl:w-[420px] flex-col border-l flex-shrink-0" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
              {/* Cart Header */}
              <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                <h2 className="font-semibold text-sm">Keranjang Belanja</h2>
                <div className="flex gap-1">
                  <button onClick={() => setShowCustomerSearch(true)} className={cn('btn btn-sm', cart.customerName ? 'btn-primary' : 'btn-ghost')}>
                    <span>{cart.customerName || 'Pelanggan'}</span>
                  </button>
                  {cart.items.length > 0 && (
                    <button onClick={() => cart.clearCart()} className="btn btn-ghost btn-icon btn-sm">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                {cart.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-40 p-6">
                    <p className="font-medium text-sm">Keranjang kosong</p>
                  </div>
                ) : (
                  cart.items.map(item => (
                    <div key={item.id} className="p-3 animate-fade-in space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{item.name}</p>
                          {item.notes && (
                            <p className="text-xs text-[var(--color-accent)] italic font-medium mt-0.5">
                              * Catatan: {item.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted tabular-nums">{formatCurrency(item.price)} × {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold tabular-nums">{formatCurrency(item.subtotal)}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button onClick={() => cart.decrementQuantity(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border">-</button>
                          <span className="w-10 text-center font-bold">{item.quantity}</span>
                          <button onClick={() => cart.incrementQuantity(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border">+</button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* B4-20: Item notes button */}
                          <button
                            onClick={() => {
                              const note = prompt("Masukkan catatan untuk item ini:", item.notes || "");
                              if (note !== null) cart.setItemNotes(item.id, note);
                            }}
                            className="btn btn-ghost btn-sm text-xs py-1 px-2 flex items-center gap-1"
                          >
                            📝 Note
                          </button>
                          <button onClick={() => cart.removeItem(item.id)} className="btn btn-ghost btn-icon btn-sm text-red-500">
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cart.items.length > 0 && (
                <div className="border-t p-3 space-y-3 flex-shrink-0" style={{ borderColor: 'var(--color-border-light)' }}>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                      <span className="tabular-nums">{formatCurrency(cart.subtotal)}</span>
                    </div>
                    {cart.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--color-text-secondary)' }}>PPN 11%</span>
                        <span className="tabular-nums">{formatCurrency(cart.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>Total</span>
                      <span style={{ color: 'var(--color-accent)' }}>{formatCurrency(cart.total)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowDiscount(true)} className="btn btn-outline btn-sm">Diskon (F5)</button>
                    <button onClick={handleHoldBill} className="btn btn-outline btn-sm">Tahan (F4)</button>
                  </div>

                  <button onClick={() => setShowPayment(true)} className="btn btn-primary btn-lg w-full text-base">
                    Bayar — {formatCurrency(cart.total)} (F3)
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══ Modals ═══ */}
      
      {/* Shift Opening Modal */}
      {showOpenShiftModal && (
        <div className="modal-backdrop flex items-center justify-center p-4 z-50">
          <form onSubmit={handleOpenShiftSubmit} className="modal-content card w-full max-w-sm p-5 space-y-4" style={{ background: 'var(--color-bg-surface)' }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Buka Shift Kasir</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Masukkan modal kas awal untuk mulai berjualan</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Kas Kasir Awal *</label>
              <input
                type="number"
                required
                value={openingCashInput}
                onChange={e => setOpeningCashInput(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="cth. 50000"
                className="input w-full text-lg font-bold text-center"
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={openingShiftLoading}>
              {openingShiftLoading ? 'Membuka...' : 'Mulai Shift'}
            </button>
          </form>
        </div>
      )}

      {/* B4-18: Shift Closing Modal */}
      {showCloseShiftModal && currentShift && (
        <div className="modal-backdrop flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCloseShiftSubmit} className="modal-content card w-full max-w-md overflow-hidden animate-fade-in" style={{ background: 'var(--color-bg-surface)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Tutup Shift Kasir</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Shift #{currentShift.id} • {currentShift.cashier_name}</p>
              </div>
              <button type="button" onClick={() => setShowCloseShiftModal(false)} className="btn btn-ghost btn-icon btn-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-light)' }}>
                <div style={{ color: 'var(--color-text-secondary)' }}>Kas Awal:</div>
                <div className="text-right font-semibold tabular-nums">{formatCurrency(currentShift.opening_cash)}</div>
                
                <div style={{ color: 'var(--color-text-secondary)' }}>Total Tunai:</div>
                <div className="text-right font-semibold tabular-nums text-green-500">+{formatCurrency(currentShift.total_cash_sales)}</div>
                
                <div style={{ color: 'var(--color-text-secondary)' }}>Total Non-Tunai:</div>
                <div className="text-right font-semibold tabular-nums">{formatCurrency(currentShift.total_non_cash_sales)}</div>
                
                <div style={{ color: 'var(--color-text-secondary)' }}>Total Penjualan:</div>
                <div className="text-right font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>{formatCurrency(currentShift.total_sales)}</div>

                <div className="col-span-2 my-1 border-t" style={{ borderColor: 'var(--color-border-light)' }} />

                <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Ekspektasi Uang Fisik:</div>
                <div className="text-right font-bold text-sm tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(currentShift.opening_cash + currentShift.total_cash_sales)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Jumlah Uang Fisik Aktual *
                </label>
                <input
                  type="number"
                  required
                  value={closingCashInput}
                  onChange={e => setClosingCashInput(e.target.value !== '' ? Number(e.target.value) : '')}
                  placeholder="Masukkan jumlah uang fisik di laci..."
                  className="input text-lg font-bold font-mono text-center"
                />
                {closingCashInput !== '' && (
                  <div className="mt-2 text-center text-xs">
                    {Number(closingCashInput) - (currentShift.opening_cash + currentShift.total_cash_sales) === 0 ? (
                      <span className="text-green-500 font-bold">✓ Klop (Sesuai)</span>
                    ) : Number(closingCashInput) - (currentShift.opening_cash + currentShift.total_cash_sales) > 0 ? (
                      <span className="text-blue-500 font-bold">
                        Selisih Lebih: +{formatCurrency(Number(closingCashInput) - (currentShift.opening_cash + currentShift.total_cash_sales))}
                      </span>
                    ) : (
                      <span className="text-red-500 font-bold">
                        Selisih Kurang: {formatCurrency(Number(closingCashInput) - (currentShift.opening_cash + currentShift.total_cash_sales))}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Catatan Penutup Shift (opsional)
                </label>
                <textarea
                  value={shiftNotesInput}
                  onChange={e => setShiftNotesInput(e.target.value)}
                  placeholder="Catatan tambahan mengenai selisih, serah terima, dll..."
                  className="input w-full text-xs h-20 resize-none py-2"
                />
              </div>
            </div>

            <div className="p-4 border-t flex gap-2" style={{ borderColor: 'var(--color-border-light)' }}>
              <button type="button" onClick={() => setShowCloseShiftModal(false)} className="btn btn-outline flex-1 btn-sm" disabled={closeShiftLoading}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary flex-1 btn-sm" disabled={closeShiftLoading}>
                {closeShiftLoading ? 'Memproses...' : 'Tutup Shift'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* B4-24: Keyboard Shortcut Cheat Sheet */}
      {showShortcutHelp && (
        <div className="modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="modal-content card w-full max-w-md p-5 space-y-4 animate-fade-in" style={{ background: 'var(--color-bg-surface)' }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 animate-bounce-subtle" style={{ color: 'var(--color-accent)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Bantuan Keyboard Shortcut</h3>
              </div>
              <button onClick={() => setShowShortcutHelp(false)} className="btn btn-ghost btn-icon btn-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { keys: ['F1'], label: 'Tampilkan / Sembunyikan Bantuan' },
                { keys: ['F2'], label: 'Fokus ke Bar Pencarian Produk' },
                { keys: ['F3'], label: 'Buka Modal Pembayaran (Checkout)' },
                { keys: ['F4'], label: 'Tahan Transaksi (Hold Bill)' },
                { keys: ['F5'], label: 'Terapkan Diskon Global' },
                { keys: ['F8'], label: 'Cari / Pilih Member Pelanggan' },
                { keys: ['Esc'], label: 'Bersihkan pencarian / Tutup modal aktif' }
              ].map(shortcut => (
                <div key={shortcut.keys.join('+')} className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{shortcut.label}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map(k => (
                      <kbd key={k} className="px-2 py-1 rounded border font-mono font-bold shadow-sm" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-light)', color: 'var(--color-text-primary)' }}>
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setShowShortcutHelp(false)} className="btn btn-primary w-full btn-sm">
              Tutup Bantuan
            </button>
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentModal
          total={cart.total}
          subtotal={cart.subtotal}
          taxAmount={cart.taxAmount}
          discountAmount={cart.itemDiscountTotal + cart.cartDiscountAmount}
          items={cart.items}
          customerName={cart.customerName}
          shiftId={currentShift?.id}
          onComplete={handlePaymentComplete}
          onClose={() => setShowPayment(false)}
        />
      )}

      {showReceipt && (
        <ReceiptModal
          invoiceNumber={lastInvoice}
          change={lastChange}
          total={lastTotal}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {showHeldBills && (
        <HeldBillsDrawer
          bills={cart.heldBills}
          onRecall={id => { cart.recallBill(id); setShowHeldBills(false); }}
          onRemove={id => cart.removeHeldBill(id)}
          onClose={() => setShowHeldBills(false)}
        />
      )}

      {showDiscount && (
        <DiscountModal
          onApply={(type, value) => { cart.setCartDiscount(type, value); setShowDiscount(false); }}
          onClose={() => setShowDiscount(false)}
        />
      )}

      {showCustomerSearch && (
        <CustomerSearchModal
          onSelect={(id, name) => { cart.setCustomer(id, name); setShowCustomerSearch(false); }}
          onClose={() => setShowCustomerSearch(false)}
        />
      )}
    </div>
  );
}
