// Simple Service Worker without ES modules
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Cache strategies
const CACHE_NAMES = {
  static: 'static-v1',
  dynamic: 'dynamic-v1',
  notion: 'notion-api-v1'
};

// Notion API caching - Network First
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Notion API requests
  if (url.pathname.includes('/api/notion') || url.hostname.includes('notion.so')) {
    event.respondWith(
      networkFirst(request, CACHE_NAMES.notion, 60 * 60) // 1 hour
    );
    return;
  }

  // Static assets - Cache First
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(
      cacheFirst(request, CACHE_NAMES.static, 30 * 24 * 60 * 60) // 30 days
    );
    return;
  }

  // Dynamic content - Stale While Revalidate
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      staleWhileRevalidate(request, CACHE_NAMES.dynamic, 24 * 60 * 60) // 24 hours
    );
    return;
  }

  // Default - Network First
  event.respondWith(
    networkFirst(request, CACHE_NAMES.dynamic, 60 * 60) // 1 hour
  );
});

// Network First strategy
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response && response.status === 200) {
        caches.open(cacheName).then(cache => {
          cache.put(request, response);
        });
      }
    });
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Network error', { status: 408 });
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response && response.status === 200) {
      caches.open(cacheName).then(cache => {
        cache.put(request, response.clone());
      });
    }
    return response;
  });

  return cachedResponse || fetchPromise;
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    stats[name] = {
      count: requests.length,
      urls: requests.map(r => r.url)
    };
  }
  
  return stats;
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  const cacheWhitelist = Object.values(CACHE_NAMES);
  const cacheNames = await caches.keys();
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (!cacheWhitelist.includes(cacheName)) {
        return caches.delete(cacheName);
      }
    })
  );
}