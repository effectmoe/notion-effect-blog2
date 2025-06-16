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
let redisConnected = false;

// Redis接続を試みる（ただしエラーでもアプリは動作継続）
function initializeRedis() {
  if (!process.env.REDIS_URL) {
    console.warn('[Redis] No REDIS_URL configured. Using memory cache only.');
    return;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 10) {
          console.error('[Redis] Maximum retry attempts reached');
          return null;
        }
        const delay = Math.min(times * 1000, 10000);
        console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      enableOfflineQueue: true, // オフラインキューを有効化
      lazyConnect: false, // 即座に接続を試みる
      connectTimeout: 30000, // 30秒のタイムアウト
      family: 4, // IPv4を強制（DNS解決の問題対策）
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some(e => err.message.includes(e));
      },
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      redisConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Ready to accept commands');
      redisConnected = true;
    });

    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
      redisConnected = false;
    });
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error);
    redisClient = null;
  }
}

// Redis初期化
initializeRedis();

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

  // 2. Redisから取得（接続されている場合のみ）
  if (redisClient && redisConnected) {
    try {
      const redisResult = await redisClient.get(key);
      if (redisResult) {
        console.log(`Cache hit (Redis): ${key}`);
        const parsed = JSON.parse(redisResult);
        // メモリキャッシュにも保存
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch (error: any) {
      console.error('[Redis] Get error:', error.message);
      // エラー時は続行（メモリキャッシュにフォールバック）
    }
  } else if (redisClient && !redisConnected) {
    console.log('[Redis] Not connected, using memory cache only');
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
  // 1. メモリキャッシュに保存（常に実行）
  memoryCache.set(key, value, { ttl: ttlSeconds * 1000 });
  console.log(`Cached to memory: ${key}`);

  // 2. Redisに保存（接続されている場合のみ）
  if (redisClient && redisConnected) {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      console.log(`Cached to Redis: ${key}`);
    } catch (error: any) {
      console.error('[Redis] Set error:', error.message);
      // エラー時は続行（メモリキャッシュは成功しているので）
    }
  } else if (redisClient && !redisConnected) {
    console.log('[Redis] Not connected, cached to memory only');
  }
}

// キャッシュの無効化
export async function invalidateCache(pattern: string): Promise<void> {
  console.log(`[Cache] Invalidating cache with pattern: ${pattern}`);
  
  // 1. メモリキャッシュのクリア
  const keys = [...memoryCache.keys()];
  let deletedMemoryKeys = 0;
  for (const key of keys) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
      deletedMemoryKeys++;
    }
  }
  console.log(`[Cache] Deleted ${deletedMemoryKeys} memory cache keys matching "${pattern}"`);

  // 2. Redisのクリア
  if (redisClient) {
    try {
      // 接続されていない場合は接続
      if (redisClient.status !== 'ready') {
        console.log('[Cache] Redis not ready, attempting to connect...');
        await redisClient.connect();
      }
      const keys = await redisClient.keys(`*${pattern}*`);
      console.log(`[Cache] Found ${keys.length} Redis keys matching "*${pattern}*"`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`[Cache] Invalidated ${keys.length} Redis keys`);
      }
    } catch (error) {
      console.error('[Cache] Redis invalidate error:', error);
    }
  } else {
    console.log('[Cache] Redis client not configured');
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

  if (redisClient && redisConnected) {
    try {
      stats.redis.connected = true;
      
      const info = await redisClient.info('memory');
      const keyCount = await redisClient.dbsize();
      
      stats.redis.keyCount = keyCount;
      
      // メモリ使用量を解析
      const memMatch = info.match(/used_memory:(\d+)/);
      if (memMatch) {
        stats.redis.memoryUsage = parseInt(memMatch[1], 10);
      }
    } catch (error: any) {
      console.error('[Redis] Stats error:', error.message);
      stats.redis.connected = false;
    }
  } else {
    stats.redis.connected = false;
    console.log('[Redis] Not connected for stats');
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
  console.log('[Cache] Starting cache cleanup...');
  try {
    // メモリキャッシュの状態を確認
    const memorySizeBefore = memoryCache.size;
    console.log(`[Cache] Memory cache size before clear: ${memorySizeBefore}`);
    
    // メモリキャッシュのクリア
    memoryCache.clear();
    const memorySizeAfter = memoryCache.size;
    console.log(`[Cache] Memory cache cleared. Size after: ${memorySizeAfter}`);
    
    // Redisキャッシュのクリア（接続は維持）
    if (redisClient) {
      console.log(`[Cache] Redis status: ${redisClient.status}`);
      if (redisClient.status === 'ready') {
        const keyCountBefore = await redisClient.dbsize();
        console.log(`[Cache] Redis key count before clear: ${keyCountBefore}`);
        
        await redisClient.flushdb();
        
        const keyCountAfter = await redisClient.dbsize();
        console.log(`[Cache] Redis cache cleared. Key count after: ${keyCountAfter}`);
      } else {
        console.log('[Cache] Redis not ready, attempting to connect...');
        try {
          if (redisClient.status !== 'connecting') {
            await redisClient.connect();
          }
          // 接続後にクリアを試みる
          await redisClient.flushdb();
          console.log('[Cache] Redis connected and cleared');
        } catch (connectError) {
          console.log('[Cache] Redis connection or clear failed:', connectError);
          // Redisエラーは無視して続行
        }
      }
    } else {
      console.log('[Cache] Redis client not configured');
    }
    
    console.log('[Cache] Cache cleanup completed successfully');
  } catch (error) {
    console.error('[Cache] Cleanup cache error:', error);
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