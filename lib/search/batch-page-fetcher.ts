/**
 * バッチでページを取得するヘルパー
 * タイムアウトを避けるため、小さなバッチで処理
 */

import { notion } from '../notion-api'
import { getCanonicalPageId } from '../get-canonical-page-id'

export async function getAllPageIds(rootPageId: string): Promise<string[]> {
  try {
    console.log('Getting all page IDs from root page:', rootPageId)
    
    // ルートページを取得
    const rootPage = await notion.getPage(rootPageId)
    if (!rootPage) {
      console.error('Failed to load root page')
      return []
    }
    
    // すべてのブロックIDを収集
    const allBlockIds = Object.keys(rootPage.block || {})
    const pageIds: Set<string> = new Set()
    
    // ページタイプのブロックのみをフィルタ
    for (const blockId of allBlockIds) {
      const block = rootPage.block[blockId]?.value
      if (block && block.type === 'page') {
        pageIds.add(blockId)
      }
    }
    
    // コレクションビューから追加のページを取得
    const collectionIds = Object.keys(rootPage.collection || {})
    for (const collectionId of collectionIds) {
      const collection = rootPage.collection[collectionId]?.value
      if (collection) {
        // コレクション内のページを取得
        const collectionView = Object.values(rootPage.collection_view || {})
          .find(cv => (cv.value as any)?.collection_id === collectionId)
        
        if (collectionView?.value) {
          try {
            const collectionData = await notion.getCollectionData(
              collectionId,
              (collectionView.value as any).id,
              { limit: 100 }
            )
            
            // コレクション内のページIDを追加
            const blockIds = collectionData.recordMap?.block || {}
            Object.keys(blockIds).forEach(id => pageIds.add(id))
          } catch (error) {
            console.error(`Failed to load collection ${collectionId}:`, error.message)
          }
        }
      }
    }
    
    // 子ページを再帰的に取得（深さ制限付き）
    const maxDepth = 3
    const visited = new Set<string>()
    
    async function getChildPages(pageId: string, depth: number = 0): Promise<void> {
      if (depth >= maxDepth || visited.has(pageId)) return
      visited.add(pageId)
      
      try {
        const page = await notion.getPage(pageId)
        if (!page) return
        
        const blocks = Object.values(page.block || {})
        for (const block of blocks) {
          if (block.value?.type === 'page' && block.value?.id) {
            pageIds.add(block.value.id)
            // 子ページも取得（深さ制限あり）
            await getChildPages(block.value.id, depth + 1)
          }
        }
      } catch (error) {
        console.error(`Failed to get child pages for ${pageId}:`, error.message)
      }
    }
    
    // ルートページから開始
    await getChildPages(rootPageId)
    
    console.log(`Found ${pageIds.size} unique pages`)
    return Array.from(pageIds)
  } catch (error) {
    console.error('Error getting all page IDs:', error)
    return []
  }
}

/**
 * ページをバッチで取得（タイムアウト対策）
 */
export async function fetchPagesInBatches(
  pageIds: string[],
  batchSize: number = 5,
  delayMs: number = 1000
): Promise<Map<string, any>> {
  const pageMap = new Map<string, any>()
  
  for (let i = 0; i < pageIds.length; i += batchSize) {
    const batch = pageIds.slice(i, i + batchSize)
    console.log(`Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pageIds.length / batchSize)}`)
    
    // バッチ内のページを並行取得
    const promises = batch.map(async (pageId) => {
      try {
        const page = await notion.getPage(pageId)
        return { pageId, page }
      } catch (error) {
        console.error(`Failed to fetch page ${pageId}:`, error.message)
        return { pageId, page: null }
      }
    })
    
    const results = await Promise.all(promises)
    
    // 結果をマップに追加
    for (const { pageId, page } of results) {
      if (page) {
        pageMap.set(pageId, page)
      }
    }
    
    // 次のバッチまで待機（レート制限対策）
    if (i + batchSize < pageIds.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return pageMap
}