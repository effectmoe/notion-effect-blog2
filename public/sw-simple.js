/// <reference lib="webworker" />

// 簡易的なService Worker実装
const CACHE_NAMES = {
  static: 'static-cache-v1',
  dynamic: 'dynamic-cache-v1',
  notion: 'notion-api-cache-v1'
};

const STATIC_ASSETS = [
  '/offline.html',
  '/404.png',
  '/error.png',
  '/favicon.ico'
];

// インストールイベント
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // 即座にアクティブ化
  self.skipWaiting();
});

// アクティベートイベント
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // すぐにクライアントを制御
  self.clients.claim();
});

// フェッチイベント
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }
  
  // APIリクエストの処理
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功したAPIレスポンスをキャッシュ
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAMES.dynamic).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          return caches.match(request);
        })
    );
    return;
  }
  
  // 静的アセットの処理
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAMES.static).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // HTMLページの処理（ネットワークファースト）
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAMES.dynamic).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match('/offline.html');
          });
        })
    );
  }
});

// プッシュ通知イベント（オプション）
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/favicon-192x192.png',
    badge: '/favicon-128x128.png'
  };
  
  event.waitUntil(
    self.registration.showNotification('Notion Effect Blog', options)
  );
});