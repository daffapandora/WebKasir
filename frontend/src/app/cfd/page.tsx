'use client';

import React, { useState, useEffect } from 'react';
import { useCFDWebSocket } from '@/hooks/useWebSocket';

interface OrderDisplay {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'READY';
  timestamp: Date;
  estimatedTime?: number;
}

/**
 * CFD (Customer Facing Display) - Displays current and upcoming orders
 * Shows order number, call status, and waiting time
 * Real-time updates via WebSocket
 */
export default function CFDPage() {
  const [currentOrder, setCurrentOrder] = useState<OrderDisplay | null>(null);
  const [nextOrders, setNextOrders] = useState<OrderDisplay[]>([]);
  const [queueNumber, setQueueNumber] = useState<number>(0);

  const outletId = parseInt(localStorage.getItem('outlet_id') || '1');
  const { connected } = useCFDWebSocket(outletId);

  // Listen for transaction events
  useEffect(() => {
    const handleTransactionEvent = (event: CustomEvent) => {
      const transaction = event.detail;

      // Add to queue
      const order: OrderDisplay = {
        id: transaction.id,
        orderNumber: transaction.order_number,
        totalAmount: transaction.total_amount,
        status: 'PENDING',
        timestamp: new Date(transaction.created_at),
        estimatedTime: 5, // 5 minutes default
      };

      if (!currentOrder) {
        setCurrentOrder(order);
        setQueueNumber(order.orderNumber.split('-')[1] as any);
      } else {
        setNextOrders((prev) => [...prev, order].slice(0, 5)); // Keep max 5 in queue
      }
    };

    window.addEventListener('display:transaction', handleTransactionEvent as EventListener);
    return () => window.removeEventListener('display:transaction', handleTransactionEvent as EventListener);
  }, [currentOrder]);

  // Update countdown timer
  useEffect(() => {
    if (!currentOrder) return;

    const interval = setInterval(() => {
      setCurrentOrder((prev) => {
        if (!prev || !prev.estimatedTime) return prev;
        return {
          ...prev,
          estimatedTime: Math.max(0, prev.estimatedTime - 1),
        };
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentOrder]);

  // Move to next order when current is done
  const moveToNextOrder = () => {
    if (nextOrders.length > 0) {
      const [next, ...rest] = nextOrders;
      setCurrentOrder({ ...next, status: 'PENDING' });
      setNextOrders(rest);
      setQueueNumber(next.orderNumber.split('-')[1] as any);
    } else {
      setCurrentOrder(null);
      setQueueNumber(0);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Connection Status */}
      <div className="absolute top-4 right-4">
        <div className={`px-4 py-2 rounded-full text-white font-semibold text-sm ${
          connected ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Main Display */}
      <div className="w-full max-w-2xl">
        {currentOrder ? (
          <>
            {/* Current Order - Large Display */}
            <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8 text-center">
              <p className="text-gray-600 text-2xl mb-4">NOW SERVING</p>

              <div className="mb-8">
                <p className="text-gray-700 text-3xl mb-4">Order Number</p>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-8 px-12 inline-block">
                  <p className="text-8xl font-bold tracking-wider">
                    {currentOrder.orderNumber.split('-')[1]}
                  </p>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-gray-600 text-lg mb-2">Total Amount</p>
                  <p className="text-3xl font-bold text-blue-600">
                    Rp {currentOrder.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-lg mb-2">Estimated Time</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {currentOrder.estimatedTime} min
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setCurrentOrder({ ...currentOrder, status: 'READY' });
                  }}
                  className={`px-8 py-4 text-xl font-bold rounded-xl transition ${
                    currentOrder.status === 'READY'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-green-100'
                  }`}
                >
                  ✓ Order Ready
                </button>
                <button
                  onClick={moveToNextOrder}
                  className="px-8 py-4 text-xl font-bold rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Queue Display */}
            {nextOrders.length > 0 && (
              <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-3xl p-8">
                <p className="text-white text-2xl font-bold mb-6 text-center">WAITING</p>
                <div className="grid grid-cols-3 gap-4">
                  {nextOrders.map((order, idx) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl p-6 text-center shadow-lg"
                    >
                      <p className="text-gray-600 text-sm mb-2">Next {idx + 1}</p>
                      <p className="text-4xl font-bold text-blue-600 mb-2">
                        {order.orderNumber.split('-')[1]}
                      </p>
                      <p className="text-gray-700 text-sm">
                        Rp {order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-3xl p-12 text-center">
            <p className="text-white text-5xl font-bold mb-4">No Orders</p>
            <p className="text-white text-xl opacity-80">
              Waiting for new orders...
            </p>
            <div className="mt-8 flex justify-center">
              <div className="animate-pulse">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full mx-auto"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Queue Summary */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center text-white">
        <div>
          <p className="text-sm opacity-75">Queue Position</p>
          <p className="text-3xl font-bold">{nextOrders.length + (currentOrder ? 1 : 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-75">Last Updated</p>
          <p className="text-lg">{new Date().toLocaleTimeString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-75">Outlet</p>
          <p className="text-lg">{localStorage.getItem('outlet_name')}</p>
        </div>
      </div>
    </div>
  );
}
