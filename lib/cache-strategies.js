// キャッシング戦略の定義
export const CACHE_STRATEGIES = {
  // 1. Notion APIレスポンス用
  notionApi: {
    cacheName: 'notion-api-cache',
    strategy: 'NetworkFirst',
    options: {
      networkTimeoutSeconds: 3,
      maxAgeSeconds: 60 * 60, // 1時間
      maxEntries: 100,
      warmupUrls: [
        '/',
        '/api/search-notion',
      ]
    }
  },

  // 2. 静的アセット用
  staticAssets: {
    fonts: {
      cacheName: 'google-fonts-cache',
      strategy: 'CacheFirst',
      options: {
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
        maxEntries: 30
      }
    },
    images: {
      cacheName: 'images-cache',
      strategy: 'CacheFirst',
      options: {
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
        maxEntries: 200,
        purgeOnQuotaError: true
      }
    },
    scripts: {
      cacheName: 'static-resources',
      strategy: 'StaleWhileRevalidate',
      options: {
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
        maxEntries: 60
      }
    }
  },

  // 3. 動的コンテンツ用
  dynamicContent: {
    cacheName: 'api-cache',
    strategy: 'StaleWhileRevalidate',
    options: {
      maxAgeSeconds: 60 * 60 * 24, // 24時間
      maxEntries: 50
    }
  },

  // 4. プリキャッシュ対象
  precache: {
    urls: [
      '/',
      '/offline.html',
      '/manifest.json',
      '/favicon.ico'
    ],
    revision: Date.now() // ビルド時に更新
  }
};

// キャッシュ無効化のタイミング
export const INVALIDATION_TRIGGERS = {
  // Notion content update
  contentUpdate: {
    cacheNames: ['notion-api-cache', 'api-cache'],
    maxAge: 60 * 60 // 1時間
  },
  
  // デプロイ時
  deployment: {
    cacheNames: ['static-resources'],
    clearAll: false
  },
  
  // 手動クリア
  manual: {
    cacheNames: '*',
    clearAll: true
  }
};

// レスポンスヘッダーの設定
export const CACHE_HEADERS = {
  // Notion APIレスポンス
  notionApi: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'max-age=3600',
    'Cloudflare-CDN-Cache-Control': 'max-age=3600'
  },
  
  // 静的アセット
  staticAssets: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'max-age=31536000'
  },
  
  // 動的コンテンツ
  dynamicContent: {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    'CDN-Cache-Control': 'max-age=86400'
  }
};

// キャッシュキーの生成
export function generateCacheKey(url, options = {}) {
  const { includeQuery = true, includeHeaders = false } = options;
  
  let key = url.pathname;
  
  if (includeQuery) {
    const params = new URLSearchParams(url.search);
    // 重要なパラメータのみを含める
    const importantParams = ['pageId', 'search', 'tag'];
    const filteredParams = new URLSearchParams();
    
    for (const param of importantParams) {
      if (params.has(param)) {
        filteredParams.set(param, params.get(param));
      }
    }
    
    if (filteredParams.toString()) {
      key += '?' + filteredParams.toString();
    }
  }
  
  return key;
}

// キャッシュの統計情報取得
export async function getCacheStatistics() {
  if (typeof caches === 'undefined') return null;
  
  const stats = {};
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    
    stats[name] = {
      count: requests.length,
      size: await estimateCacheSize(cache, requests),
      oldestEntry: await getOldestEntry(cache, requests)
    };
  }
  
  return stats;
}

// キャッシュサイズの推定
async function estimateCacheSize(cache, requests) {
  let totalSize = 0;
  
  for (const request of requests.slice(0, 10)) { // サンプリング
    const response = await cache.match(request);
    if (response && response.headers.get('content-length')) {
      totalSize += parseInt(response.headers.get('content-length'), 10);
    }
  }
  
  // サンプルから全体を推定
  return (totalSize / Math.min(10, requests.length)) * requests.length;
}

// 最も古いエントリの取得
async function getOldestEntry(cache, requests) {
  let oldestDate = Date.now();
  
  for (const request of requests.slice(0, 10)) { // サンプリング
    const response = await cache.match(request);
    if (response) {
      const date = new Date(response.headers.get('date') || Date.now());
      if (date < oldestDate) {
        oldestDate = date;
      }
    }
  }
  
  return oldestDate;
}

// キャッシュのクリーンアップ
export async function cleanupCaches(strategy = 'age') {
  if (typeof caches === 'undefined') return;
  
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    
    if (strategy === 'age') {
      // 古いエントリから削除
      const cutoffDate = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7日前
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const date = new Date(response.headers.get('date') || 0);
          if (date < cutoffDate) {
            await cache.delete(request);
          }
        }
      }
    } else if (strategy === 'size') {
      // サイズ制限を超えたら古いものから削除
      const maxSize = 50 * 1024 * 1024; // 50MB
      const currentSize = await estimateCacheSize(cache, requests);
      
      if (currentSize > maxSize) {
        // 最も古い10%を削除
        const toDelete = Math.ceil(requests.length * 0.1);
        for (let i = 0; i < toDelete; i++) {
          await cache.delete(requests[i]);
        }
      }
    }
  }
}

// ブラウザサポートの確認
export function checkCacheSupport() {
  return {
    cacheAPI: 'caches' in self,
    serviceWorker: 'serviceWorker' in navigator,
    backgroundSync: 'sync' in ServiceWorkerRegistration.prototype,
    periodicSync: 'periodicSync' in ServiceWorkerRegistration.prototype
  };
}