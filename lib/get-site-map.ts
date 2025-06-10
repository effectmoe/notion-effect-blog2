import { getAllPagesInSpace, getPageProperty, uuidToId } from 'notion-utils'
import pMemoize from 'p-memoize'

import type * as types from './types'
import * as config from './config'
import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { notion } from './notion-api'
import { processBatch, throttleRequest } from './notion-concurrency'

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

const getPage = async (pageId: string, ...args) => {
  console.log('\nnotion getPage', uuidToId(pageId))
  // Vercel環境ではスロットリングを適用
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV
  if (isVercel) {
    return throttleRequest(() => notion.getPage(pageId, ...args))
  }
  return notion.getPage(pageId, ...args)
}

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId: string
): Promise<Partial<types.SiteMap>> {
  console.log('\n=== Starting getAllPagesImpl ===')
  console.log('Vercel環境:', process.env.VERCEL || process.env.VERCEL_ENV ? 'はい' : 'いいえ')
  
  // Vercel環境では並列処理を制限
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV
  if (isVercel) {
    console.log('Vercel環境検出: ページ取得を段階的に実行します')
  }
  
  let pageMap
  
  if (isVercel) {
    // Vercel環境では段階的にページを取得
    console.log('カスタム並列処理を使用してページを取得します')
    pageMap = await getAllPagesInSpaceWithLimiter(
      rootNotionPageId,
      rootNotionSpaceId,
      getPage
    )
  } else {
    // ローカル環境では通常の処理
    pageMap = await getAllPagesInSpace(
      rootNotionPageId,
      rootNotionSpaceId,
      getPage
    )
  }

  const canonicalPageMap = Object.keys(pageMap).reduce(
    (map, pageId: string) => {
      const recordMap = pageMap[pageId]
      if (!recordMap) {
        throw new Error(`Error loading page "${pageId}"`)
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

// Vercel環境用の制限付きページ取得関数
async function getAllPagesInSpaceWithLimiter(
  rootNotionPageId: string,
  rootNotionSpaceId: string,
  getPage: any
): Promise<any> {
  console.log('\n制限付きページ取得を開始...')
  
  // まずルートページを取得
  const rootRecordMap = await getPage(rootNotionPageId)
  const pageMap = {
    [rootNotionPageId]: rootRecordMap
  }
  
  // ルートページから子ページを抽出
  const childPageIds = extractChildPageIds(rootRecordMap)
  console.log(`見つかった子ページ数: ${childPageIds.length}`)
  
  // バッチ処理で子ページを取得（Vercel環境では小さなバッチサイズ）
  const batchSize = 3 // 一度に3ページずつ処理
  const pageResults = await processBatch(
    childPageIds,
    async (pageId) => {
      const recordMap = await getPage(pageId)
      return { pageId, recordMap }
    },
    batchSize
  )
  
  // 結果をpageMapに統合
  for (const { pageId, recordMap } of pageResults) {
    pageMap[pageId] = recordMap
    
    // さらに子ページがある場合は再帰的に取得（制限付き）
    const grandChildIds = extractChildPageIds(recordMap)
    if (grandChildIds.length > 0) {
      const grandChildResults = await processBatch(
        grandChildIds.slice(0, 10), // 最大10ページまでに制限
        async (childId) => {
          const childRecordMap = await getPage(childId)
          return { pageId: childId, recordMap: childRecordMap }
        },
        2 // さらに小さなバッチサイズ
      )
      
      for (const { pageId: childId, recordMap: childRecordMap } of grandChildResults) {
        pageMap[childId] = childRecordMap
      }
    }
  }
  
  console.log(`合計取得ページ数: ${Object.keys(pageMap).length}`)
  return pageMap
}

// RecordMapから子ページIDを抽出
function extractChildPageIds(recordMap: any): string[] {
  const pageIds: string[] = []
  
  if (!recordMap?.block) return pageIds
  
  for (const blockId in recordMap.block) {
    const block = recordMap.block[blockId]?.value
    if (!block) continue
    
    // ページリンクを探す
    if (block.type === 'page' && block.id !== block.parent_id) {
      pageIds.push(block.id)
    }
    
    // child_pageタイプのブロック
    if (block.type === 'child_page') {
      pageIds.push(block.id)
    }
    
    // content内のページ参照
    if (block.content) {
      for (const contentId of block.content) {
        const contentBlock = recordMap.block[contentId]?.value
        if (contentBlock?.type === 'page' || contentBlock?.type === 'child_page') {
          pageIds.push(contentId)
        }
      }
    }
  }
  
  return [...new Set(pageIds)] // 重複を除去
}
