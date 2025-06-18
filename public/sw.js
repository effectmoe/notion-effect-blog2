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
precacheAndRoute([{"revision":"22d0b716475e6746ab12cf1324978029","url":"404.png"},{"revision":"6e40a682480dcc09ee2b44f1e3b1be31","url":"analyze-database-differences.js"},{"revision":"24e93c1ceaed5c13333831c10d7a18e8","url":"analyze-grouped-lists.js"},{"revision":"2d2028a4db3725f595c01bfbb08bc781","url":"analyze-prefecture-database.js"},{"revision":"06fec8a0aee0fb5e05cb6b8db6315853","url":"analyze-runtime-recordmap.js"},{"revision":"9638a06841d6788388e11e1075e1109a","url":"cache-monitor.js"},{"revision":"f5fb42df7c07c2b178f74a652d38babd","url":"check-prefecture-rendering.js"},{"revision":"0b3d5e6e0ab4dfe97191857dd28e5d53","url":"client-side-grouping.js"},{"revision":"cd1c0bcd07c2bde320cf4bdca0600a26","url":"compare-database-html.js"},{"revision":"d85a1c649aa35a178cc30f8a556d548e","url":"debug-cafe-kinesi.js"},{"revision":"03353768055384ff06e9f8a41256aad2","url":"debug-collection-views.js"},{"revision":"6d9b2d6847dcc23d97e2689496c9b94d","url":"debug-faq-dom-structure.js"},{"revision":"9b22369df1f5379fde229841e7a0e788","url":"debug-faq-master.js"},{"revision":"b07f3936bff6e4efa64dc1aa9d638ffb","url":"debug-faq-structure.js"},{"revision":"6aa9e81d8d8796b832d162c536fec13f","url":"debug-grouped-lists.js"},{"revision":"1ffecdde9aca4a66fca44cb9960c36b1","url":"diagnose-database-types.js"},{"revision":"aba109c95ab9668b77c830bd9e428459","url":"diagnose-prefecture-success.js"},{"revision":"15feba8a6fbfeef7c44ad1e1d442afb1","url":"ensure-group-structure.js"},{"revision":"e43b3f89f82a7c0a712aadaf6cdc3781","url":"ensure-list-view-for-groups.js"},{"revision":"4fc3227313543502958d98443e3973a7","url":"error.png"},{"revision":"2bad4a6f0080f9b445317af993cb6d72","url":"favicon-128x128.png"},{"revision":"820675e9e2dc369ce2a7f797f2a6ad0f","url":"favicon-192x192.png"},{"revision":"aaa3368a9b5804c3f3cbd6b6f8e17dcc","url":"favicon.ico"},{"revision":"281e0f701e10f4642c1cbe97467c3ea6","url":"favicon.png"},{"revision":"ac59b66b4de4b43d638659b83c76f962","url":"find-cafe-kinesi-id.js"},{"revision":"35080cae7c80731c24ef83729e4d97d3","url":"fix-all-grouped-lists.js"},{"revision":"5cd36f2ac74674da49c1e2654a286c48","url":"fix-database-rendering.js"},{"revision":"ab5f26aa108de6f62d8bd70ea0bbab55","url":"fix-faq-master-dedicated.js"},{"revision":"fdabafd097d8aa0fb65b8775a85891ab","url":"fix-faq-master-final.js"},{"revision":"905f38cbe594971ffddf88a6d1a9993a","url":"fix-grouped-database-rendering.js"},{"revision":"6a9dccba0aed936bb533aea8c8c93f04","url":"fix-grouped-lists.js"},{"revision":"448059d2aafbc41e4793c61d9651a388","url":"fix-linked-database-groups.js"},{"revision":"b20b85841df621de4979a4f8abdcb287","url":"force-list-view.js"},{"revision":"066d12658a90f19ce75da3ab1277c423","url":"force-render-grouped-lists.js"},{"revision":"87b47e4d25e93e0107e96ebb4aad8495","url":"force-toggle-open.js"},{"revision":"9c00a95a99d709b0c7746d776f4168b5","url":"inject-formula-simple.js"},{"revision":"0b7fd7eaba1073a417f4f8b7c1c6f218","url":"investigate-prefecture-special.js"},{"revision":"23ead271c28d44004a53b067f6f03672","url":"offline.html"},{"revision":"f18535a43fb4ad739725242f9ecdac37","url":"patch-faq-master.js"},{"revision":"caf7f62ddc4bc796e3f7e9083013c67b","url":"prefecture-regional-ui.js"},{"revision":"bd44fe7e9e34d4617c676596b162241c","url":"suppress-collection-errors.js"},{"revision":"997da281edf436cbaaca3c53c0476a8d","url":"sw-simple.js"},{"revision":"b400a17ecf7fae94f907bec421ebf483","url":"unified-database-fix-v2.js"},{"revision":"cea56f143fe87651f8c575db21d5fbf3","url":"unified-database-fix.js"},{"revision":"7644692d4d8be5056b9deaf150fb9171","url":"unified-group-fix.js"}] || []);

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