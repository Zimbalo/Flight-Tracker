const CACHE_NAME = 'skytracker-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/lucide/0.263.1/umd/lucide.js'
];

// Install event - caching resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache resources one by one to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.log('Failed to cache:', url, err))
          )
        );
      })
      .catch((error) => {
        console.error('Failed to open cache:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Add to cache for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache GET requests
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        });
      })
      .catch((error) => {
        console.error('Fetch failed:', error);
        
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
        
        throw error;
      })
  );
});

// Background sync for offline flight searches
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'flight-search-sync') {
    event.waitUntil(
      // Handle offline flight searches when back online
      handleOfflineFlightSearches()
    );
  }
});

async function handleOfflineFlightSearches() {
  try {
    // Get pending searches from IndexedDB (if implemented)
    console.log('Processing offline flight search requests...');
    
    // This would sync any offline flight search requests
    // when the app comes back online
    
  } catch (error) {
    console.error('Failed to sync offline searches:', error);
  }
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('Push notification received:', data);
    
    const options = {
      body: data.body || 'Aggiornamento volo disponibile',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'flight-update',
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'view',
          title: 'Visualizza',
          icon: '/icon-96x96.png'
        },
        {
          action: 'dismiss',
          title: 'Ignora'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'SkyTracker', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('SkyTracker Service Worker loaded successfully!');