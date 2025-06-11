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
      NOTION_TOKEN_V2: !!process.env.NOTION_TOKEN_V2,
      NOTION_ACTIVE_USER: !!process.env.NOTION_ACTIVE_USER
    }
    
    console.log('Environment variables:', apiKeys)
    
    // 公式APIで検索対象ページを取得
    console.log('Fetching searchable pages from official API...')
    const searchablePages = await getSearchablePagesFromOfficialAPI()
    
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
      databaseId: '1ceb802cb0c681e8a45e000ba000bfe2'
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