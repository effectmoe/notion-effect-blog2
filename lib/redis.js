import { createClient } from 'redis';

let redisClient = null;
let isRedisAvailable = false;

// Redis接続の初期化（エラーに対して寛容）
async function initRedis() {
  if (redisClient) return redisClient;
  
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('[Redis] No REDIS_URL configured, using in-memory fallback');
      return null;
    }
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('[Redis] Max reconnection attempts reached');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
      isRedisAvailable = false;
    });
    
    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      isRedisAvailable = true;
    });
    
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error.message);
    return null;
  }
}

// Redisまたはメモリストレージを使用する汎用ストレージ
class DistributedStorage {
  constructor() {
    this.memoryStore = new Map();
  }
  
  async get(key) {
    if (isRedisAvailable && redisClient) {
      try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('[Storage] Redis get error:', error.message);
      }
    }
    return this.memoryStore.get(key);
  }
  
  async set(key, value, ttl = 300) { // デフォルト5分のTTL
    const data = JSON.stringify(value);
    
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.setEx(key, ttl, data);
        return true;
      } catch (error) {
        console.error('[Storage] Redis set error:', error.message);
      }
    }
    
    // メモリストレージにフォールバック
    this.memoryStore.set(key, value);
    // 簡易的なTTL実装
    setTimeout(() => this.memoryStore.delete(key), ttl * 1000);
    return true;
  }
  
  async delete(key) {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.del(key);
      } catch (error) {
        console.error('[Storage] Redis delete error:', error.message);
      }
    }
    this.memoryStore.delete(key);
  }
}

// シングルトンインスタンス
const storage = new DistributedStorage();

export { initRedis, storage };