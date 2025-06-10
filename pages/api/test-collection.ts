import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '../../lib/notion-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { pageId } = req.query

  if (!pageId || typeof pageId !== 'string') {
    return res.status(400).json({ error: 'pageId is required' })
  }

  try {
    console.log(`[test-collection] Testing page: ${pageId}`)
    
    const recordMap = await notion.getPage(pageId, {
      fetchMissingBlocks: true,
      fetchCollections: true,
      signFileUrls: false
    })

    // コレクションビューブロックを探す
    const collectionBlocks: any[] = []
    if (recordMap.block) {
      for (const [blockId, blockValue] of Object.entries(recordMap.block)) {
        const block = blockValue?.value
        if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
          collectionBlocks.push({
            blockId,
            type: block.type,
            collection_id: block.collection_id,
            view_ids: block.view_ids,
            hasCollection: !!recordMap.collection?.[block.collection_id]
          })
        }
      }
    }

    const result = {
      pageId,
      recordMapSummary: {
        blockCount: Object.keys(recordMap.block || {}).length,
        collectionCount: Object.keys(recordMap.collection || {}).length,
        collectionViewCount: Object.keys(recordMap.collection_view || {}).length,
        collectionQueryCount: Object.keys(recordMap.collection_query || {}).length
      },
      collections: Object.keys(recordMap.collection || {}),
      collectionViews: Object.keys(recordMap.collection_view || {}),
      collectionQueries: Object.keys(recordMap.collection_query || {}),
      collectionBlocks,
      // より詳細なデータ（開発環境のみ）
      ...(process.env.NODE_ENV === 'development' && {
        fullCollections: recordMap.collection,
        fullCollectionViews: recordMap.collection_view
      })
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('[test-collection] Error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch page',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}