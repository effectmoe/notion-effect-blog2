import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'
import { isPageSearchable, filterSearchablePages } from '@/lib/search/searchable-checker'
import { getPagePropertiesFromOfficialAPI } from '@/lib/search/official-api-checker'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // テストモードを確認
    const testMode = req.query.mode || 'both' // 'official', 'unofficial', 'both'
    const pageId = req.query.pageId as string // 特定のページをテストする場合
    
    const results: any = {
      testMode,
      timestamp: new Date().toISOString()
    }
    
    // 特定のページをテストする場合
    if (pageId) {
      console.log(`Testing single page: ${pageId}`)
      
      // 公式APIでプロパティを取得
      if (testMode === 'official' || testMode === 'both') {
        const officialProps = await getPagePropertiesFromOfficialAPI(pageId)
        results.officialAPI = {
          properties: officialProps,
          isSearchable: await isPageSearchable(pageId)
        }
      }
      
      // 非公式APIでも取得して比較（デバッグ用）
      if (testMode === 'unofficial' || testMode === 'both') {
        const page = await notion.getPage(pageId)
        const block = page?.block?.[pageId]?.value
        results.unofficialAPI = {
          properties: block?.properties,
          propertyKeys: Object.keys(block?.properties || {})
        }
      }
      
      res.status(200).json(results)
      return
    }
    
    // 複数ページのテスト
    // デバッグ情報から取得した正しいID
    const collectionId = '1ceb802c-b0c6-81e8-a45e-000ba000bfe2' // カフェキネシコンテンツ
    const collectionViewId = '1ceb802c-b0c6-811c-86ef-000c4141e47c' // Gallery view
    
    // 非公式APIでページリストを取得
    const collectionData = await notion.getCollectionData(
      collectionId,
      collectionViewId,
      { limit: 50 }
    )
    
    const pageIds = collectionData.result?.blockIds || []
    results.totalPages = pageIds.length
    
    // 公式APIを使用して検索対象ページをフィルタリング
    if (testMode === 'official' || testMode === 'both') {
      console.log('Testing with official API...')
      const searchablePageIds = await filterSearchablePages(pageIds)
      
      // 詳細情報を取得
      const searchableDetails = []
      for (const id of searchablePageIds.slice(0, 5)) { // 最初の5件のみ詳細表示
        const props = await getPagePropertiesFromOfficialAPI(id)
        const page = await notion.getPage(id)
        searchableDetails.push({
          id,
          title: page?.block?.[id]?.value?.properties?.title?.[0]?.[0] || 'Untitled',
          searchableProperty: props?.['検索対象'] || props?.['Searchable'] || props?.['|}VV']
        })
      }
      
      results.officialAPI = {
        searchableCount: searchablePageIds.length,
        searchablePageIds: searchablePageIds.slice(0, 10), // 最初の10件
        sampleDetails: searchableDetails
      }
    }
    
    // 非公式APIでの結果（比較用）
    if (testMode === 'unofficial' || testMode === 'both') {
      console.log('Testing with unofficial API...')
      const searchablePages = []
      
      for (const pageId of pageIds) {
        const block = collectionData.recordMap?.block?.[pageId]?.value
        if (block) {
          const properties = block.properties
          const searchableProperty = properties?.['|}VV']
          const isSearchable = searchableProperty?.[0]?.[0] === 'Yes' || 
                             searchableProperty?.[0]?.[0] === true ||
                             searchableProperty?.[0]?.[0] === '✓'
          
          if (isSearchable) {
            searchablePages.push({
              id: pageId,
              title: properties?.title?.[0]?.[0] || 'Untitled',
              searchableValue: searchableProperty?.[0]?.[0]
            })
          }
        }
      }
      
      results.unofficialAPI = {
        searchableCount: searchablePages.length,
        searchablePages: searchablePages.slice(0, 10) // 最初の10件
      }
    }
    
    res.status(200).json(results)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}