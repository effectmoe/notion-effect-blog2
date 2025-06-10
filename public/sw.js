/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Service Workerの即時有効化
clientsClaim();

// プリキャッシュマニフェスト（ビルド時に自動生成）
precacheAndRoute([{"revision":"22d0b716475e6746ab12cf1324978029","url":"404.png"},{"revision":"9638a06841d6788388e11e1075e1109a","url":"cache-monitor.js"},{"revision":"4fc3227313543502958d98443e3973a7","url":"error.png"},{"revision":"2bad4a6f0080f9b445317af993cb6d72","url":"favicon-128x128.png"},{"revision":"820675e9e2dc369ce2a7f797f2a6ad0f","url":"favicon-192x192.png"},{"revision":"aaa3368a9b5804c3f3cbd6b6f8e17dcc","url":"favicon.ico"},{"revision":"281e0f701e10f4642c1cbe97467c3ea6","url":"favicon.png"},{"revision":"87b47e4d25e93e0107e96ebb4aad8495","url":"force-toggle-open.js"},{"revision":"9c00a95a99d709b0c7746d776f4168b5","url":"inject-formula-simple.js"},{"revision":"23ead271c28d44004a53b067f6f03672","url":"offline.html"},{"revision":"caf7f62ddc4bc796e3f7e9083013c67b","url":"prefecture-regional-ui.js"}] || []);

// アプリシェルのルーティング
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') {
      return false;
    }
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }
    return true;
  },
  createHandlerBoundToURL('/index.html')
);

// キャッシング戦略の定義

// 1. NetworkFirst戦略（Notion APIレスポンス用）
registerRoute(
  ({ url }) => url.pathname.includes('/api/notion') || 
               url.hostname.includes('notion.so'),
  new NetworkFirst({
    cacheName: 'notion-api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60, // 1時間
        maxEntries: 100,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 2. CacheFirst戦略（静的アセット用）
// フォント
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
        maxEntries: 30,
      }),
    ],
  })
);

// 画像
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
        maxEntries: 200,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// CSS/JS
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
        maxEntries: 60,
      }),
    ],
  })
);

// 3. StaleWhileRevalidate戦略（動的コンテンツ用）
registerRoute(
  ({ url }) => url.pathname.includes('/api/') &&
               !url.pathname.includes('/api/notion'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24, // 24時間
        maxEntries: 50,
      }),
    ],
  })
);

// オフライン時のフォールバック
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notion-data') {
    event.waitUntil(syncNotionData());
  }
});

async function syncNotionData() {
  try {
    const cache = await caches.open('notion-api-cache');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
      }
    }
    
    // 更新完了を通知
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_UPDATED',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Service Workerの更新処理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// キャッシュの統計情報
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

// キャッシュのクリーンアップ
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    const stats = await getCacheStats();
    event.ports[0].postMessage(stats);
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    event.ports[0].postMessage({ success: true });
  }
});