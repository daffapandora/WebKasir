/* ═══════════════════════════════════════════════════
   Cart Store — Zustand
   Full POS cart management with tax, discount, hold
   ═══════════════════════════════════════════════════ */

import { create } from 'zustand';
import type { CartItem, HeldBill, PaymentMethod, Payment, Product } from '@/types';
import { generateId, generateInvoiceNumber } from '@/lib/utils';
import { MOCK_TAX_CONFIGS } from '@/lib/mock-data';

interface CartStore {
  items: CartItem[];
  customerId: number | null;
  customerName: string;
  cartDiscount: { type: 'fixed' | 'percentage' | 'none'; value: number };
  notes: string;
  heldBills: HeldBill[];

  // Computed
  subtotal: number;
  itemDiscountTotal: number;
  cartDiscountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;

  // Actions
  addItem: (product: Product) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number, maxStock?: number) => void;
  incrementQuantity: (itemId: string, maxStock?: number) => void;
  decrementQuantity: (itemId: string) => void;
  setItemDiscount: (itemId: string, type: 'fixed' | 'percentage', value: number) => void;
  setCartDiscount: (type: 'fixed' | 'percentage' | 'none', value: number) => void;
  setCustomer: (id: number | null, name: string) => void;
  setNotes: (notes: string) => void;
  setItemNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;

  // Hold bill
  holdBill: () => void;
  recallBill: (billId: string) => void;
  removeHeldBill: (billId: string) => void;

  // Checkout
  processPayment: (payments: Payment[]) => { success: boolean; invoiceNumber: string; change: number };

  // Recalculate
  recalculate: () => void;
}

function calculateTotals(items: CartItem[], cartDiscount: { type: string; value: number }) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemDiscountTotal = items.reduce((sum, item) => sum + item.discount_amount, 0);

  let cartDiscountAmount = 0;
  if (cartDiscount.type === 'fixed') {
    cartDiscountAmount = cartDiscount.value;
  } else if (cartDiscount.type === 'percentage') {
    cartDiscountAmount = Math.floor(subtotal * (cartDiscount.value / 100));
  }

  const afterDiscount = subtotal - itemDiscountTotal - cartDiscountAmount;

  // Apply active taxes
  const activeTaxes = MOCK_TAX_CONFIGS.filter(t => t.is_active);
  let taxAmount = 0;
  for (const tax of activeTaxes) {
    if (tax.type === 'vat' || tax.type === 'restaurant') {
      taxAmount += Math.floor(afterDiscount * (tax.rate / 100));
    }
  }

  let serviceCharge = 0;
  const serviceConfig = activeTaxes.find(t => t.type === 'service');
  if (serviceConfig) {
    serviceCharge = Math.floor(afterDiscount * (serviceConfig.rate / 100));
  }

  const total = afterDiscount + taxAmount + serviceCharge;

  return { subtotal, itemDiscountTotal, cartDiscountAmount, taxAmount, serviceCharge, total };
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  customerId: null,
  customerName: '',
  cartDiscount: { type: 'none' as const, value: 0 },
  notes: '',
  heldBills: [],
  subtotal: 0,
  itemDiscountTotal: 0,
  cartDiscountAmount: 0,
  taxAmount: 0,
  serviceCharge: 0,
  total: 0,

  addItem: (product: Product) => {
    if (!product || !product.is_active) return;

    set(state => {
      const existing = state.items.find(i => i.product_id === product.id);
      let newItems: CartItem[];

      if (existing) {
        if (product.stock !== undefined && existing.quantity >= product.stock && !product.use_recipe) return state;
        newItems = state.items.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price - i.discount_amount }
            : i
        );
      } else {
        const newItem: CartItem = {
          id: generateId(),
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.sale_price,
          cost_price: product.cost_price,
          quantity: 1,
          discount_amount: 0,
          discount_type: 'none',
          discount_value: 0,
          subtotal: product.sale_price,
        };
        newItems = [...state.items, newItem];
      }

      const totals = calculateTotals(newItems, state.cartDiscount);
      return { items: newItems, ...totals };
    });
  },

  removeItem: (itemId: string) => {
    set(state => {
      const newItems = state.items.filter(i => i.id !== itemId);
      const totals = calculateTotals(newItems, state.cartDiscount);
      return { items: newItems, ...totals };
    });
  },

  updateQuantity: (itemId: string, quantity: number, maxStock?: number) => {
    if (quantity < 1) return;
    set(state => {
      const item = state.items.find(i => i.id === itemId);
      if (!item) return state;

      if (maxStock !== undefined && quantity > maxStock) return state;

      const newItems = state.items.map(i =>
        i.id === itemId
          ? { ...i, quantity, subtotal: quantity * i.price - i.discount_amount }
          : i
      );
      const totals = calculateTotals(newItems, state.cartDiscount);
      return { items: newItems, ...totals };
    });
  },

  incrementQuantity: (itemId: string, maxStock?: number) => {
    const item = get().items.find(i => i.id === itemId);
    if (item) get().updateQuantity(itemId, item.quantity + 1, maxStock);
  },

  decrementQuantity: (itemId: string) => {
    const item = get().items.find(i => i.id === itemId);
    if (item) {
      if (item.quantity <= 1) {
        get().removeItem(itemId);
      } else {
        get().updateQuantity(itemId, item.quantity - 1);
      }
    }
  },

  setItemDiscount: (itemId: string, type: 'fixed' | 'percentage', value: number) => {
    set(state => {
      const newItems = state.items.map(i => {
        if (i.id !== itemId) return i;
        let discountAmount = 0;
        if (type === 'fixed') discountAmount = value;
        else if (type === 'percentage') discountAmount = Math.floor(i.price * i.quantity * (value / 100));
        return {
          ...i,
          discount_type: type,
          discount_value: value,
          discount_amount: discountAmount,
          subtotal: i.price * i.quantity - discountAmount,
        };
      });
      const totals = calculateTotals(newItems, state.cartDiscount);
      return { items: newItems, ...totals };
    });
  },

  setCartDiscount: (type: 'fixed' | 'percentage' | 'none', value: number) => {
    set(state => {
      const newDiscount = { type, value };
      const totals = calculateTotals(state.items, newDiscount);
      return { cartDiscount: newDiscount, ...totals };
    });
  },

  setCustomer: (id: number | null, name: string) => {
    set({ customerId: id, customerName: name });
  },

  setNotes: (notes: string) => {
    set({ notes });
  },

  setItemNotes: (itemId: string, notes: string) => {
    set(state => ({
      items: state.items.map(i => i.id === itemId ? { ...i, notes } : i)
    }));
  },

  clearCart: () => {
    set({
      items: [],
      customerId: null,
      customerName: '',
      cartDiscount: { type: 'none', value: 0 },
      notes: '',
      subtotal: 0,
      itemDiscountTotal: 0,
      cartDiscountAmount: 0,
      taxAmount: 0,
      serviceCharge: 0,
      total: 0,
    });
  },

  holdBill: () => {
    const state = get();
    if (state.items.length === 0) return;

    const bill: HeldBill = {
      id: generateId(),
      items: [...state.items],
      subtotal: state.subtotal,
      customer_name: state.customerName || undefined,
      notes: state.notes || undefined,
      held_at: new Date().toISOString(),
    };

    set(state => ({
      heldBills: [...state.heldBills, bill],
    }));
    get().clearCart();
  },

  recallBill: (billId: string) => {
    const state = get();
    const bill = state.heldBills.find(b => b.id === billId);
    if (!bill) return;

    // If current cart has items, hold them first
    if (state.items.length > 0) {
      get().holdBill();
    }

    set(s => {
      const totals = calculateTotals(bill.items, { type: 'none', value: 0 });
      return {
        items: bill.items,
        customerName: bill.customer_name || '',
        notes: bill.notes || '',
        heldBills: s.heldBills.filter(b => b.id !== billId),
        cartDiscount: { type: 'none' as const, value: 0 },
        ...totals,
      };
    });
  },

  removeHeldBill: (billId: string) => {
    set(state => ({
      heldBills: state.heldBills.filter(b => b.id !== billId),
    }));
  },

  processPayment: (payments: Payment[]) => {
    const state = get();
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const change = Math.max(0, totalPaid - state.total);
    const invoiceNumber = generateInvoiceNumber();

    // In production, this would POST to Laravel API
    // For now, clear cart and return success
    get().clearCart();

    return { success: true, invoiceNumber, change };
  },

  recalculate: () => {
    set(state => {
      const totals = calculateTotals(state.items, state.cartDiscount);
      return totals;
    });
  },
}));
