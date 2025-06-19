// シンプルなメモリキャッシュ実装（Redis不要）

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// メモリキャッシュ
const cache = new Map<string, CacheEntry>();

// キャッシュ統計
let cacheHits = 0;
let cacheMisses = 0;

// 定期的な古いキャッシュのクリーンアップ
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl * 1000) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
  }
}, 60000); // 1分ごと

// キャッシュキー生成
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        acc[key] = params[key];
      }
      return acc;
    }, {} as Record<string, any>);

  return `${prefix}:${JSON.stringify(sortedParams)}`;
}

// キャッシュから取得
export async function getFromCache<T>(key: string): Promise<T | null> {
  const cached = cache.get(key);
  
  if (!cached) {
    cacheMisses++;
    console.log(`[Cache] Miss: ${key}`);
    return null;
  }
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl * 1000) {
    cache.delete(key);
    cacheMisses++;
    console.log(`[Cache] Expired: ${key}`);
    return null;
  }
  
  cacheHits++;
  console.log(`[Cache] Hit: ${key}`);
  return cached.data;
}

// キャッシュに保存
export async function setToCache<T>(
  key: string, 
  value: T, 
  ttlSeconds: number = 3600
): Promise<void> {
  cache.set(key, {
    data: value,
    timestamp: Date.now(),
    ttl: ttlSeconds
  });
  
  console.log(`[Cache] Set: ${key} (TTL: ${ttlSeconds}s)`);
  
  // メモリ使用量の管理
  if (cache.size > 500) {
    // 古いエントリから削除
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // 最も古い100件を削除
    entries.slice(0, 100).forEach(([key]) => {
      console.log(`[Cache] Evicting old entry: ${key}`);
      cache.delete(key);
    });
  }
}

// キャッシュの無効化
export async function invalidateCache(pattern: string): Promise<void> {
  console.log(`[Cache] Invalidating cache with pattern: ${pattern}`);
  
  const keysToDelete: string[] = [];
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`[Cache] Deleted ${keysToDelete.length} entries matching "${pattern}"`);
}

// 全キャッシュクリア
export async function clearAllCache(): Promise<void> {
  const size = cache.size;
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  console.log(`[Cache] Cleared all ${size} entries`);
}

// キャッシュ統計情報
export async function getCacheStats() {
  const now = Date.now();
  let activeCount = 0;
  let expiredCount = 0;
  let totalSize = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl * 1000) {
      expiredCount++;
    } else {
      activeCount++;
    }
    // 簡易的なサイズ計算
    totalSize += JSON.stringify(value.data).length;
  }
  
  const hitRate = cacheHits + cacheMisses > 0 
    ? (cacheHits / (cacheHits + cacheMisses)) * 100 
    : 0;
  
  return {
    memory: {
      size: cache.size,
      calculatedSize: totalSize,
      hits: cacheHits,
      misses: cacheMisses,
    },
    redis: {
      connected: false,
      keyCount: 0,
      memoryUsage: 0,
    },
    details: {
      activeEntries: activeCount,
      expiredEntries: expiredCount,
      hitRate: hitRate.toFixed(2) + '%'
    }
  };
}

// キャッシュのウォームアップ（互換性のため）
export async function warmupCache(pageIds: string[]) {
  console.log(`[Cache] Warmup not implemented in simple cache`);
  return { successful: 0, failed: 0 };
}

// キャッシュのクリーンアップ（互換性のため）
export async function cleanupCache() {
  const stats = await getCacheStats();
  if (stats.details.expiredEntries > 0) {
    // 期限切れエントリを削除
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > value.ttl * 1000) {
        cache.delete(key);
      }
    }
  }
}

// デフォルトエクスポート
export default {
  generateCacheKey,
  getFromCache,
  setToCache,
  invalidateCache,
  clearAllCache,
  getCacheStats,
  warmupCache,
  cleanupCache
};