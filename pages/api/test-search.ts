// このファイルはNotion検索機能のテスト用APIです
import { type NextApiRequest, type NextApiResponse } from 'next'
import { NotionAPI } from 'notion-client'

export default async function testSearch(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).send({ error: 'Method not allowed. Use GET.' })
  }

  try {
    // 環境変数と接続情報
    const info = {
      notionPageId: process.env.NOTION_PAGE_ID,
      notionApiSecret: process.env.NOTION_API_SECRET ? '設定されています' : '設定されていません',
      apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3'
    }

    // Notionクライアントを初期化
    const notion = new NotionAPI({
      apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
      authToken: process.env.NOTION_API_SECRET
    })

    // シンプルな検索を実行
    const results = await notion.search({
      query: 'test', // シンプルなテスト検索
      ancestorId: undefined, // rootページを指定しない
      filters: {
        isDeletedOnly: false,
        excludeTemplates: true,
        isNavigableOnly: false,
        requireEditPermissions: false,
      },
      limit: 10
    })

    // 結果を返す
    res.status(200).json({
      info,
      searchResultsCount: results.results?.length || 0,
      hasResults: (results.results?.length || 0) > 0,
      hasRecordMap: !!results.recordMap,
      // サンプル結果（最初の2件のみ）
      sampleResults: results.results?.slice(0, 2) || []
    })
  } catch (error) {
    console.error('Test search error:', error)
    res.status(500).json({
      error: 'Search test error',
      message: error.message,
      stack: error.stack
    })
  }
}
