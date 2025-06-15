import { getAllPagesInSpace, getPageProperty, uuidToId } from 'notion-utils'
import pMemoize from 'p-memoize'

import type * as types from './types'
import * as config from './config'
import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { notion } from './notion-api'

const uuid = !!includeNotionIdInUrls

export async function getSiteMap(): Promise<types.SiteMap> {
  const partialSiteMap = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId
  )

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
  console.log('[SiteMap] Clearing site map cache...')
  const cacheSize = getAllPages.cache?.size || 0
  console.log(`[SiteMap] Cache size before clear: ${cacheSize}`)
  getAllPages.clear()
  const cacheSizeAfter = getAllPages.cache?.size || 0
  console.log(`[SiteMap] Site map cache cleared. Size after: ${cacheSizeAfter}`)
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
        console.warn('error duplicate canonical page id', {
          canonicalPageId,
          pageId,
          existingPageId: map[canonicalPageId]
        })

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
