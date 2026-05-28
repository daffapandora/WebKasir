// ============================================
// Service Worker — KasirPro POS
// Workbox-based offline-first caching + background sync
// Enhanced with offline transaction queuing
// ============================================

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { precacheAndRoute } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
const { BackgroundSyncPlugin } = workbox.backgroundSync;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

// ---- Precache App Shell ----
precacheAndRoute(self.__WB_MANIFEST || []);

// ---- Runtime Caching Strategies ----

// API calls: Network-first with 5s timeout fallback to cache
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.includes('/sync/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Master data (products): Network-first, cache for 2 hours
registerRoute(
  ({ url }) => url.pathname.includes('/sync/master-data'),
  new NetworkFirst({
    cacheName: 'master-data-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 2 * 60 * 60, // 2 hours
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Sync endpoints: Network-first with background sync fallback
const bgSyncPlugin = new BackgroundSyncPlugin('transaction-sync-queue', {
  maxRetentionTime: 7 * 24 * 60, // 7 days in minutes
  onSync: async ({ queue }) => {
    console.log('[SW] Background sync triggered for transactions');
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request.clone());
        if (!response.ok) {
          console.error('[SW] Sync failed:', response.status);
          await queue.unshiftRequest(entry);
          throw new Error(`HTTP ${response.status}`);
        }
        console.log('[SW] Transaction synced successfully');
      } catch (error) {
        console.error('[SW] Background sync error:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

registerRoute(
  ({ url }) => url.pathname.includes('/sync/transactions'),
  new NetworkFirst({
    cacheName: 'sync-cache',
    networkTimeoutSeconds: 10,
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

// Checkout endpoint: Critical transaction creation
registerRoute(
  ({ url }) => url.pathname.includes('/cashier/transactions') && !url.pathname.includes('/void'),
  new NetworkFirst({
    cacheName: 'transaction-cache',
    networkTimeoutSeconds: 15, // Longer timeout for transaction creation
    plugins: [
      new BackgroundSyncPlugin('checkout-queue', {
        maxRetentionTime: 24 * 60, // 1 day
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200, 201],
      }),
    ],
  }),
  'POST'
);

// Product images: Cache-first (long-lived)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Static assets: Stale-while-revalidate
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Google Fonts: Cache-first
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// ---- Background Sync ----
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  if (event.tag === 'sync-transactions' || event.tag === 'checkout-queue') {
    event.waitUntil(notifyClients('SYNC_TRIGGERED'));
  }
});

// ---- Push Notifications ----
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'KasirPro', {
        body: data.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        data: data.url,
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/pos')
  );
});

// ---- Message Handler (from app to SW) ----
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'SYNC_TRANSACTIONS') {
    console.log('[SW] Manual sync requested');
    event.waitUntil(notifyClients('SYNC_IN_PROGRESS'));
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) =>
        Promise.all(names.map((n) => caches.delete(n)))
      )
    );
  }
});

// ---- Utility ----
async function notifyClients(type) {
  const allClients = await clients.matchAll({ type: 'window' });
  allClients.forEach((client) => {
    client.postMessage({ type });
  });
}

// ---- Install & Activate ----
self.addEventListener('install', () => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => ![
            'api-cache',
            'image-cache',
            'static-cache',
            'google-fonts-cache',
            'sync-cache',
            'transaction-cache',
            'master-data-cache'
          ].includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});
