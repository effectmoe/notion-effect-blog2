import { type NextApiRequest, type NextApiResponse } from 'next'

import type * as types from '@/lib/types'
import { search } from '@/lib/notion'

export default async function searchNotion(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' })
  }

  // リクエストの詳細をログに出力
  console.log('Search API: リクエスト本文', JSON.stringify(req.body, null, 2))
  
  // rootNotionPageIdの確認
  console.log('Search API: NOTION_PAGE_ID', process.env.NOTION_PAGE_ID)
  console.log('Search API: NOTION_API_SECRET', process.env.NOTION_API_SECRET ? 'セットされています' : 'セットされていません')

  const searchParams: types.SearchParams = req.body

  try {
    console.log('<<< lambda search-notion リクエスト:', JSON.stringify(searchParams, null, 2))
    const results = await search(searchParams)
    console.log('>>> lambda search-notion 結果概要:', {
      hasResults: results?.results?.length > 0,
      resultsCount: results?.results?.length || 0,
      hasRecordMap: !!results?.recordMap
    })
    
    // 検索結果のサンプルをログに出力（最初の2件のみ）
    if (results?.results?.length > 0) {
      console.log('検索結果サンプル (最初の2件):', 
        JSON.stringify(results.results.slice(0, 2), null, 2)
      )
    }

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, max-age=60, stale-while-revalidate=60'
    )
    res.status(200).json(results)
  } catch (error) {
    console.error('検索エラー:', error)
    res.status(500).json({ error: 'search error', message: error.message })
  }
}
