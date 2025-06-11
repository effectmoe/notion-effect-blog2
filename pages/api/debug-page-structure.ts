import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const rootPageId = '1ceb802cb0c680f29369dba86095fb38'
    const rootPage = await notion.getPage(rootPageId)
    
    // デバッグ情報を収集
    const debugInfo = {
      rootPageId,
      blockCount: Object.keys(rootPage.block || {}).length,
      collectionCount: Object.keys(rootPage.collection || {}).length,
      collectionViewCount: Object.keys(rootPage.collection_view || {}).length,
      blocks: [],
      collections: [],
      collectionViews: []
    }
    
    // ブロックの種類を分析
    const blockTypes = {}
    Object.entries(rootPage.block || {}).forEach(([id, block]) => {
      const type = block.value?.type || 'unknown'
      blockTypes[type] = (blockTypes[type] || 0) + 1
      
      // ページタイプとコレクションビューのみ詳細を記録
      if (type === 'page' || type === 'collection_view_page' || type === 'collection_view') {
        debugInfo.blocks.push({
          id,
          type,
          title: block.value?.properties?.title?.[0]?.[0] || 'Untitled',
          hasContent: !!block.value?.content?.length,
          contentCount: block.value?.content?.length || 0
        })
      }
    })
    
    // コレクションの情報
    Object.entries(rootPage.collection || {}).forEach(([id, collection]) => {
      debugInfo.collections.push({
        id,
        name: collection.value?.name?.[0]?.[0] || 'Unnamed',
        schema: Object.keys(collection.value?.schema || {})
      })
    })
    
    // コレクションビューの情報
    Object.entries(rootPage.collection_view || {}).forEach(([id, view]) => {
      debugInfo.collectionViews.push({
        id,
        type: view.value?.type,
        name: view.value?.name || 'Unnamed View',
        collection_id: (view.value as any)?.collection_id
      })
    })
    
    debugInfo['blockTypesSummary'] = blockTypes
    
    res.status(200).json(debugInfo)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}