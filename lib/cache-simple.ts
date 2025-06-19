/**
 * Simple memory-only cache implementation
 * No Redis dependencies
 */

// メモリキャッシュ
const cache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// キャッシュから取得
export async function getFromCache(key: string): Promise<any | null> {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // 有効期限チェック
  if (Date.now() - entry.timestamp > entry.ttl * 1000) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

// キャッシュに保存
export async function setToCache(key: string, data: any, ttl = 3600): Promise<void> {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
  
  // メモリ制限（500エントリ）
  if (cache.size > 500) {
    // 最も古いエントリを削除
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // 古い100エントリを削除
    entries.slice(0, 100).forEach(([key]) => {
      cache.delete(key);
    });
    
    console.log(`[Cache Simple] Cleaned up old entries, current size: ${cache.size}`);
  }
}

// キャッシュを無効化
export async function invalidateCache(pattern: string): Promise<void> {
  let count = 0;
  
  for (const key of cache.keys()) {
    if (key.includes(pattern) || pattern === '*') {
      cache.delete(key);
      count++;
    }
  }
  
  console.log(`[Cache Simple] Invalidated ${count} entries matching pattern: ${pattern}`);
}

// 全キャッシュクリア
export async function clearCache(): Promise<void> {
  const size = cache.size;
  cache.clear();
  console.log(`[Cache Simple] Cleared ${size} entries`);
}

// キャッシュ統計
export async function getCacheStats() {
  let totalSize = 0;
  let validCount = 0;
  const now = Date.now();
  
  for (const [key, entry] of cache.entries()) {
    try {
      totalSize += JSON.stringify(entry.data).length;
      if (now - entry.timestamp <= entry.ttl * 1000) {
        validCount++;
      }
    } catch (e) {
      // JSON変換エラーは無視
    }
  }
  
  return {
    memory: {
      size: cache.size,
      calculatedSize: totalSize,
      hits: 0, // 簡略化のため省略
      misses: 0
    },
    redis: {
      connected: false,
      keyCount: 0,
      memoryUsage: 0
    }
  };
}

// キャッシュキー生成
export function generateCacheKey(prefix: string, params: any): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as any);
  
  return `${prefix}:${JSON.stringify(sortedParams)}`;
}

// エクスポート
const cacheSimple = {
  get: getFromCache,
  set: setToCache,
  invalidate: invalidateCache,
  clear: clearCache,
  stats: getCacheStats,
  generateKey: generateCacheKey
};

export default cacheSimple;