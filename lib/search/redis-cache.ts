/**
 * Redis/KVストアを使用した永続的なキャッシュ
 * VercelのKVストアやRedisを使用してインデックスを永続化
 */

import { kv } from '@vercel/kv'
import type { SearchIndexItem } from './types'

const SEARCH_INDEX_KEY = 'search:index:v1'
const INDEX_STATS_KEY = 'search:stats:v1'
const INDEX_TTL = 60 * 60 * 24 * 7 // 7日間

export class RedisSearchCache {
  /**
   * インデックスを保存
   */
  static async saveIndex(items: SearchIndexItem[]): Promise<void> {
    try {
      // KVストアに保存（Vercel KVが設定されている場合）
      if (process.env.KV_REST_API_URL) {
        await kv.set(SEARCH_INDEX_KEY, items, { ex: INDEX_TTL })
        await kv.set(INDEX_STATS_KEY, {
          totalPages: items.length,
          lastUpdated: new Date().toISOString()
        })
        console.log(`Saved ${items.length} items to Redis cache`)
      }
    } catch (error) {
      console.error('Failed to save to Redis:', error)
      // フォールバック: メモリキャッシュのみ使用
    }
  }

  /**
   * インデックスを読み込み
   */
  static async loadIndex(): Promise<SearchIndexItem[] | null> {
    try {
      if (process.env.KV_REST_API_URL) {
        const cached = await kv.get<SearchIndexItem[]>(SEARCH_INDEX_KEY)
        if (cached) {
          console.log(`Loaded ${cached.length} items from Redis cache`)
          return cached
        }
      }
    } catch (error) {
      console.error('Failed to load from Redis:', error)
    }
    return null
  }

  /**
   * インデックスの有効性をチェック
   */
  static async isIndexValid(): Promise<boolean> {
    try {
      if (process.env.KV_REST_API_URL) {
        const stats = await kv.get(INDEX_STATS_KEY)
        return !!stats
      }
    } catch (error) {
      console.error('Failed to check Redis cache:', error)
    }
    return false
  }

  /**
   * キャッシュをクリア
   */
  static async clearCache(): Promise<void> {
    try {
      if (process.env.KV_REST_API_URL) {
        await kv.del(SEARCH_INDEX_KEY)
        await kv.del(INDEX_STATS_KEY)
        console.log('Cleared Redis cache')
      }
    } catch (error) {
      console.error('Failed to clear Redis cache:', error)
    }
  }
}