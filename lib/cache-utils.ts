// キャッシュユーティリティ
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()

  // デフォルトのTTL（30分）
  private defaultTTL = 30 * 60 * 1000

  set<T>(key: string, data: T, ttl?: number): void {
    const actualTTL = ttl || this.defaultTTL
    
    // 既存のタイマーをクリア
    this.clearTimer(key)
    
    // キャッシュに保存
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTTL
    })
    
    // 自動削除タイマーを設定
    const timer = setTimeout(() => {
      this.delete(key)
    }, actualTTL)
    
    this.timers.set(key, timer)
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    // 有効期限チェック
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.delete(key)
      return null
    }
    
    return item.data as T
  }

  delete(key: string): void {
    this.clearTimer(key)
    this.cache.delete(key)
  }

  clear(): void {
    // すべてのタイマーをクリア
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  private clearTimer(key: string): void {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }

  // キャッシュの統計情報
  getStats() {
    const keys = Array.from(this.cache.keys())
    const sizes = keys.map(key => {
      const item = this.cache.get(key)
      return {
        key,
        size: JSON.stringify(item?.data || '').length,
        age: item ? Date.now() - item.timestamp : 0,
        ttl: item?.ttl || 0
      }
    })
    
    return {
      totalKeys: keys.length,
      items: sizes,
      totalSize: sizes.reduce((sum, item) => sum + item.size, 0)
    }
  }
}

// グローバルシングルトンインスタンス
// Next.jsのホットリロードでも永続化するように global に保存
const globalForCache = global as unknown as {
  cacheManager: CacheManager | undefined
}

export const cacheManager = globalForCache.cacheManager ?? new CacheManager()

if (process.env.NODE_ENV !== 'production') {
  globalForCache.cacheManager = cacheManager
}

// キャッシュキー生成ヘルパー
export const CacheKeys = {
  formula: (pageId: string, propertyName: string) => `formula:${pageId}:${propertyName}`,
  page: (pageId: string) => `page:${pageId}`,
  collection: (collectionId: string) => `collection:${collectionId}`,
  collectionView: (collectionId: string, viewId: string) => `collection-view:${collectionId}:${viewId}`,
  image: (url: string) => `image:${url}`,
  recordMap: (pageId: string) => `record-map:${pageId}`
}

// TTL定数
export const CacheTTL = {
  SHORT: 5 * 60 * 1000,      // 5分
  MEDIUM: 30 * 60 * 1000,     // 30分
  LONG: 60 * 60 * 1000,       // 1時間
  VERY_LONG: 24 * 60 * 60 * 1000  // 24時間
}