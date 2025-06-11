import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // ホームページを取得してコレクションを探す
    const rootPageId = '1ceb802cb0c680f29369dba86095fb38'
    const rootPage = await notion.getPage(rootPageId)
    
    // コレクション情報を取得
    const collections = Object.entries(rootPage.collection || {}).map(([id, data]) => ({
      id,
      name: data.value?.name?.[0]?.[0] || 'Unnamed',
      schema: Object.keys(data.value?.schema || {})
    }))
    
    // コレクションビューを取得
    const collectionViews = Object.entries(rootPage.collection_view || {}).map(([id, view]) => ({
      id,
      type: view.value?.type,
      collection_id: (view.value as any)?.collection_id
    }))
    
    // カフェキネシコンテンツのコレクションを探す
    const contentCollection = collections.find(c => c.name.includes('カフェキネシコンテンツ'))
    
    let searchablePages = []
    
    if (contentCollection) {
      // 対応するビューを探す
      const view = collectionViews.find(v => v.collection_id === contentCollection.id)
      
      if (view) {
        try {
          // コレクションデータを取得
          const collectionData = await notion.getCollectionData(
            contentCollection.id,
            view.id,
            { limit: 50 }
          )
          
          // 各アイテムのプロパティをチェック
          const blocks = collectionData.recordMap?.block || {}
          
          for (const [blockId, blockData] of Object.entries(blocks)) {
            const properties = blockData.value?.properties || {}
            const title = properties.title?.[0]?.[0] || 'Untitled'
            
            // xaH> プロパティ（検索対象）をチェック
            const searchableValue = properties['xaH>']?.[0]?.[0]
            const isSearchable = searchableValue === 'Yes' || searchableValue === true
            
            searchablePages.push({
              id: blockId,
              title,
              searchable: isSearchable,
              searchableValue,
              allProperties: Object.keys(properties)
            })
          }
        } catch (error) {
          console.error('Error fetching collection data:', error)
        }
      }
    }
    
    res.status(200).json({
      collections,
      collectionViews: collectionViews.slice(0, 5), // 最初の5つのみ
      contentCollection,
      searchablePages: searchablePages.filter(p => p.searchable),
      allPages: searchablePages.length
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}