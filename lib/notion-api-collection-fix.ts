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
    if (collectionBlocks.length > 0) {
      console.log('[NotionAPICollectionFix] Collection blocks found. Fetching/verifying collection data...')
      
      // 各コレクションブロックのデータを個別に取得
      for (const { blockId, collectionId } of collectionBlocks) {
        try {
          console.log(`[NotionAPICollectionFix] Fetching collection data for block: ${blockId}, collection: ${collectionId}`)
          
          // まずブロックIDでデータを取得
          const blockData = await this.syncRecordValues({
            requests: [
              {
                pointer: {
                  table: 'block',
                  id: blockId
                },
                version: -1
              }
            ]
          })
          
          // 次にコレクションIDでも試す
          let collectionData = blockData
          if (collectionId && collectionId !== blockId) {
            const colData = await this.syncRecordValues({
              requests: [
                {
                  pointer: {
                    table: 'collection',
                    id: collectionId
                  },
                  version: -1
                }
              ]
            })
            // 両方のデータをマージ
            collectionData = {
              recordMap: {
                ...blockData?.recordMap,
                ...colData?.recordMap
              }
            }
          }
          
          console.log('[NotionAPICollectionFix] Collection data response:', {
            hasRecordMap: !!collectionData?.recordMap,
            collections: collectionData?.recordMap?.collection ? Object.keys(collectionData.recordMap.collection) : []
          })
          
          // 取得したデータをマージ
          if (collectionData?.recordMap) {
            if (collectionData.recordMap.collection) {
              recordMap.collection = {
                ...recordMap.collection,
                ...collectionData.recordMap.collection
              }
            }
            if (collectionData.recordMap.collection_view) {
              recordMap.collection_view = {
                ...recordMap.collection_view,
                ...collectionData.recordMap.collection_view
              }
            }
            if (collectionData.recordMap.collection_query) {
              recordMap.collection_query = {
                ...recordMap.collection_query,
                ...collectionData.recordMap.collection_query
              }
            }
          }
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