import type { NextApiRequest, NextApiResponse } from 'next'
import { SearchIndexer } from '@/lib/search/indexer'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('Testing indexer...')
    
    const indexer = new SearchIndexer()
    
    // 環境変数の確認
    const envCheck = {
      NOTION_TOKEN_V2: process.env.NOTION_TOKEN_V2 ? '設定済み' : '未設定',
      NOTION_ACTIVE_USER: process.env.NOTION_ACTIVE_USER ? '設定済み' : '未設定',
    }
    
    // 単一ページのインデックスをテスト
    const testPageId = '1ceb802cb0c681068bbdd7b2107891f5' // カフェキネシの歴史
    
    console.log('Attempting to index single page:', testPageId)
    
    try {
      const result = await indexer.indexPage(testPageId)
      
      return res.status(200).json({
        success: true,
        envCheck,
        indexResult: result,
        message: result ? 'ページのインデックスに成功しました' : 'ページがスキップされました'
      })
    } catch (indexError) {
      console.error('Index error:', indexError)
      
      return res.status(200).json({
        success: false,
        envCheck,
        error: indexError.message,
        stack: indexError.stack
      })
    }
  } catch (error) {
    console.error('Test indexer error:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}