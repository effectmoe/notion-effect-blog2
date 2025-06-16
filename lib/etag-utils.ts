import crypto from 'crypto'

/**
 * Generate ETag for cache data
 */
export function generateETag(data: any): string {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex')
  
  return `"${hash}"`
}

/**
 * Update cache access time for LRU
 */
export function updateCacheAccessTime(cacheKey: string): void {
  // This is handled by the LRU cache automatically in cache-memory-only.ts
  // Just logging for now
  console.log(`[Cache] Access time updated for ${cacheKey}`)
}