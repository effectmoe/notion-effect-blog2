import { NextApiRequest, NextApiResponse } from 'next'
import { getAllPageIds } from '@/lib/get-all-pages'
import { getSiteMap } from '@/lib/get-site-map'

// グローバルな処理状態（正常動作版と同じ構造）
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

// グローバル状態を確実に保持するためにglobalオブジェクトを使用
declare global {
  var warmupState: WarmupState | undefined
}

// グローバル状態の初期化
if (!global.warmupState) {
  console.log('[Warmup] Initializing global state')
  global.warmupState = {
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
}

// デバッグ用にグローバル状態を確認
console.log('[Warmup] Script loaded, current state:', {
  isProcessing: global.warmupState.isProcessing,
  total: global.warmupState.total,
  currentBatch: global.warmupState.currentBatch
})

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
  console.log(`[Warmup] ${req.method} request received`, req.body)
  console.log('[Warmup] Global state before processing:', {
    isProcessing: global.warmupState!.isProcessing,
    total: global.warmupState!.total
  })

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
      // バッチ処理を実行
      return processBatch(req, res)
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
  
  // 既に処理中の場合
  if (global.warmupState!.isProcessing) {
    console.log('[Warmup] Already processing')
    return res.status(200).json({
      success: false,
      message: 'Already processing',
      state: global.warmupState
    })
  }

  try {
    console.log('[Warmup] Getting page list...')
    console.log('[Warmup] Environment check:', {
      NOTION_ROOT_PAGE_ID: process.env.NOTION_ROOT_PAGE_ID ? 'Set' : 'Not set',
      NOTION_ROOT_SPACE_ID: process.env.NOTION_ROOT_SPACE_ID ? 'Set' : 'Not set',
      NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST
    })
    
    // ページリスト取得（正常動作版と同じロジック）
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
    
    // ページが見つからない場合（デバッグ用にダミーデータを使用）
    if (!pageIds || pageIds.length === 0) {
      console.warn('[Warmup] No pages found! Using dummy data for testing')
      // デバッグ用のダミーページID
      pageIds = Array(20).fill(null).map((_, i) => `test-page-${i}`)
    }

    // 状態を初期化
    global.warmupState = {
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
    console.log('[Warmup] State initialized:', {
      isProcessing: global.warmupState.isProcessing,
      total: global.warmupState.total,
      pageIdsLength: global.warmupState.pageIds.length
    })

    return res.status(200).json({
      success: true,
      message: 'Warmup initialized',
      total: pageIds.length,
      needsProcessing: true
    })

  } catch (error: any) {
    console.error('[Warmup] Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

// バッチ処理（管理画面から定期的に呼ばれる）
async function processBatch(req: NextApiRequest, res: NextApiResponse) {
  console.log('[Warmup] processBatch called')
  console.log('[Warmup] Current state:', {
    isProcessing: global.warmupState!.isProcessing,
    currentBatch: global.warmupState!.currentBatch,
    total: global.warmupState!.total
  })

  if (!global.warmupState!.isProcessing) {
    console.log('[Warmup] Not processing - returning error')
    return res.status(200).json({
      success: false,
      message: 'Not processing',
      debug: {
        isProcessing: global.warmupState!.isProcessing,
        total: global.warmupState!.total,
        hint: 'Call POST /api/cache-warmup-simple first to initialize'
      }
    })
  }

  const BATCH_SIZE = 3 // 正常動作版と同じ
  const startIdx = global.warmupState!.currentBatch * BATCH_SIZE
  const endIdx = Math.min(startIdx + BATCH_SIZE, global.warmupState!.pageIds.length)
  
  console.log(`[Warmup] Processing batch ${global.warmupState!.currentBatch + 1}`, {
    startIdx,
    endIdx,
    totalPages: global.warmupState!.pageIds.length
  })

  if (startIdx >= global.warmupState!.pageIds.length) {
    // 処理完了
    global.warmupState!.isProcessing = false
    global.warmupState!.lastUpdate = Date.now()
    console.log('[Warmup] All batches completed')
    
    return res.status(200).json({
      success: true,
      completed: true,
      state: global.warmupState
    })
  }

  const batch = global.warmupState!.pageIds.slice(startIdx, endIdx)
  console.log(`[Warmup] Processing pages:`, batch.slice(0, 3))

  try {
    // バッチ内のページを処理
    const results = await Promise.allSettled(
      batch.map(pageId => warmupSinglePage(pageId))
    )
    
    // 結果を集計
    results.forEach((result, index) => {
      global.warmupState!.processed++
      global.warmupState!.lastUpdate = Date.now()
      const pageId = batch[index]
      
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          global.warmupState!.skipped++
        } else if (result.value.success) {
          global.warmupState!.succeeded++
        } else {
          global.warmupState!.failed++
          if (result.value.error) {
            global.warmupState!.errors.push(`${pageId}: ${result.value.error}`)
            if (global.warmupState!.errors.length > 10) {
              global.warmupState!.errors = global.warmupState!.errors.slice(-10)
            }
          }
        }
      } else {
        global.warmupState!.failed++
        global.warmupState!.errors.push(`${pageId}: ${result.reason}`)
      }
    })
    
    // 次のバッチへ
    global.warmupState!.currentBatch++
    
    const response = {
      success: true,
      completed: false,
      processed: global.warmupState!.processed,
      total: global.warmupState!.total,
      currentBatch: global.warmupState!.currentBatch,
      state: global.warmupState
    }
    
    console.log('[Warmup] Batch completed:', response)
    return res.status(200).json(response)
    
  } catch (error: any) {
    console.error('[Warmup] Batch error:', error)
    global.warmupState!.errors.push(`Batch error: ${error.message}`)
    
    return res.status(200).json({
      success: false,
      error: error.message,
      state: global.warmupState
    })
  }
}

// ステータス取得
function getStatus(req: NextApiRequest, res: NextApiResponse) {
  const elapsed = global.warmupState!.isProcessing 
    ? Math.round((Date.now() - global.warmupState!.startTime) / 1000)
    : 0

  const progress = global.warmupState!.total > 0
    ? Math.round((global.warmupState!.processed / global.warmupState!.total) * 100)
    : 0

  const response = {
    isProcessing: global.warmupState!.isProcessing,
    processed: global.warmupState!.processed,
    succeeded: global.warmupState!.succeeded,
    failed: global.warmupState!.failed,
    skipped: global.warmupState!.skipped,
    total: global.warmupState!.total,
    progress,
    elapsed,
    errors: global.warmupState!.errors,
    currentBatch: global.warmupState!.currentBatch,
    needsProcessing: global.warmupState!.isProcessing && 
                     global.warmupState!.currentBatch * 3 < global.warmupState!.total
  }

  console.log('[Warmup] Status request:', response)
  return res.status(200).json(response)
}

// 単一ページの処理（正常動作版と同じロジック）
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
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 100)}`)
    
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