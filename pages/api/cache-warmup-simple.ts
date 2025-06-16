import { NextApiRequest, NextApiResponse } from 'next'
import { getAllPageIds } from '@/lib/get-all-pages'
import { getSiteMap } from '@/lib/get-site-map'
import { db } from '@/lib/db'

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

// シンプルで安全なキー名（namespaceで既に分離されている）
const WARMUP_STATE_KEY = 'warmup:state'

// 状態取得
async function getWarmupState(): Promise<WarmupState> {
  try {
    const state = await db.get(WARMUP_STATE_KEY)
    return state || {
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
  } catch (error) {
    console.error('[Warmup] DB error:', error)
    // デフォルト値を返す
    return {
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
}

// 状態保存
async function saveWarmupState(state: WarmupState): Promise<void> {
  try {
    await db.set(WARMUP_STATE_KEY, state)
  } catch (error) {
    console.error('[Warmup] Save error:', error)
  }
}

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
  
  // デバッグ用: リクエストごとに状態を確認
  const currentState = await getWarmupState()
  console.log('[Warmup Debug] State before processing:', {
    isProcessing: currentState.isProcessing,
    total: currentState.total,
    currentBatch: currentState.currentBatch
  })

  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
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
  } else if (req.method === 'DELETE') {
    // 状態をリセット
    return resetWarmup(req, res)
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
  
  // 現在の状態を取得
  const currentState = await getWarmupState()
  
  // 既に処理中の場合
  if (currentState.isProcessing) {
    console.log('[Warmup] Already processing')
    return res.status(200).json({
      success: false,
      message: 'Already processing',
      state: currentState
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

    // 新しい状態を作成
    const newState: WarmupState = {
      isProcessing: true,  // 重要: 必ずtrueに設定
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
    
    // 状態をDBに保存
    await saveWarmupState(newState)

    console.log(`[Warmup] Ready to process ${pageIds.length} pages`)
    console.log(`[Warmup] First few page IDs:`, pageIds.slice(0, 5))
    console.log('[Warmup] State after initialization:', {
      isProcessing: newState.isProcessing,  // これがtrueになっているか確認
      total: newState.total,
      pageIdsLength: newState.pageIds.length
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
  
  // 現在の状態を取得
  const warmupState = await getWarmupState()
  
  console.log('[Warmup] Current state:', {
    isProcessing: warmupState.isProcessing,
    currentBatch: warmupState.currentBatch,
    total: warmupState.total
  })

  if (!warmupState.isProcessing) {
    console.log('[Warmup] Not processing - returning error')
    return res.status(200).json({
      success: false,
      message: 'Not processing',
      debug: {
        isProcessing: warmupState.isProcessing,
        total: warmupState.total,
        hint: 'Call POST /api/cache-warmup-simple first to initialize'
      }
    })
  }

  const BATCH_SIZE = 3 // 正常動作版と同じ
  const startIdx = warmupState.currentBatch * BATCH_SIZE
  const endIdx = Math.min(startIdx + BATCH_SIZE, warmupState.pageIds.length)
  
  console.log(`[Warmup] Processing batch ${warmupState.currentBatch + 1}`, {
    startIdx,
    endIdx,
    totalPages: warmupState.pageIds.length
  })

  if (startIdx >= warmupState.pageIds.length) {
    // 処理完了
    warmupState.isProcessing = false
    warmupState.lastUpdate = Date.now()
    
    // 完了状態をDBに保存
    await saveWarmupState(warmupState)
    
    console.log('[Warmup] All batches completed')
    
    return res.status(200).json({
      success: true,
      completed: true,
      state: warmupState
    })
  }

  const batch = warmupState.pageIds.slice(startIdx, endIdx)
  console.log(`[Warmup] Processing pages:`, batch.slice(0, 3))

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
    
    // 更新された状態をDBに保存
    await saveWarmupState(warmupState)
    
    const response = {
      success: true,
      completed: false,
      processed: warmupState.processed,
      total: warmupState.total,
      currentBatch: warmupState.currentBatch,
      state: warmupState
    }
    
    console.log('[Warmup] Batch completed:', response)
    return res.status(200).json(response)
    
  } catch (error: any) {
    console.error('[Warmup] Batch error:', error)
    warmupState.errors.push(`Batch error: ${error.message}`)
    
    // エラー状態もDBに保存
    await saveWarmupState(warmupState)
    
    return res.status(200).json({
      success: false,
      error: error.message,
      state: warmupState
    })
  }
}

// ステータス取得
async function getStatus(req: NextApiRequest, res: NextApiResponse) {
  // 現在の状態を取得
  const warmupState = await getWarmupState()
  
  const elapsed = warmupState.isProcessing 
    ? Math.round((Date.now() - warmupState.startTime) / 1000)
    : 0

  const progress = warmupState.total > 0
    ? Math.round((warmupState.processed / warmupState.total) * 100)
    : 0

  const response = {
    isProcessing: warmupState.isProcessing,
    processed: warmupState.processed,
    succeeded: warmupState.succeeded,
    failed: warmupState.failed,
    skipped: warmupState.skipped,
    total: warmupState.total,
    progress,
    elapsed,
    errors: warmupState.errors,
    currentBatch: warmupState.currentBatch,
    needsProcessing: warmupState.isProcessing && 
                     warmupState.currentBatch * 3 < warmupState.total
  }

  console.log('[Warmup] Status request:', response)
  return res.status(200).json(response)
}

// 状態リセット
async function resetWarmup(req: NextApiRequest, res: NextApiResponse) {
  console.log('[Warmup] Reset request received')
  
  // 認証チェック（オプション）
  const authHeader = req.headers.authorization
  const expectedToken = process.env.CACHE_CLEAR_TOKEN
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // リセット状態を作成
  const resetState: WarmupState = {
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
  
  // DBに保存
  await saveWarmupState(resetState)
  
  console.log('[Warmup] State reset completed')
  
  return res.status(200).json({
    success: true,
    message: 'Warmup state reset',
    state: resetState
  })
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