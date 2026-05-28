// ============================================
// KasirPro — Cart Hook
// Client-side cart state management
// ============================================

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { CartItem, CartTotals, ProductVariant, PromoCode } from '../lib/types';

const TAX_RATE = 0.11; // PPN 11%

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);

  /** Add item to cart (or increment if exists) */
  const addItem = useCallback((
    variant: ProductVariant,
    quantity: number = 1,
    productName: string = '',
    imageUrl: string | null = null,
  ) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.variantId === variant.id);

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;

        // Check stock limit
        if (existing.maxStock !== null && newQty > existing.maxStock) {
          return prev; // Don't exceed stock
        }

        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: newQty * existing.unitPrice - existing.discountAmount,
        };
        return updated;
      }

      const newItem: CartItem = {
        variantId: variant.id,
        productId: variant.productId,
        productName,
        variantName: variant.name,
        sku: variant.sku,
        barcode: variant.barcode,
        unitPrice: variant.sellingPrice,
        costPrice: variant.costPrice,
        quantity,
        discountAmount: 0,
        subtotal: quantity * variant.sellingPrice,
        imageUrl,
        maxStock: variant.stock ?? null,
      };

      return [...prev, newItem];
    });
  }, []);

  /** Remove item from cart */
  const removeItem = useCallback((variantId: string) => {
    setItems(prev => prev.filter(item => item.variantId !== variantId));
  }, []);

  /** Update quantity of specific item */
  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.variantId !== variantId));
      return;
    }

    setItems(prev =>
      prev.map(item => {
        if (item.variantId !== variantId) return item;
        // Check stock limit
        const qty = item.maxStock !== null ? Math.min(quantity, item.maxStock) : quantity;
        return {
          ...item,
          quantity: qty,
          subtotal: qty * item.unitPrice - item.discountAmount,
        };
      })
    );
  }, []);

  /** Apply promo code */
  const applyPromo = useCallback((promo: PromoCode | null) => {
    setPromoCode(promo);
  }, []);

  /** Clear entire cart */
  const clearCart = useCallback(() => {
    setItems([]);
    setPromoCode(null);
  }, []);

  /** Computed totals */
  const totals: CartTotals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const itemDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);

    let promoDiscount = 0;
    if (promoCode && subtotal >= promoCode.minPurchase) {
      if (promoCode.discountType === 'percentage') {
        promoDiscount = subtotal * (promoCode.discountValue / 100);
        if (promoCode.maxDiscount) {
          promoDiscount = Math.min(promoDiscount, promoCode.maxDiscount);
        }
      } else {
        promoDiscount = promoCode.discountValue;
      }
    }

    const totalDiscount = itemDiscount + promoDiscount;
    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = Math.round(taxableAmount * TAX_RATE);
    const totalAmount = taxableAmount + taxAmount;

    return {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discountAmount: totalDiscount,
      taxAmount,
      totalAmount,
    };
  }, [items, promoCode]);

  return {
    items,
    promoCode,
    totals,
    addItem,
    removeItem,
    updateQuantity,
    applyPromo,
    clearCart,
  };
}
