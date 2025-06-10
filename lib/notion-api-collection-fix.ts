import { NotionAPI } from 'notion-client'
import { ExtendedRecordMap } from 'notion-types'

export class NotionAPICollectionFix extends NotionAPI {
  /**
   * Override getPage to ensure collections are properly fetched
   */
  async getPage(
    pageId: string,
    {
      fetchMissingBlocks = true,
      fetchCollections = true,
      signFileUrls = true,
      chunkLimit = 100,
      chunkNumber = 0,
      ...rest
    }: Parameters<NotionAPI['getPage']>[1] = {}
  ): Promise<ExtendedRecordMap> {
    console.log('[NotionAPICollectionFix] Fetching page:', pageId, {
      fetchCollections,
      fetchMissingBlocks
    })

    // まず通常の方法でページを取得
    const recordMap = await super.getPage(pageId, {
      fetchMissingBlocks,
      fetchCollections,
      signFileUrls,
      chunkLimit,
      chunkNumber,
      ...rest
    })

    console.log('[NotionAPICollectionFix] Initial recordMap:', {
      hasBlock: !!recordMap.block,
      blockCount: Object.keys(recordMap.block || {}).length,
      hasCollection: !!recordMap.collection,
      collectionCount: Object.keys(recordMap.collection || {}).length,
      hasCollectionView: !!recordMap.collection_view,
      collectionViewCount: Object.keys(recordMap.collection_view || {}).length
    })

    // コレクションビューブロックを探す
    const collectionBlocks: Array<{ blockId: string; collectionId?: string }> = []
    if (recordMap.block) {
      for (const [blockId, blockValue] of Object.entries(recordMap.block)) {
        const block = blockValue?.value
        if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
          collectionBlocks.push({
            blockId,
            collectionId: block.collection_id
          })
          console.log('[NotionAPICollectionFix] Found collection block:', {
            blockId,
            type: block.type,
            collection_id: block.collection_id,
            view_ids: block.view_ids
          })
        }
      }
    }

    // コレクションブロックが見つかった場合は常にデータを取得（既存のデータがあっても補完のため）
    // ただし、すでにコレクションデータがある場合はスキップしてタイムアウトを防ぐ
    if (collectionBlocks.length > 0 && (!recordMap.collection || Object.keys(recordMap.collection).length === 0)) {
      console.log('[NotionAPICollectionFix] Collection blocks found but no collection data. Attempting to fetch...')
      
      // タイムアウトを防ぐため、最初の3つのコレクションブロックのみ処理
      const blocksToProcess = collectionBlocks.slice(0, 3)
      
      // 各コレクションブロックのデータを個別に取得
      for (const { blockId, collectionId } of blocksToProcess) {
        try {
          console.log(`[NotionAPICollectionFix] Fetching collection data for block: ${blockId}, collection: ${collectionId}`)
          
          // ブロックIDでページデータを再取得（コレクションを含む）
          const blockData = await super.getPage(blockId, {
            fetchCollections: true,
            fetchMissingBlocks: false,
            signFileUrls: false,
            chunkLimit: 30  // より小さなチャンクサイズでタイムアウトを防ぐ
          })
          
          // 取得したコレクションデータをマージ
          if (blockData?.collection) {
            recordMap.collection = {
              ...recordMap.collection,
              ...blockData.collection
            }
          }
          if (blockData?.collection_view) {
            recordMap.collection_view = {
              ...recordMap.collection_view,
              ...blockData.collection_view
            }
          }
          if (blockData?.collection_query) {
            recordMap.collection_query = {
              ...recordMap.collection_query,
              ...blockData.collection_query
            }
          }
          
          console.log('[NotionAPICollectionFix] Collection data response:', {
            foundCollections: blockData?.collection ? Object.keys(blockData.collection) : [],
            foundViews: blockData?.collection_view ? Object.keys(blockData.collection_view) : []
          })
        } catch (error) {
          console.error(`[NotionAPICollectionFix] Error fetching collection data for block ${blockId}:`, error)
        }
      }
      
      // まだコレクションデータが見つからない場合、親ページを取得してみる
      if (!recordMap.collection || Object.keys(recordMap.collection).length === 0) {
        console.log('[NotionAPICollectionFix] Still no collection data. Trying parent pages...')
        
        for (const { blockId } of collectionBlocks) {
          const block = recordMap.block?.[blockId]?.value
          if (block?.parent_id) {
            try {
              console.log(`[NotionAPICollectionFix] Fetching parent page: ${block.parent_id}`)
              const parentData = await super.getPage(block.parent_id, {
                fetchCollections: true,
                fetchMissingBlocks: false,
                signFileUrls: false
              })
              
              // 親ページのコレクションデータをマージ
              if (parentData.collection) {
                recordMap.collection = {
                  ...recordMap.collection,
                  ...parentData.collection
                }
              }
              if (parentData.collection_view) {
                recordMap.collection_view = {
                  ...recordMap.collection_view,
                  ...parentData.collection_view
                }
              }
            } catch (error) {
              console.error(`[NotionAPICollectionFix] Error fetching parent page:`, error)
            }
          }
        }
      }
    }

    // 最終的なrecordMapの状態をログ
    console.log('[NotionAPICollectionFix] Final recordMap:', {
      hasBlock: !!recordMap.block,
      blockCount: Object.keys(recordMap.block || {}).length,
      hasCollection: !!recordMap.collection,
      collectionCount: Object.keys(recordMap.collection || {}).length,
      collections: recordMap.collection ? Object.keys(recordMap.collection) : [],
      hasCollectionView: !!recordMap.collection_view,
      collectionViewCount: Object.keys(recordMap.collection_view || {}).length,
      collectionViews: recordMap.collection_view ? Object.keys(recordMap.collection_view) : []
    })

    return recordMap
  }
}