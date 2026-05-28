import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: number;
  productVariantId?: number;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  notes?: string;
  image?: string;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  customerId?: number;
  discounts: Array<{ type: 'PERCENTAGE' | 'FIXED'; value: number; code?: string }>;
}

interface CartActions {
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<CartItem>) => void;
  incrementQuantity: (itemId: string) => void;
  decrementQuantity: (itemId: string) => void;
  applyDiscount: (type: 'PERCENTAGE' | 'FIXED', value: number, code?: string) => void;
  removeDiscount: (index: number) => void;
  setCustomer: (name: string, phone: string, id?: number) => void;
  clear: () => void;
  calculateTotals: () => void;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  discounts: [],
};

export const useCartStore = create<CartState & CartActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addItem: (item) =>
          set((state) => {
            // Check if item already exists (same product + variant)
            const existingIndex = state.items.findIndex(
              (i) =>
                i.productId === item.productId &&
                i.productVariantId === item.productVariantId
            );

            let newItems: CartItem[];
            if (existingIndex >= 0) {
              // Increment quantity of existing item
              newItems = [...state.items];
              newItems[existingIndex].quantity += item.quantity;
            } else {
              // Add new item with unique ID
              newItems = [...state.items, { ...item, id: `${Date.now()}-${Math.random()}` }];
            }

            // Recalculate totals after adding
            const subtotal = newItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
            const discountAmount = state.discounts.reduce((sum, d) => {
              if (d.type === 'PERCENTAGE') return sum + (subtotal * d.value) / 100;
              return sum + d.value;
            }, 0);
            const taxAmount = (subtotal - discountAmount) * 0.1; // 10% tax
            const totalAmount = subtotal - discountAmount + taxAmount;

            return {
              items: newItems,
              subtotal,
              discountAmount,
              taxAmount,
              totalAmount,
            };
          }),

        removeItem: (itemId) =>
          set((state) => {
            const newItems = state.items.filter((i) => i.id !== itemId);
            const subtotal = newItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
            const discountAmount = state.discounts.reduce((sum, d) => {
              if (d.type === 'PERCENTAGE') return sum + (subtotal * d.value) / 100;
              return sum + d.value;
            }, 0);
            const taxAmount = (subtotal - discountAmount) * 0.1;
            const totalAmount = subtotal - discountAmount + taxAmount;

            return { items: newItems, subtotal, discountAmount, taxAmount, totalAmount };
          }),

        updateItem: (itemId, updates) =>
          set((state) => {
            const newItems = state.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i));
            const subtotal = newItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
            const discountAmount = state.discounts.reduce((sum, d) => {
              if (d.type === 'PERCENTAGE') return sum + (subtotal * d.value) / 100;
              return sum + d.value;
            }, 0);
            const taxAmount = (subtotal - discountAmount) * 0.1;
            const totalAmount = subtotal - discountAmount + taxAmount;

            return { items: newItems, subtotal, discountAmount, taxAmount, totalAmount };
          }),

        incrementQuantity: (itemId) =>
          set((state) => {
            const newItems = state.items.map((i) =>
              i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
            );
            const subtotal = newItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
            const discountAmount = state.discounts.reduce((sum, d) => {
              if (d.type === 'PERCENTAGE') return sum + (subtotal * d.value) / 100;
              return sum + d.value;
            }, 0);
            const taxAmount = (subtotal - discountAmount) * 0.1;
            const totalAmount = subtotal - discountAmount + taxAmount;

            return { items: newItems, subtotal, discountAmount, taxAmount, totalAmount };
          }),

        decrementQuantity: (itemId) =>
          set((state) => {
            const newItems = state.items
              .map((i) => (i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))
              .filter((i) => i.quantity > 0);

            const subtotal = newItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
            const discountAmount = state.discounts.reduce((sum, d) => {
              if (d.type === 'PERCENTAGE') return sum + (subtotal * d.value) / 100;
              return sum + d.value;
            }, 0);
            const taxAmount = (subtotal - discountAmount) * 0.1;
            const totalAmount = subtotal - discountAmount + taxAmount;

            return { items: newItems, subtotal, discountAmount, taxAmount, totalAmount };
          }),

        applyDiscount: (type, value, code) =>
          set((state) => {
            const newDiscounts = [...state.discounts, { type, value, code }];
            const subtotal = state.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
            const discountAmount = newDiscounts.reduce((sum, d) => {
              if (d.type === 'PERCENTAGE') return sum + (subtotal * d.value) / 100;
              return sum + d.value;
            }, 0);
            const taxAmount = (subtotal - discountAmount) * 0.1;
            const totalAmount = subtotal - discountAmount + taxAmount;

            return { discounts: newDiscounts, discountAmount, taxAmount, totalAmount };
          }),

        removeDiscount: (index) =>
          set((state) => {
            const newDiscounts = state.discounts.filter((_, i) => i !== index);
            const subtotal = state.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
            const discountAmount = newDiscounts.reduce((sum, d) => {
              if (d.type === 'PERCENTAGE') return sum + (subtotal * d.value) / 100;
              return sum + d.value;
            }, 0);
            const taxAmount = (subtotal - discountAmount) * 0.1;
            const totalAmount = subtotal - discountAmount + taxAmount;

            return { discounts: newDiscounts, discountAmount, taxAmount, totalAmount };
          }),

        setCustomer: (name, phone, id) =>
          set({
            customerName: name,
            customerPhone: phone,
            customerId: id,
          }),

        clear: () => set(initialState),

        calculateTotals: () =>
          set((state) => {
            const subtotal = state.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
            const discountAmount = state.discounts.reduce((sum, d) => {
              if (d.type === 'PERCENTAGE') return sum + (subtotal * d.value) / 100;
              return sum + d.value;
            }, 0);
            const taxAmount = (subtotal - discountAmount) * 0.1;
            const totalAmount = subtotal - discountAmount + taxAmount;

            return { subtotal, discountAmount, taxAmount, totalAmount };
          }),
      }),
      {
        name: 'cart-store',
        partialize: (state) => ({ items: state.items, customerId: state.customerId }),
      }
    )
  )
);
