import { useEffect, useRef, useCallback } from 'react';
import { useOfflineSyncStore } from '@/stores/offlineSyncStore';

/**
 * useWebSocket - WebSocket connection hook for real-time updates
 * Automatically reconnects on disconnect with exponential backoff
 */
export function useWebSocket(
  url: string,
  onMessage: (data: any) => void,
  channel?: string
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseDelay = 1000;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('[WebSocket] Connected');
        reconnectAttemptsRef.current = 0;

        // Subscribe to channel if provided
        if (channel) {
          wsRef.current?.send(
            JSON.stringify({
              type: 'subscribe',
              channel,
            })
          );
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        reconnect();
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      reconnect();
    }
  }, [url, channel, onMessage]);

  const reconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnection attempts reached');
      return;
    }

    const delay = baseDelay * Math.pow(2, reconnectAttemptsRef.current);
    reconnectAttemptsRef.current++;

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

    reconnectTimeoutRef.current = window.setTimeout(connect, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ws: wsRef.current,
    connected: wsRef.current?.readyState === WebSocket.OPEN,
    send: (data: any) => wsRef.current?.send(JSON.stringify(data)),
  };
}

/**
 * useCashierWebSocket - Specialized hook for cashier terminal updates
 * Listens for new transactions, inventory changes, and void notifications
 */
export function useCashierWebSocket(outletId: number) {
  const { isOnline, setSyncError } = useOfflineSyncStore();
  const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;

  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'transaction.created':
        console.log('[CFD] New transaction:', data.data);
        // Broadcast to React Query or Zustand for UI update
        window.dispatchEvent(
          new CustomEvent('transaction:created', { detail: data.data })
        );
        break;

      case 'inventory.updated':
        console.log('[CFD] Inventory updated:', data.data);
        window.dispatchEvent(
          new CustomEvent('inventory:updated', { detail: data.data })
        );
        break;

      case 'transaction.voided':
        console.log('[CFD] Transaction voided:', data.data);
        window.dispatchEvent(
          new CustomEvent('transaction:voided', { detail: data.data })
        );
        break;

      default:
        console.log('[CFD] Unknown message type:', data.type);
    }
  }, []);

  const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}/broadcasting/auth?token=${accessToken}`;
  const { ws, connected } = useWebSocket(
    wsUrl,
    handleMessage,
    `outlet.${outletId}`
  );

  return { ws, connected, isOnline };
}

/**
 * useCFDWebSocket - Specialized hook for customer-facing display
 * Shows current order, queue status, and call numbers
 */
export function useCFDWebSocket(outletId: number) {
  const { isOnline } = useOfflineSyncStore();
  const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'transaction.created') {
      console.log('[Display] Order for display:', data.data);
      window.dispatchEvent(
        new CustomEvent('display:transaction', { detail: data.data })
      );
    }
  }, []);

  const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}/broadcasting/auth?token=${accessToken}`;
  const { ws, connected } = useWebSocket(
    wsUrl,
    handleMessage,
    `cfd.${outletId}`
  );

  return { ws, connected, isOnline };
}

/**
 * useOfflineSync - Manage offline-to-online sync with automatic retry
 * Watches network status and syncs when connection is restored
 */
export function useOfflineSync(tenantId: number) {
  const { isOnline, isSyncing, pendingTransactions, retryFailedSync } = useOfflineSyncStore();
  const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  const syncTimeoutRef = useRef<number>();

  useEffect(() => {
    if (!isOnline || !accessToken) {
      return;
    }

    // Debounce sync to prevent too many requests
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      retryFailedSync(accessToken);
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, accessToken, retryFailedSync]);

  return {
    isOnline,
    isSyncing,
    pendingTransactions,
    needsSync: pendingTransactions > 0 && isOnline,
  };
}
