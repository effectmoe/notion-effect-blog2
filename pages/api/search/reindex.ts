/**
 * 検索インデックス再構築APIエンドポイント
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { SearchIndexer } from '@/lib/search/indexer'

// 再インデックス処理のステータスを管理
let indexingStatus = {
  isIndexing: false,
  lastIndexed: null as string | null,
  progress: 0,
  error: null as string | null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 認証チェック（本番環境では適切な認証を実装してください）
  const authToken = req.headers.authorization
  const expectedToken = process.env.REINDEX_AUTH_TOKEN
  
  if (expectedToken && authToken !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  switch (req.method) {
    case 'POST':
      return handleReindex(req, res)
    case 'GET':
      return handleStatus(req, res)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

/**
 * インデックス再構築の実行
 */
async function handleReindex(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 既にインデックス中の場合はエラー
  if (indexingStatus.isIndexing) {
    return res.status(409).json({ 
      error: 'Indexing already in progress',
      status: indexingStatus
    })
  }
  
  const { mode = 'full', pageIds } = req.body
  
  // インデックス処理を非同期で開始
  indexingStatus = {
    isIndexing: true,
    lastIndexed: null,
    progress: 0,
    error: null
  }
  
  // 非同期でインデックス処理を実行
  performIndexing(mode, pageIds).catch(error => {
    console.error('Indexing error:', error)
    indexingStatus.error = error.message
  })
  
  return res.status(202).json({ 
    message: 'Indexing started',
    status: indexingStatus
  })
}

/**
 * インデックス処理の実行
 */
async function performIndexing(
  mode: 'full' | 'incremental',
  pageIds?: string[]
) {
  const indexer = new SearchIndexer()
  
  try {
    if (mode === 'full') {
      // フルインデックスの構築
      const stats = await indexer.buildFullIndex()
      
      indexingStatus = {
        isIndexing: false,
        lastIndexed: new Date().toISOString(),
        progress: 100,
        error: null
      }
      
      console.log('Full index completed:', stats)
    } else if (mode === 'incremental' && pageIds) {
      // インクリメンタル更新
      await indexer.updatePagesIndex(pageIds)
      
      indexingStatus = {
        isIndexing: false,
        lastIndexed: new Date().toISOString(),
        progress: 100,
        error: null
      }
      
      console.log(`Updated index for ${pageIds.length} pages`)
    } else {
      throw new Error('Invalid indexing mode or missing pageIds')
    }
  } catch (error) {
    indexingStatus = {
      isIndexing: false,
      lastIndexed: indexingStatus.lastIndexed,
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    throw error
  }
}

/**
 * インデックス状態の取得
 */
async function handleStatus(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const indexer = new SearchIndexer()
  
  try {
    // インデックスの統計情報を取得
    const stats = await indexer.getIndexStats()
    const isValid = await indexer.isIndexValid()
    
    return res.status(200).json({
      status: indexingStatus,
      stats,
      isValid
    })
  } catch (error) {
    console.error('Error getting index status:', error)
    return res.status(500).json({ 
      error: 'Failed to get index status',
      status: indexingStatus
    })
  }
}

// APIルートの設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}