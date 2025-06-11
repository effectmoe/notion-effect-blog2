/**
 * 検索APIエンドポイント
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { SearchEngine } from '@/lib/search/search-engine'
import type { SearchOptions, SearchResponse } from '@/lib/search/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { query, options = {} } = req.body
    
    // クエリの検証
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query parameter' })
    }
    
    // 検索オプションの検証と正規化
    const searchOptions: SearchOptions = {
      limit: Math.min(options.limit || 20, 100),
      offset: Math.max(options.offset || 0, 0),
      searchType: options.searchType || 'all',
      filters: options.filters || {},
      sortBy: options.sortBy || 'relevance',
      sortOrder: options.sortOrder || 'desc'
    }
    
    // 検索エンジンの初期化と検索実行
    const searchEngine = new SearchEngine()
    const results = await searchEngine.search(query, searchOptions)
    
    // レスポンスヘッダーの設定
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    
    return res.status(200).json(results)
  } catch (error) {
    console.error('Search API error:', error)
    
    // エラーレスポンス
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return res.status(500).json({ 
      error: errorMessage,
      results: [],
      total: 0,
      hasMore: false,
      query: { query: req.body.query || '', type: 'simple' },
      searchTime: 0
    })
  }
}

// APIルートの設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}