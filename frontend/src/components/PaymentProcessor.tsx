import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useCartStore } from '@/stores/cartStore';

interface PaymentProcessorProps {
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'QRIS' | 'MIXED';
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
  isProcessing?: boolean;
}

/**
 * PaymentProcessor Component - Handles different payment methods
 * Supports cash, card (EDC), QRIS, and mixed payments
 */
export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  totalAmount,
  paymentMethod,
  onPaymentSuccess,
  onPaymentError,
  isProcessing = false,
}) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [qrisAmount, setQrisAmount] = useState<number>(0);
  const [edcStatus, setEdcStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [qrisTimeout, setQrisTimeout] = useState<NodeJS.Timeout>();

  // Generate QRIS code
  useEffect(() => {
    if (paymentMethod === 'QRIS') {
      generateQRIS();
    }
  }, [paymentMethod, totalAmount]);

  const generateQRIS = async () => {
    try {
      // Generate QRIS merchant code format
      const qrisData = `00020126360014id.co.bri.brivapak500110502128${totalAmount}5303360${totalAmount}5802ID5913KASIR_STORE6009JAKARTA63041234`;

      const dataUrl = await QRCode.toDataURL(qrisData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 300,
      });

      setQrCode(dataUrl);

      // Auto-timeout QRIS after 5 minutes
      const timeout = setTimeout(() => {
        onPaymentError('QRIS payment timeout');
      }, 5 * 60 * 1000);

      setQrisTimeout(timeout);
    } catch (error) {
      console.error('Failed to generate QRIS:', error);
      onPaymentError('Failed to generate QR code');
    }
  };

  const handleCashPayment = async () => {
    if (cashAmount < totalAmount) {
      onPaymentError(`Insufficient cash. Need Rp ${totalAmount}, received Rp ${cashAmount}`);
      return;
    }

    try {
      const change = cashAmount - totalAmount;
      const transactionData = {
        outlet_id: localStorage.getItem('outlet_id'),
        shift_id: localStorage.getItem('shift_id'),
        payment_method: 'CASH',
        items: useCartStore.getState().items,
        discounts: useCartStore.getState().discounts,
        payment_details: {
          cash_received: cashAmount,
          change: change,
        },
      };

      const response = await fetch('/api/v1/cashier/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        const { data } = await response.json();
        onPaymentSuccess(data.id);
      } else {
        const error = await response.json();
        onPaymentError(error.message || 'Payment failed');
      }
    } catch (error: any) {
      onPaymentError(error.message);
    }
  };

  const handleCardPayment = async () => {
    setEdcStatus('processing');

    try {
      // Call backend to initiate EDC transaction
      const response = await fetch('/api/v1/cashier/edc/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          amount: cardAmount || totalAmount,
          reference_number: `${Date.now()}`,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setEdcStatus('success');
        onPaymentSuccess(data.transaction_id);
      } else {
        setEdcStatus('error');
        onPaymentError('EDC payment failed');
      }
    } catch (error: any) {
      setEdcStatus('error');
      onPaymentError(error.message);
    }
  };

  const handleQRISPayment = () => {
    // QRIS is handled server-side - user scans the QR code
    // We just wait for the payment confirmation webhook
    console.log('Waiting for QRIS payment confirmation...');
  };

  const handleMixedPayment = async () => {
    const totalPaid = cashAmount + cardAmount + qrisAmount;

    if (Math.abs(totalPaid - totalAmount) > 0.01) {
      onPaymentError(
        `Payment mismatch. Total: Rp ${totalAmount}, Paid: Rp ${totalPaid}`
      );
      return;
    }

    try {
      const transactionData = {
        outlet_id: localStorage.getItem('outlet_id'),
        shift_id: localStorage.getItem('shift_id'),
        payment_method: 'MIXED',
        items: useCartStore.getState().items,
        discounts: useCartStore.getState().discounts,
        payment_details: {
          cash_amount: cashAmount,
          card_amount: cardAmount,
          qris_amount: qrisAmount,
        },
      };

      const response = await fetch('/api/v1/cashier/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        const { data } = await response.json();
        onPaymentSuccess(data.id);
      } else {
        onPaymentError('Payment failed');
      }
    } catch (error: any) {
      onPaymentError(error.message);
    }
  };

  return (
    <div className="space-y-4">
      {paymentMethod === 'CASH' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount Received
            </label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              placeholder="0"
              disabled={isProcessing}
            />
          </div>

          {cashAmount >= totalAmount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">Change</p>
              <p className="text-2xl font-bold text-green-600">
                Rp {(cashAmount - totalAmount).toLocaleString()}
              </p>
            </div>
          )}

          <button
            onClick={handleCashPayment}
            disabled={cashAmount < totalAmount || isProcessing}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
          >
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      )}

      {paymentMethod === 'CARD' && (
        <div className="space-y-3">
          {edcStatus === 'idle' || edcStatus === 'error' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Amount
                </label>
                <input
                  type="number"
                  value={cardAmount || totalAmount}
                  onChange={(e) => setCardAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={isProcessing}
                />
              </div>

              {edcStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  EDC payment failed. Please try again or use another method.
                </div>
              )}

              <button
                onClick={handleCardPayment}
                disabled={isProcessing}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
              >
                {isProcessing ? 'Processing...' : 'Charge Card (EDC)'}
              </button>
            </>
          ) : edcStatus === 'processing' ? (
            <div className="text-center py-4">
              <div className="animate-spin text-4xl mb-2">⌛</div>
              <p className="text-gray-600">Waiting for card response...</p>
              <p className="text-sm text-gray-500 mt-2">Please insert/tap card on EDC machine</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-600 font-bold">✓ Payment Approved</p>
            </div>
          )}
        </div>
      )}

      {paymentMethod === 'QRIS' && (
        <div className="space-y-3 text-center">
          {qrCode && (
            <div className="bg-white border border-gray-300 rounded-lg p-4 inline-block">
              <img src={qrCode} alt="QRIS Payment" className="w-64 h-64" />
            </div>
          )}
          <p className="text-gray-600">Amount: Rp {totalAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Customer scan to pay</p>
          <button
            onClick={handleQRISPayment}
            disabled={isProcessing || !qrCode}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
          >
            {isProcessing ? 'Waiting for payment...' : 'Waiting for QRIS scan'}
          </button>
        </div>
      )}

      {paymentMethod === 'MIXED' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Cash
            </label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              placeholder="0"
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Card
            </label>
            <input
              type="number"
              value={cardAmount}
              onChange={(e) => setCardAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              placeholder="0"
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              QRIS
            </label>
            <input
              type="number"
              value={qrisAmount}
              onChange={(e) => setQrisAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              placeholder="0"
              disabled={isProcessing}
            />
          </div>

          <div className="bg-gray-100 rounded p-2">
            <p className="text-xs text-gray-600">Total Required</p>
            <p className="font-bold">Rp {totalAmount.toLocaleString()}</p>
            <p className={`text-xs font-semibold ${
              cashAmount + cardAmount + qrisAmount === totalAmount
                ? 'text-green-600'
                : 'text-orange-600'
            }`}>
              Provided: Rp {(cashAmount + cardAmount + qrisAmount).toLocaleString()}
            </p>
          </div>

          <button
            onClick={handleMixedPayment}
            disabled={cashAmount + cardAmount + qrisAmount !== totalAmount || isProcessing}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </button>
        </div>
      )}
    </div>
  );
};
