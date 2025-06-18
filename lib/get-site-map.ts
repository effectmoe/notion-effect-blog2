import type * as types from './types'
import * as config from './config'

export async function getSiteMap(): Promise<types.SiteMap> {
  // ビルド時は空のサイトマップを返す
  return {
    site: config.site,
    pageMap: {},
    canonicalPageMap: {}
  } as types.SiteMap
}

export function clearSiteMapCache() {
  console.log('[SiteMap] Cache clear (no-op in temp version)')
}