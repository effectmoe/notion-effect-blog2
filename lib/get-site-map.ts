import { getAllPagesInSpace, getPageProperty, uuidToId } from 'notion-utils'
import pMemoize from 'p-memoize'

import type * as types from './types'
import * as config from './config'
import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { notion } from './notion-api'

const uuid = !!includeNotionIdInUrls

export async function getSiteMap(bypassCache = false): Promise<types.SiteMap> {
  let partialSiteMap;
  
  if (bypassCache) {
    // キャッシュをバイパスして直接実装を呼ぶ
    partialSiteMap = await getAllPagesImpl(
      config.rootNotionPageId,
      config.rootNotionSpaceId
    )
  } else {
    // 通常はキャッシュされたバージョンを使用
    partialSiteMap = await getAllPages(
      config.rootNotionPageId,
      config.rootNotionSpaceId
    )
  }

  return {
    site: config.site,
    ...partialSiteMap
  } as types.SiteMap
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args)
})

// Export a function to clear the memoized cache
export function clearSiteMapCache() {
  console.log('[SiteMap] Site map cache clear requested')
  // p-memoizeのキャッシュは直接クリアできないため、
  // キャッシュが期限切れになるか、アプリケーションが再起動されるまで待つ必要がある
}

const getPage = async (pageId: string, ...args) => {
  console.log('\nnotion getPage', uuidToId(pageId))
  try {
    return await notion.getPage(pageId, ...args)
  } catch (error) {
    console.error(`Failed to load page ${pageId}:`, error.message)
    // タイムアウトエラーの場合はnullを返して続行
    if (error.message && error.message.includes('timeout')) {
      return null
    }
    throw error
  }
}

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId: string
): Promise<Partial<types.SiteMap>> {
  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage
  )

  const canonicalPageMap = Object.keys(pageMap).reduce(
    (map, pageId: string) => {
      const recordMap = pageMap[pageId]
      if (!recordMap) {
        console.warn(`Skipping page "${pageId}" - failed to load`)
        return map
      }

      const block = recordMap.block[pageId]?.value
      if (
        !(getPageProperty<boolean | null>('Public', block, recordMap) ?? true)
      ) {
        return map
      }

      const canonicalPageId = getCanonicalPageId(pageId, recordMap, {
        uuid
      })

      if (map[canonicalPageId]) {
        // you can have multiple pages in different collections that have the same id
        // TODO: we may want to error if neither entry is a collection page
        
        // 重複チェックをスキップする設定
        if (process.env.SKIP_DUPLICATE_CHECK !== 'true') {
          console.warn('error duplicate canonical page id', {
            canonicalPageId,
            pageId,
            existingPageId: map[canonicalPageId]
          })
        }

        return map
      } else {
        return {
          ...map,
          [canonicalPageId]: pageId
        }
      }
    },
    {}
  )

  return {
    pageMap,
    canonicalPageMap
  }
}
