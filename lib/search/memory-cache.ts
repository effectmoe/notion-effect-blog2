/**
 * In-memory cache for search index
 * This is used on Vercel where /tmp is ephemeral
 */

import type { SearchIndexItem } from './types'

class MemoryCache {
  private static instance: MemoryCache
  private cache: Map<string, any> = new Map()
  private searchIndex: SearchIndexItem[] = []
  private lastIndexed: Date | null = null
  
  private constructor() {}
  
  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache()
    }
    return MemoryCache.instance
  }
  
  // Search index methods
  setSearchIndex(index: SearchIndexItem[]): void {
    this.searchIndex = index
    this.lastIndexed = new Date()
    console.log(`In-memory search index updated with ${index.length} items`)
  }
  
  getSearchIndex(): SearchIndexItem[] {
    return this.searchIndex
  }
  
  hasSearchIndex(): boolean {
    return this.searchIndex.length > 0
  }
  
  getLastIndexed(): Date | null {
    return this.lastIndexed
  }
  
  clearSearchIndex(): void {
    this.searchIndex = []
    this.lastIndexed = null
  }
  
  // Generic cache methods
  set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, {
      value,
      expires: ttl ? Date.now() + ttl : null
    })
  }
  
  get(key: string): any {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
    this.clearSearchIndex()
  }
}

export const memoryCache = MemoryCache.getInstance()