import { NextApiRequest, NextApiResponse } from 'next'
import { SearchEngine } from '@/lib/search/search-engine'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const searchEngine = new SearchEngine()
    
    // GETとPOSTの両方をサポート
    const query = req.method === 'GET' 
      ? req.query.query as string
      : req.body.query
    
    const action = req.method === 'GET'
      ? req.query.action as string
      : req.body.action

    // インデックスの再構築
    if (action === 'reindex') {
      await searchEngine.reindexAll()
      return res.status(200).json({ 
        success: true, 
        message: 'Reindexing completed' 
      })
    }

    // 検索クエリが必要
    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter is required' 
      })
    }

    // 検索を実行
    const results = await searchEngine.search(query)
    
    res.status(200).json({
      success: true,
      query,
      totalResults: results.length,
      results
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}