// Simple Service Worker without ES6 modules
// This works in all browsers that support Service Workers

// Install event
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
});

// Handle cache clear messages
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(function() {
        // Send success response
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Basic fetch handler - pass through all requests
self.addEventListener('fetch', function(event) {
  // Just pass through the request without caching
  event.respondWith(fetch(event.request));
});