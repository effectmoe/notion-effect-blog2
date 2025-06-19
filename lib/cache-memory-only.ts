/**
 * Memory-only cache implementation
 * No Redis dependencies
 */

// メモリキャッシュの型定義
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// メモリキャッシュ（グローバル）
const memoryCache = new Map<string, CacheEntry>();

// キャッシュ統計
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

// キャッシュサイズの制限
const MAX_CACHE_SIZE = 500;
const CLEANUP_THRESHOLD = 600;

/**
 * キャッシュから値を取得
 */
export async function getFromCache(key: string): Promise<any | null> {
  try {
    const entry = memoryCache.get(key);
    
    if (!entry) {
      cacheStats.misses++;
      return null;
    }
    
    // 有効期限チェック
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      memoryCache.delete(key);
      cacheStats.misses++;
      return null;
    }
    
    cacheStats.hits++;
    return entry.data;
    
  } catch (error) {
    console.error('[Cache] Get error:', error);
    return null;
  }
}

/**
 * キャッシュに値を設定
 */
export async function setToCache(key: string, data: any, ttl = 3600): Promise<void> {
  try {
    // データサイズチェック（大きすぎるデータは保存しない）
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 1024 * 1024) { // 1MB以上
      console.warn(`[Cache] Data too large for key ${key}: ${dataSize} bytes`);
      return;
    }
    
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    cacheStats.sets++;
    
    // キャッシュサイズ管理
    if (memoryCache.size > CLEANUP_THRESHOLD) {
      cleanupCache();
    }
    
  } catch (error) {
    console.error('[Cache] Set error:', error);
  }
}

/**
 * キャッシュから値を削除
 */
export async function deleteFromCache(key: string): Promise<void> {
  try {
    if (memoryCache.delete(key)) {
      cacheStats.deletes++;
    }
  } catch (error) {
    console.error('[Cache] Delete error:', error);
  }
}

/**
 * パターンマッチングでキャッシュを無効化
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    let count = 0;
    
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern) || pattern === '*') {
        memoryCache.delete(key);
        count++;
      }
    }
    
    console.log(`[Cache] Invalidated ${count} entries matching pattern: ${pattern}`);
  } catch (error) {
    console.error('[Cache] Invalidate error:', error);
  }
}

/**
 * 全キャッシュクリア
 */
export async function clearCache(): Promise<void> {
  try {
    const size = memoryCache.size;
    memoryCache.clear();
    cacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    console.log(`[Cache] Cleared ${size} entries`);
  } catch (error) {
    console.error('[Cache] Clear error:', error);
  }
}

/**
 * キャッシュ統計を取得
 */
export async function getCacheStats() {
  const hitRate = cacheStats.hits + cacheStats.misses > 0
    ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2)
    : '0';
  
  let totalSize = 0;
  try {
    for (const entry of memoryCache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }
  } catch (e) {
    // サイズ計算エラーは無視
  }
  
  return {
    memory: {
      size: memoryCache.size,
      calculatedSize: totalSize,
      hits: cacheStats.hits,
      misses: cacheStats.misses
    },
    redis: {
      connected: false,
      keyCount: 0,
      memoryUsage: 0
    }
  };
}

/**
 * 古いエントリをクリーンアップ
 */
function cleanupCache() {
  console.log('[Cache] Starting cleanup...');
  
  const now = Date.now();
  const entries = Array.from(memoryCache.entries());
  
  // 期限切れエントリを削除
  let expiredCount = 0;
  entries.forEach(([key, entry]) => {
    if (now - entry.timestamp > entry.ttl * 1000) {
      memoryCache.delete(key);
      expiredCount++;
    }
  });
  
  // まだサイズが大きい場合は古いものから削除
  if (memoryCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = memoryCache.size - MAX_CACHE_SIZE;
    sortedEntries.slice(0, toDelete).forEach(([key]) => {
      memoryCache.delete(key);
    });
    
    console.log(`[Cache] Cleanup: removed ${expiredCount} expired and ${toDelete} old entries`);
  } else {
    console.log(`[Cache] Cleanup: removed ${expiredCount} expired entries`);
  }
}

// 定期的なクリーンアップ（5分ごと）
if (typeof window === 'undefined') {
  setInterval(() => {
    cleanupCache();
  }, 5 * 60 * 1000);
}

// エクスポート
export default {
  get: getFromCache,
  set: setToCache,
  delete: deleteFromCache,
  invalidate: invalidateCache,
  clear: clearCache,
  cleanup: cleanupCache,
  stats: getCacheStats
};