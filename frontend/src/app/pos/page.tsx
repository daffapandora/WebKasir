'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { useOfflineSyncStore } from '@/stores/offlineSyncStore';
import { useCashierWebSocket } from '@/hooks/useWebSocket';
import { ItemSearch } from '@/components/ItemSearch';
import { OrderPanel, TotalDisplay, PaymentMethodSelector } from '@/components/OrderPanel';
import { PaymentProcessor } from '@/components/PaymentProcessor';

type ViewState = 'browsing' | 'payment' | 'receipt' | 'error';

interface ReceiptData {
  transactionId: string;
  orderNumber: string;
  totalAmount: number;
  timestamp: Date;
  paymentMethod: string;
}

/**
 * Cashier Page - Main POS terminal interface
 * Handles product search, cart management, checkout, and receipt printing
 */
export default function CashierPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>('browsing');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'CARD' | 'QRIS' | 'MIXED'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const {
    items,
    totalAmount,
    subtotal,
    discountAmount,
    taxAmount,
    addItem,
    clear,
  } = useCartStore();

  const { isOnline, pendingTransactions } = useOfflineSyncStore();
  const { connected: wsConnected } = useCashierWebSocket(
    parseInt(localStorage.getItem('outlet_id') || '1')
  );

  // Handle product selection
  const handleSelectProduct = async (product: any) => {
    addItem({
      id: `${Date.now()}-${Math.random()}`,
      productId: product.id,
      productVariantId: product.variants?.[0]?.id,
      name: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: product.base_price,
      discount: 0,
      image: product.image_url,
    });
  };

  // Handle payment success
  const handlePaymentSuccess = async (transactionId: string) => {
    setIsProcessing(false);
    setReceiptData({
      transactionId,
      orderNumber: `ORD-${Date.now()}`,
      totalAmount,
      timestamp: new Date(),
      paymentMethod: selectedPaymentMethod,
    });
    setView('receipt');

    // Print receipt automatically
    setTimeout(() => {
      window.print();
    }, 500);

    // Clear cart
    clear();
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setIsProcessing(false);
    setErrorMessage(error);
    setView('error');
  };

  // Handle new transaction from WebSocket
  useEffect(() => {
    const handleNewTransaction = (event: CustomEvent) => {
      console.log('New transaction received:', event.detail);
      // Could show notification or update stats
    };

    window.addEventListener('transaction:created', handleNewTransaction as EventListener);
    return () => window.removeEventListener('transaction:created', handleNewTransaction as EventListener);
  }, []);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">KasirPro Terminal</h1>
          <p className="text-sm opacity-90">Outlet {localStorage.getItem('outlet_name')}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicators */}
          <div className="flex gap-3 text-sm">
            <div className={`flex items-center gap-1 px-3 py-1 rounded ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
              <span className="text-lg">📡</span>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded ${wsConnected ? 'bg-green-500' : 'bg-yellow-500'}`}>
              <span>🔌</span>
              {wsConnected ? 'Connected' : 'Connecting'}
            </div>
            {pendingTransactions > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-orange-500 rounded">
                <span>⏳</span>
                {pendingTransactions} pending
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/login')}
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        {/* Left: Search & Order Panel */}
        <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col gap-4 p-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Search Products</h2>
            <ItemSearch
              onSelectProduct={handleSelectProduct}
              disabled={view !== 'browsing'}
            />
          </div>

          <div className="flex-1 min-h-0">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Order Items</h2>
            <OrderPanel />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Totals</h2>
            <TotalDisplay />
          </div>
        </div>

        {/* Right: Payment Section */}
        <div className="w-96 bg-white rounded-lg shadow-md flex flex-col p-4">
          {view === 'browsing' && (
            <>
              {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <p>No items selected</p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>

                  <PaymentMethodSelector
                    selectedMethod={selectedPaymentMethod}
                    onSelectMethod={setSelectedPaymentMethod}
                    disabled={isProcessing}
                  />

                  <button
                    onClick={() => setView('payment')}
                    disabled={isProcessing}
                    className="w-full mt-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
                  >
                    {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                  </button>

                  <button
                    onClick={() => clear()}
                    disabled={isProcessing}
                    className="w-full mt-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
                  >
                    Clear Cart
                  </button>
                </>
              )}
            </>
          )}

          {view === 'payment' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Confirm Payment</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">Rp {totalAmount.toLocaleString()}</p>
              </div>

              <div className="flex-1 min-h-0 mb-4 overflow-y-auto">
                <PaymentProcessor
                  totalAmount={totalAmount}
                  paymentMethod={selectedPaymentMethod}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  isProcessing={isProcessing}
                />
              </div>

              <button
                onClick={() => setView('browsing')}
                disabled={isProcessing}
                className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold py-2 rounded-lg transition"
              >
                Back
              </button>
            </>
          )}

          {view === 'receipt' && receiptData && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful</h2>
              <p className="text-gray-600">Order: {receiptData.orderNumber}</p>
              <p className="text-sm text-gray-500 mb-4">
                {receiptData.timestamp.toLocaleTimeString()}
              </p>

              <button
                onClick={() => {
                  setView('browsing');
                  setReceiptData(null);
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition mt-4"
              >
                New Transaction
              </button>
            </div>
          )}

          {view === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">✕</div>
              <h2 className="text-lg font-bold text-red-600 mb-2">Payment Failed</h2>
              <p className="text-gray-600 text-sm mb-4">{errorMessage}</p>

              <button
                onClick={() => {
                  setView('browsing');
                  setErrorMessage('');
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 px-6 py-3 text-sm flex justify-between">
        <div>KasirPro v1.0</div>
        <div>
          {isOnline ? (
            <span className="text-green-400">✓ All systems operational</span>
          ) : (
            <span className="text-yellow-400">⚠ Offline mode - changes will sync when online</span>
          )}
        </div>
      </footer>
    </div>
  );
}
