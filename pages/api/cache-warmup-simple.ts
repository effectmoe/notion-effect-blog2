import { NextApiRequest, NextApiResponse } from 'next'
import { getAllPageIds } from '@/lib/get-all-pages'
import { getSiteMap } from '@/lib/get-site-map'

// グローバルな処理状態
interface WarmupState {
  isProcessing: boolean
  startTime: number
  total: number
  processed: number
  succeeded: number
  failed: number
  skipped: number
  errors: string[]
  lastUpdate: number
  currentBatch: number
  pageIds: string[]
}

// エクスポートしてリセット機能で使用できるようにする
export let warmupState: WarmupState = {
  isProcessing: false,
  startTime: 0,
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  lastUpdate: Date.now(),
  currentBatch: 0,
  pageIds: []
}

// タイムアウト設定（5分）
const PROCESSING_TIMEOUT = 5 * 60 * 1000

// Vercelの関数タイムアウト設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    // 最大実行時間を60秒に設定
    externalResolver: true,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  // キャッシュを無効化
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    const { action } = req.body || {}
    
    if (action === 'process') {
      // バックグラウンド処理に移行したため、ステータスのみ返す
      return getStatus(req, res)
    } else {
      // ウォームアップ開始
      return startWarmup(req, res)
    }
  } else if (req.method === 'GET') {
    // ステータス取得
    return getStatus(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

// ウォームアップ開始（ページリストの準備のみ）
async function startWarmup(req: NextApiRequest, res: NextApiResponse) {
  console.log('[Warmup] Start request received')
  
  // 認証チェック（オプション）
  const authHeader = req.headers.authorization
  const expectedToken = process.env.CACHE_CLEAR_TOKEN
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // 既に処理中の場合（タイムアウトチェック付き）
  if (warmupState.isProcessing) {
    // タイムアウトチェック
    if (warmupState.startTime && Date.now() - warmupState.startTime > PROCESSING_TIMEOUT) {
      console.log('[Warmup] Processing timeout detected, resetting flag')
      warmupState.isProcessing = false
      warmupState.startTime = 0
    } else {
      console.log('[Warmup] Already processing - returning status')
      return res.status(200).json({
        success: false,
        message: 'Already processing',
        state: warmupState,
        timeRemaining: PROCESSING_TIMEOUT - (Date.now() - warmupState.startTime)
      })
    }
  }

  try {
    console.log('[Warmup] Getting page list...')
    console.log('[Warmup] Environment check:', {
      NOTION_ROOT_PAGE_ID: process.env.NOTION_ROOT_PAGE_ID ? 'Set' : 'Not set',
      NOTION_ROOT_SPACE_ID: process.env.NOTION_ROOT_SPACE_ID ? 'Set' : 'Not set',
      NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST
    })
    
    // ページリスト取得
    let pageIds: string[] = []
    
    // 方法1: サイトマップから取得
    try {
      console.log('[Warmup] Trying getSiteMap...')
      const siteMap = await getSiteMap()
      if (siteMap?.canonicalPageMap) {
        pageIds = Object.keys(siteMap.canonicalPageMap)
        console.log(`[Warmup] Got ${pageIds.length} pages from site map`)
      }
    } catch (error) {
      console.error('[Warmup] Site map error:', error)
    }
    
    // 方法2: getAllPageIdsから取得
    if (pageIds.length === 0) {
      console.log('[Warmup] Trying getAllPageIds...')
      try {
        pageIds = await getAllPageIds(
          process.env.NOTION_ROOT_PAGE_ID,
          process.env.NOTION_ROOT_SPACE_ID
        )
        console.log(`[Warmup] Got ${pageIds.length} pages from getAllPageIds`)
      } catch (error) {
        console.error('[Warmup] getAllPageIds error:', error)
      }
    }
    
    // 方法3: 最低限ルートページだけでも
    if (pageIds.length === 0 && process.env.NOTION_ROOT_PAGE_ID) {
      pageIds = [process.env.NOTION_ROOT_PAGE_ID]
      console.log('[Warmup] Using only root page as fallback')
    }
    
    // ページが見つからない場合
    if (!pageIds || pageIds.length === 0) {
      console.error('[Warmup] No pages found!')
      return res.status(200).json({
        success: false,
        message: 'No pages found. Check /api/test-page-list for debugging.',
        debug: {
          rootPageId: process.env.NOTION_ROOT_PAGE_ID,
          suggestion: 'Run /api/test-page-list to diagnose the issue'
        }
      })
    }

    // 状態を初期化
    warmupState = {
      isProcessing: true,
      startTime: Date.now(),
      total: pageIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      lastUpdate: Date.now(),
      currentBatch: 0,
      pageIds: pageIds
    }

    console.log(`[Warmup] Ready to process ${pageIds.length} pages`)
    console.log(`[Warmup] First few page IDs:`, pageIds.slice(0, 5))

    // バックグラウンドで処理を開始
    startBackgroundProcessing()

    return res.status(200).json({
      success: true,
      message: 'Warmup started',
      total: pageIds.length
    })

  } catch (error: any) {
    console.error('[Warmup] Error:', error)
    // エラー時にフラグをリセット
    warmupState.isProcessing = false
    warmupState.startTime = 0
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

// バックグラウンド処理の開始
async function startBackgroundProcessing() {
  console.log('[Warmup] Starting background processing...')
  
  const processNextBatch = async () => {
    if (!warmupState.isProcessing) {
      console.log('[Warmup] Processing already stopped')
      return
    }
    
    if (warmupState.processed >= warmupState.total) {
      warmupState.isProcessing = false
      warmupState.lastUpdate = Date.now()
      console.log('[Warmup] Background processing completed - all pages processed')
      return
    }

    const BATCH_SIZE = 5
    const startIdx = warmupState.processed
    const endIdx = Math.min(startIdx + BATCH_SIZE, warmupState.pageIds.length)
    const batch = warmupState.pageIds.slice(startIdx, endIdx)
    
    console.log(`[Warmup] Processing batch: pages ${startIdx}-${endIdx} of ${warmupState.total}`)

    try {
      // バッチ内のページを処理
      const results = await Promise.allSettled(
        batch.map(pageId => warmupSinglePage(pageId))
      )
      
      // 結果を集計
      results.forEach((result, index) => {
        warmupState.processed++
        warmupState.lastUpdate = Date.now()
        const pageId = batch[index]
        
        if (result.status === 'fulfilled') {
          if (result.value.skipped) {
            warmupState.skipped++
          } else if (result.value.success) {
            warmupState.succeeded++
          } else {
            warmupState.failed++
            if (result.value.error) {
              warmupState.errors.push(`${pageId}: ${result.value.error}`)
              if (warmupState.errors.length > 10) {
                warmupState.errors = warmupState.errors.slice(-10)
              }
            }
          }
        } else {
          warmupState.failed++
          warmupState.errors.push(`${pageId}: ${result.reason}`)
        }
      })
      
      warmupState.currentBatch++
      
      // 次のバッチを処理
      if (warmupState.processed < warmupState.total) {
        // 少し待ってから次のバッチを処理（サーバー負荷軽減）
        setTimeout(processNextBatch, 1000)
      } else {
        // 全ページ処理完了
        warmupState.isProcessing = false
        warmupState.lastUpdate = Date.now()
        console.log('[Warmup] All pages processed - setting isProcessing to false')
      }
      
    } catch (error: any) {
      console.error('[Warmup] Batch error:', error)
      warmupState.errors.push(`Batch error: ${error.message}`)
      // エラーがあっても次のバッチを処理
      setTimeout(processNextBatch, 2000)
    }
  }
  
  // 最初のバッチを処理開始
  processNextBatch()
}

// バッチ処理（管理画面から定期的に呼ばれる）- 廃止予定
async function processBatch(req: NextApiRequest, res: NextApiResponse) {
  if (!warmupState.isProcessing) {
    return res.status(200).json({
      success: false,
      message: 'Not processing'
    })
  }

  const BATCH_SIZE = 3 // Vercelのタイムアウトを考慮して小さめに
  const startIdx = warmupState.currentBatch * BATCH_SIZE
  const endIdx = Math.min(startIdx + BATCH_SIZE, warmupState.pageIds.length)
  
  if (startIdx >= warmupState.pageIds.length) {
    // 処理完了
    warmupState.isProcessing = false
    warmupState.lastUpdate = Date.now()
    console.log('[Warmup] All batches completed')
    
    return res.status(200).json({
      success: true,
      completed: true,
      state: warmupState
    })
  }

  const batch = warmupState.pageIds.slice(startIdx, endIdx)
  console.log(`[Warmup] Processing batch ${warmupState.currentBatch + 1}, pages ${startIdx}-${endIdx}`)

  try {
    // バッチ内のページを処理
    const results = await Promise.allSettled(
      batch.map(pageId => warmupSinglePage(pageId))
    )
    
    // 結果を集計
    results.forEach((result, index) => {
      warmupState.processed++
      warmupState.lastUpdate = Date.now()
      const pageId = batch[index]
      
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          warmupState.skipped++
        } else if (result.value.success) {
          warmupState.succeeded++
        } else {
          warmupState.failed++
          if (result.value.error) {
            warmupState.errors.push(`${pageId}: ${result.value.error}`)
            if (warmupState.errors.length > 10) {
              warmupState.errors = warmupState.errors.slice(-10)
            }
          }
        }
      } else {
        warmupState.failed++
        warmupState.errors.push(`${pageId}: ${result.reason}`)
      }
    })
    
    // 次のバッチへ
    warmupState.currentBatch++
    
    return res.status(200).json({
      success: true,
      completed: false,
      processed: endIdx,
      total: warmupState.pageIds.length,
      state: warmupState
    })
    
  } catch (error: any) {
    console.error('[Warmup] Batch error:', error)
    warmupState.errors.push(`Batch error: ${error.message}`)
    warmupState.currentBatch++
    
    return res.status(200).json({
      success: false,
      error: error.message,
      state: warmupState
    })
  }
}

// ステータス取得
async function getStatus(req: NextApiRequest, res: NextApiResponse) {
  const elapsed = warmupState.isProcessing 
    ? Math.round((Date.now() - warmupState.startTime) / 1000)
    : 0

  const progress = warmupState.total > 0
    ? Math.round((warmupState.processed / warmupState.total) * 100)
    : 0

  console.log('[Warmup] Status request:', {
    isProcessing: warmupState.isProcessing,
    processed: warmupState.processed,
    total: warmupState.total,
    progress: progress
  })

  return res.status(200).json({
    ...warmupState,
    elapsed,
    progress,
    pageIds: undefined // ページIDリストは返さない（大きすぎるため）
  })
}

// 単一ページの処理
async function warmupSinglePage(
  pageId: string, 
  retriesLeft: number = 2
): Promise<{
  success: boolean
  skipped: boolean
  error?: string
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.NEXT_PUBLIC_HOST || 
                   'http://localhost:3000'
    
    // タイムアウト設定
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    
    // ページのURLを直接アクセスしてキャッシュウォームアップ
    const response = await fetch(`${baseUrl}/${pageId}`, {
      method: 'GET',
      headers: {
        'x-cache-warmup': 'true',
        'x-skip-redis': 'true'  // Redisをスキップ
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // キャッシュヒット
    if (response.status === 304) {
      return { success: true, skipped: true }
    }
    
    // 成功
    if (response.ok) {
      // HTMLレスポンスなのでJSONパースは不要
      return { success: true, skipped: false }
    }
    
    // 重複エラーは成功として扱う
    if (response.status === 409 || response.headers.get('x-duplicate-page')) {
      return { success: true, skipped: true }
    }
    
    // その他のエラー
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
    
  } catch (error: any) {
    // リトライ可能な場合
    if (retriesLeft > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.log(`[Warmup] Retrying ${pageId} (${retriesLeft} retries left)`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      return warmupSinglePage(pageId, retriesLeft - 1)
    }
    
    // タイムアウトや接続エラー
    return { 
      success: false, 
      skipped: false, 
      error: error.name === 'AbortError' ? 'Timeout' : error.message 
    }
  }
}