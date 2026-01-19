// client/public/service-worker.js - FIXED VERSION
const CACHE_NAME = 'jobtradesasa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(urlsToCache);
    }).catch((error) => {
      console.error('❌ Cache installation failed:', error);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push notification event - THIS IS THE KEY PART
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received!', event);
  
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'notification',
    url: '/',
  };

  if (event.data) {
    try {
      // Try to parse as JSON
      const data = event.data.json();
      console.log('📬 Push data:', data);
      
      notificationData = {
        title: data.title || 'New Notification',
        body: data.body || data.message || '',
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        tag: data.tag || 'notification',
        url: data.url || '/',
        data: data, // Store all data for click handling
      };
    } catch (e) {
      // If not JSON, use text
      console.log('📬 Push text:', event.data.text());
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: notificationData.url,
      dateOfArrival: Date.now(),
    },
  };

  console.log('📢 Showing notification:', notificationData.title, options);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('✅ Notification shown successfully');
      })
      .catch((error) => {
        console.error('❌ Error showing notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('📌 Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if (client.navigate) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('✕ Notification closed:', event.notification.tag);
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API requests - network first, cache fallback for GET requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful GET responses
          if (event.request.method === 'GET' && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
