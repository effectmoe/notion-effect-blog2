import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';
import { NotionAPI } from 'notion-client';

// キャッシュレイヤーの優先順位:
// 1. インメモリ (LRU) - 最速
// 2. Redis - 分散対応
// 3. ブラウザキャッシュ - Service Worker
// 4. CDNキャッシュ - エッジ

// インメモリキャッシュの設定
const memoryCache = new LRUCache<string, any>({
  max: 100, // 最大100エントリ
  ttl: 1000 * 60 * 5, // 5分
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

// Redisクライアントの初期化
let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 100, 3000);
    },
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
    // Redisエラー時はメモリキャッシュにフォールバック
  });

  redisClient.on('connect', () => {
    console.log('Redis connected successfully');
  });
}

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

// マルチレイヤーキャッシュの取得
export async function getFromCache<T>(key: string): Promise<T | null> {
  // 1. メモリキャッシュから取得
  const memoryResult = memoryCache.get(key);
  if (memoryResult) {
    console.log(`Cache hit (memory): ${key}`);
    return memoryResult;
  }

  // 2. Redisから取得
  if (redisClient) {
    try {
      // 接続されていない場合は接続
      if (redisClient.status !== 'ready') {
        await redisClient.connect();
      }
      const redisResult = await redisClient.get(key);
      if (redisResult) {
        console.log(`Cache hit (Redis): ${key}`);
        const parsed = JSON.parse(redisResult);
        // メモリキャッシュにも保存
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Redis get error:', error);
      // エラー時は続行
    }
  }

  console.log(`Cache miss: ${key}`);
  return null;
}

// マルチレイヤーキャッシュへの保存
export async function setToCache<T>(
  key: string, 
  value: T, 
  ttlSeconds: number = 3600
): Promise<void> {
  // 1. メモリキャッシュに保存
  memoryCache.set(key, value, { ttl: ttlSeconds * 1000 });

  // 2. Redisに保存
  if (redisClient) {
    try {
      // 接続されていない場合は接続
      if (redisClient.status !== 'ready') {
        await redisClient.connect();
      }
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      console.log(`Cached to Redis: ${key}`);
    } catch (error) {
      console.error('Redis set error:', error);
      // エラー時は続行
    }
  }
}

// キャッシュの無効化
export async function invalidateCache(pattern: string): Promise<void> {
  // 1. メモリキャッシュのクリア
  const keys = [...memoryCache.keys()];
  for (const key of keys) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }

  // 2. Redisのクリア
  if (redisClient) {
    try {
      // 接続されていない場合は接続
      if (redisClient.status !== 'ready') {
        await redisClient.connect();
      }
      const keys = await redisClient.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`Invalidated ${keys.length} Redis keys`);
      }
    } catch (error) {
      console.error('Redis invalidate error:', error);
    }
  }
}

// Notion APIのキャッシュラッパー
export class CachedNotionAPI {
  private notion: NotionAPI;
  private defaultTTL: number;

  constructor(config?: { authToken?: string; defaultTTL?: number }) {
    this.notion = new NotionAPI(config);
    this.defaultTTL = config?.defaultTTL || 3600; // デフォルト1時間
  }

  async getPage(pageId: string, options?: any) {
    const cacheKey = generateCacheKey('notion:page', { pageId, ...options });
    
    // キャッシュから取得
    const cached = await getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // APIから取得
    const result = await this.notion.getPage(pageId, options);
    
    // キャッシュに保存
    await setToCache(cacheKey, result, this.defaultTTL);
    
    return result;
  }

  async getBlocks(blockIds: string[]) {
    const cacheKey = generateCacheKey('notion:blocks', { blockIds });
    
    const cached = await getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.notion.getBlocks(blockIds);
    await setToCache(cacheKey, result, this.defaultTTL);
    
    return result;
  }

  async getSignedFileUrls(urls: any[]) {
    const cacheKey = generateCacheKey('notion:signed-urls', { urls });
    
    const cached = await getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.notion.getSignedFileUrls(urls);
    // 署名付きURLは短めのTTL
    await setToCache(cacheKey, result, 300); // 5分
    
    return result;
  }

  async search(params: any) {
    const cacheKey = generateCacheKey('notion:search', params);
    
    const cached = await getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.notion.search(params);
    // 検索結果は短めのTTL
    await setToCache(cacheKey, result, 600); // 10分
    
    return result;
  }
}

// キャッシュ統計情報
export async function getCacheStats() {
  const stats = {
    memory: {
      size: memoryCache.size,
      calculatedSize: memoryCache.calculatedSize,
      hits: (memoryCache as any).hits || 0,
      misses: (memoryCache as any).misses || 0,
    },
    redis: {
      connected: false,
      keyCount: 0,
      memoryUsage: 0,
    }
  };

  if (redisClient) {
    try {
      // 接続されていない場合は接続
      if (redisClient.status !== 'ready') {
        await redisClient.connect();
      }
      stats.redis.connected = redisClient.status === 'ready';
      
      if (stats.redis.connected) {
        const info = await redisClient.info('memory');
        const keyCount = await redisClient.dbsize();
        
        stats.redis.keyCount = keyCount;
        
        // メモリ使用量を解析
        const memMatch = info.match(/used_memory:(\d+)/);
        if (memMatch) {
          stats.redis.memoryUsage = parseInt(memMatch[1], 10);
        }
      }
    } catch (error) {
      console.error('Redis stats error:', error);
    }
  }

  return stats;
}

// キャッシュのウォームアップ
export async function warmupCache(pageIds: string[]) {
  const api = new CachedNotionAPI();
  
  console.log(`Warming up cache for ${pageIds.length} pages...`);
  
  const results = await Promise.allSettled(
    pageIds.map(pageId => 
      api.getPage(pageId, {
        fetchMissingBlocks: true,
        fetchCollections: true,
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  console.log(`Cache warmup complete: ${successful}/${pageIds.length} pages cached`);
  
  return {
    total: pageIds.length,
    successful,
    failed: pageIds.length - successful,
  };
}

// クリーンアップ処理
export async function cleanupCache() {
  try {
    // メモリキャッシュのクリア
    memoryCache.clear();
    console.log('Memory cache cleared');
    
    // Redisキャッシュのクリア（接続は維持）
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.flushdb();
      console.log('Redis cache cleared');
    }
  } catch (error) {
    console.error('Cleanup cache error:', error);
    throw error;
  }
}

// エクスポート
export default {
  get: getFromCache,
  set: setToCache,
  invalidate: invalidateCache,
  generateKey: generateCacheKey,
  stats: getCacheStats,
  warmup: warmupCache,
  cleanup: cleanupCache,
  CachedNotionAPI,
};