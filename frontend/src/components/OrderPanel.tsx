import React, { useMemo } from 'react';
import { useCartStore } from '@/stores/cartStore';

/**
 * OrderPanel Component - Displays cart items with quantity controls
 * Shows item details, prices, and allows modifications
 */
export const OrderPanel: React.FC = () => {
  const {
    items,
    removeItem,
    incrementQuantity,
    decrementQuantity,
    updateItem,
  } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-2xl mb-2">🛒</p>
          <p>No items in order</p>
          <p className="text-sm">Scan a product or search to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
          >
            {/* Item Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-xs text-gray-600">SKU: {item.sku}</p>
                {item.notes && (
                  <p className="text-xs text-blue-600 mt-1 italic">Note: {item.notes}</p>
                )}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 rounded flex items-center justify-center transition"
                title="Remove item"
              >
                ✕
              </button>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => decrementQuantity(item.id)}
                className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded flex items-center justify-center transition font-bold"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(item.id, {
                    quantity: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-12 text-center border border-gray-300 rounded py-1"
              />
              <button
                onClick={() => incrementQuantity(item.id)}
                className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded flex items-center justify-center transition font-bold"
              >
                +
              </button>
              <span className="text-sm text-gray-600 ml-auto">
                @ Rp {item.unitPrice.toLocaleString()} each
              </span>
            </div>

            {/* Discount Input */}
            {item.discount > 0 && (
              <div className="text-xs text-orange-600 mb-1">
                Discount: Rp {item.discount.toLocaleString()}
              </div>
            )}

            {/* Price Summary */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                {item.quantity} × Rp {item.unitPrice.toLocaleString()}
              </span>
              <span className="font-bold text-lg text-blue-600">
                Rp {(item.quantity * item.unitPrice - item.discount).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * TotalDisplay Component - Shows cart totals and payment summary
 */
export const TotalDisplay: React.FC = () => {
  const {
    items,
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
  } = useCartStore();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-gray-50 border-t-2 border-gray-300 p-4 space-y-3">
      {/* Item Count */}
      <div className="text-sm text-gray-600">
        Items: <span className="font-bold">{itemCount}</span>
      </div>

      {/* Subtotal */}
      <div className="flex justify-between text-gray-700">
        <span>Subtotal</span>
        <span>Rp {subtotal.toLocaleString()}</span>
      </div>

      {/* Discount */}
      {discountAmount > 0 && (
        <div className="flex justify-between text-orange-600">
          <span>Discount</span>
          <span className="font-semibold">- Rp {discountAmount.toLocaleString()}</span>
        </div>
      )}

      {/* Tax */}
      <div className="flex justify-between text-gray-700">
        <span>Tax (10%)</span>
        <span>Rp {taxAmount.toLocaleString()}</span>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
        <span className="text-lg font-bold text-gray-900">Total</span>
        <span className="text-3xl font-bold text-green-600">
          Rp {totalAmount.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

/**
 * PaymentMethodSelector Component - Choose payment method
 */
export interface PaymentMethodSelectorProps {
  onSelectMethod: (method: 'CASH' | 'CARD' | 'QRIS' | 'MIXED') => void;
  disabled?: boolean;
  selectedMethod?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onSelectMethod,
  disabled = false,
  selectedMethod,
}) => {
  const methods = [
    { id: 'CASH', label: 'Cash', icon: '💵', color: 'bg-green-500' },
    { id: 'CARD', label: 'Card', icon: '💳', color: 'bg-blue-500' },
    { id: 'QRIS', label: 'QRIS', icon: '📱', color: 'bg-purple-500' },
    { id: 'MIXED', label: 'Mixed', icon: '🔀', color: 'bg-orange-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelectMethod(method.id as any)}
          disabled={disabled}
          className={`py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            selectedMethod === method.id
              ? `${method.color} text-white scale-105`
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="text-xl">{method.icon}</span>
          {method.label}
        </button>
      ))}
    </div>
  );
};
