import { NextApiRequest, NextApiResponse } from 'next'
import { getSearchablePagesFromOfficialAPI, getPagePropertiesFromOfficialAPI } from '@/lib/search/official-api-checker'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 環境変数の確認
    const apiKeys = {
      NOTION_SEARCH_API_SECRET: !!process.env.NOTION_SEARCH_API_SECRET,
      NOTION_API_SECRET: !!process.env.NOTION_API_SECRET,
      NOTION_API_KEY: !!process.env.NOTION_API_KEY,
      NOTION_TOKEN_V2: !!process.env.NOTION_TOKEN_V2,
      NOTION_ACTIVE_USER: !!process.env.NOTION_ACTIVE_USER
    }
    
    console.log('Environment variables:', apiKeys)
    
    // 公式APIで検索対象ページを取得（英語名で試す）
    console.log('Fetching searchable pages from official API with "Searchable"...')
    let searchablePages = await getSearchablePagesFromOfficialAPI('Searchable')
    
    // 英語名で取得できない場合は日本語名を試す
    if (searchablePages.length === 0) {
      console.log('No results with "Searchable", trying "検索対象"...')
      searchablePages = await getSearchablePagesFromOfficialAPI('検索対象')
    }
    
    // 各ページの詳細情報を取得（最初の3つのみ）
    const pageDetails = []
    for (const pageId of searchablePages.slice(0, 3)) {
      const properties = await getPagePropertiesFromOfficialAPI(pageId)
      pageDetails.push({
        id: pageId,
        properties: properties ? Object.keys(properties) : []
      })
    }
    
    res.status(200).json({
      success: true,
      environment: apiKeys,
      searchablePageCount: searchablePages.length,
      searchablePageIds: searchablePages,
      samplePageDetails: pageDetails,
      databaseId: '1ceb802cb0c6814ab43eddb38e80f2e0'
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}