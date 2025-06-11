import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // テスト用：特定のコレクションから検索対象ページを取得
    const collectionId = '1ceb802cb0c681e8a45e000ba000bfe2' // カフェキネシコンテンツ
    const collectionViewId = '1ceb802cb0c6811c86ef000c4141e47c' // Gallery view
    
    const collectionData = await notion.getCollectionData(
      collectionId,
      collectionViewId,
      { limit: 50 }
    )
    
    const searchablePages = []
    
    // 各ページのプロパティをチェック
    if (collectionData.result?.blockIds) {
      for (const pageId of collectionData.result.blockIds) {
        const block = collectionData.recordMap?.block?.[pageId]?.value
        if (block) {
          const properties = block.properties
          
          // 検索対象プロパティをチェック（プロパティIDは実際のものに合わせて調整）
          const searchableProperty = properties?.['xaH>'] // 検索対象のプロパティID
          const isSearchable = searchableProperty?.[0]?.[0] === 'Yes'
          
          if (isSearchable) {
            searchablePages.push({
              id: pageId,
              title: properties?.title?.[0]?.[0] || 'Untitled',
              searchable: true
            })
          }
        }
      }
    }
    
    res.status(200).json({
      collectionId,
      totalPages: collectionData.result?.blockIds?.length || 0,
      searchablePages: searchablePages.length,
      pages: searchablePages
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}