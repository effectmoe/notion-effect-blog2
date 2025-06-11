import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // デバッグ情報から取得した正しいID
    const collectionId = '1ceb802c-b0c6-81e8-a45e-000ba000bfe2' // カフェキネシコンテンツ
    const collectionViewId = '1ceb802c-b0c6-811c-86ef-000c4141e47c' // Gallery view
    
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
          const searchableProperty = properties?.['|}VV'] // Searchableチェックボックスの正しいプロパティID
          const isSearchable = searchableProperty?.[0]?.[0] === 'Yes' || searchableProperty?.[0]?.[0] === true
          
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