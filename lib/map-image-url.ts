import { type Block } from 'notion-types'
import { defaultMapImageUrl } from 'notion-utils'

import { defaultPageCover, defaultPageIcon } from './config'
import { cacheManager, CacheKeys, CacheTTL } from './cache-utils'

export const mapImageUrl = (url: string | undefined, block: Block) => {
  if (!url || url === defaultPageCover || url === defaultPageIcon) {
    return url
  }

  // キャッシュをチェック
  const cacheKey = CacheKeys.image(url)
  const cached = cacheManager.get<string>(cacheKey)
  
  if (cached) {
    // console.log(`[Cache Hit] Image URL: ${url.substring(0, 50)}...`)
    return cached
  }

  // キャッシュミスの場合、通常の処理
  // console.log(`[Cache Miss] Processing image URL: ${url.substring(0, 50)}...`)
  const mappedUrl = defaultMapImageUrl(url, block)
  
  // 画像URLは長期間キャッシュ（24時間）
  if (mappedUrl) {
    cacheManager.set(cacheKey, mappedUrl, CacheTTL.VERY_LONG)
  }
  
  return mappedUrl
}
