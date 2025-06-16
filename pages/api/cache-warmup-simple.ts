import { NextApiRequest, NextApiResponse } from 'next'
import { getAllPageIds } from '@/lib/get-all-pages'
import { getSiteMap } from '@/lib/get-site-map'
import { initRedis, storage } from '@/lib/redis'

// Notion APIレート制限の設定
const RATE_LIMIT = {
  requestsPerSecond: 3, // 1秒あたり3リクエストに制限
  burstLimit: 10,      // バースト時の最大リクエスト数
  retryAfter: 60000    // レート制限後の待機時間（1分）
}

// 処理状態のキー
const PROCESSING_KEY = 'warmup:processing'
const PROGRESS_KEY = 'warmup:progress'
const RATE_LIMIT_KEY = 'warmup:ratelimit'

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

// レート制限付きリクエスト実行
async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const rateLimit = await storage.get(RATE_LIMIT_KEY) || { count: 0, resetAt: now }
  
  // レート制限のリセット
  if (now > rateLimit.resetAt) {
    rateLimit.count = 0
    rateLimit.resetAt = now + 1000 // 1秒後にリセット
  }
  
  // レート制限チェック
  if (rateLimit.count >= RATE_LIMIT.requestsPerSecond) {
    const waitTime = rateLimit.resetAt - now
    console.log(`[RateLimit] Waiting ${waitTime}ms before next request`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
    return rateLimitedRequest(fn) // 再試行
  }
  
  // リクエスト実行
  try {
    rateLimit.count++
    await storage.set(RATE_LIMIT_KEY, rateLimit, 10)
    
    const result = await fn()
    return result
  } catch (error: any) {
    if (error.status === 429) {
      console.error('[RateLimit] 429 Too Many Requests - waiting 60s')
      await storage.set(RATE_LIMIT_KEY, { 
        count: RATE_LIMIT.burstLimit, 
        resetAt: now + RATE_LIMIT.retryAfter 
      }, 60)
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.retryAfter))
      return rateLimitedRequest(fn) // 再試行
    }
    throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // Redis初期化
  await initRedis()
  
  // メソッド別処理
  switch (req.method) {
    case 'GET':
      return handleStatus(req, res)
    case 'POST':
      return handleWarmup(req, res)
    case 'DELETE':
      return handleReset(req, res)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

// ステータス確認
async function handleStatus(req: NextApiRequest, res: NextApiResponse) {
  const processing = await storage.get(PROCESSING_KEY)
  const progress = await storage.get(PROGRESS_KEY) || { 
    processed: 0, 
    total: 0, 
    errors: [],
    succeeded: 0,
    failed: 0,
    skipped: 0
  }
  
  const isProcessing = !!processing
  const elapsed = processing ? Math.round((Date.now() - processing.startTime) / 1000) : 0
  const progressPercent = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0
  
  console.log('[Warmup] Status request:', {
    isProcessing,
    processed: progress.processed,
    total: progress.total,
    progress: progressPercent
  })
  
  return res.status(200).json({
    isProcessing,
    startTime: processing?.startTime || 0,
    total: progress.total,
    processed: progress.processed,
    succeeded: progress.succeeded,
    failed: progress.failed,
    skipped: progress.skipped,
    errors: progress.errors || [],
    lastUpdate: progress.lastUpdate || Date.now(),
    currentBatch: progress.currentBatch || 0,
    elapsed,
    progress: progressPercent,
    processingInfo: processing,
    completedAt: progress.completedAt
  })
}

// リセット処理
async function handleReset(req: NextApiRequest, res: NextApiResponse) {
  console.log('[Warmup] Force reset requested')
  
  // 認証チェック（オプション）
  const authHeader = req.headers.authorization
  const expectedToken = process.env.CACHE_CLEAR_TOKEN
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  await storage.delete(PROCESSING_KEY)
  await storage.delete(PROGRESS_KEY)
  await storage.delete(RATE_LIMIT_KEY)
  
  return res.status(200).json({
    message: 'Processing state reset successfully',
    timestamp: new Date().toISOString()
  })
}

// ウォームアップ実行
async function handleWarmup(req: NextApiRequest, res: NextApiResponse) {
  // 認証チェック（オプション）
  const authHeader = req.headers.authorization
  const expectedToken = process.env.CACHE_CLEAR_TOKEN
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const processingInfo = await storage.get(PROCESSING_KEY)
  
  // 既に処理中かチェック
  if (processingInfo) {
    const elapsed = Date.now() - processingInfo.startTime
    const timeout = 5 * 60 * 1000 // 5分
    
    if (elapsed < timeout) {
      return res.status(200).json({
        success: false,
        message: 'Already processing',
        state: {
          isProcessing: true,
          startTime: processingInfo.startTime
        },
        timeRemaining: timeout - elapsed,
        startTime: new Date(processingInfo.startTime).toISOString(),
        elapsed: Math.floor(elapsed / 1000) + 's'
      })
    }
    
    // タイムアウトした場合は自動リセット
    console.log('[Warmup] Processing timeout detected, auto-resetting')
    await storage.delete(PROCESSING_KEY)
  }
  
  try {
    // ページリストを取得
    console.log('[Warmup] Getting page list...')
    console.log('[Warmup] Environment check:', {
      NOTION_ROOT_PAGE_ID: process.env.NOTION_ROOT_PAGE_ID ? 'Set' : 'Not set',
      NOTION_ROOT_SPACE_ID: process.env.NOTION_ROOT_SPACE_ID ? 'Set' : 'Not set',
      NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST
    })
    
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
    
    // 処理開始
    const startInfo = {
      startTime: Date.now(),
      instanceId: Math.random().toString(36).substring(7),
      pid: process.pid
    }
    
    await storage.set(PROCESSING_KEY, startInfo, 300) // 5分のTTL
    
    // 初期進捗を保存
    const initialProgress = {
      processed: 0,
      total: pageIds.length,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      lastUpdate: Date.now(),
      currentBatch: 0,
      pageIds: pageIds,
      startTime: startInfo.startTime
    }
    
    await storage.set(PROGRESS_KEY, initialProgress, 3600) // 1時間のTTL
    
    console.log(`[Warmup] Ready to process ${pageIds.length} pages`)
    console.log(`[Warmup] First few page IDs:`, pageIds.slice(0, 5))
    
    // バックグラウンドで処理を開始
    processWarmup(startInfo, pageIds).catch(error => {
      console.error('[Warmup] Background process error:', error)
    })
    
    // レスポンスは即座に返す
    return res.status(200).json({
      success: true,
      message: 'Warmup started',
      total: pageIds.length,
      instanceId: startInfo.instanceId
    })
    
  } catch (error: any) {
    console.error('[Warmup] Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

// ウォームアップ結果の型定義
interface WarmupResult {
  success: boolean
  skipped: boolean
  error?: string
}

// 実際のウォームアップ処理
async function processWarmup(startInfo: any, pageIds: string[]) {
  const progress: {
    processed: number
    total: number
    succeeded: number
    failed: number
    skipped: number
    errors: any[]
    lastUpdate: number
    currentBatch: number
    startTime: number
    completedAt?: number
  } = {
    processed: 0,
    total: pageIds.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [] as any[],
    lastUpdate: Date.now(),
    currentBatch: 0,
    startTime: startInfo.startTime
  }
  
  try {
    // ページ処理用のキューを作成（重複排除）
    const uniquePageIds = Array.from(new Set(pageIds))
    const processedPages = new Set<string>()
    
    console.log(`[Warmup] Starting background processing for ${uniquePageIds.length} unique pages`)
    
    const BATCH_SIZE = 5
    
    for (let i = 0; i < uniquePageIds.length; i += BATCH_SIZE) {
      const batch = uniquePageIds.slice(i, Math.min(i + BATCH_SIZE, uniquePageIds.length))
      
      console.log(`[Warmup] Processing batch: pages ${i}-${i + batch.length} of ${uniquePageIds.length}`)
      
      // バッチ内のページを並列処理
      const batchResults = await Promise.allSettled(
        batch.map(pageId => {
          // 重複チェック
          if (processedPages.has(pageId)) {
            console.log(`[Warmup] Skipping duplicate page: ${pageId}`)
            return Promise.resolve({ success: true, skipped: true, error: undefined } as WarmupResult)
          }
          
          return rateLimitedRequest(async () => {
            return warmupSinglePage(pageId)
          })
        })
      )
      
      // 結果を集計
      batchResults.forEach((result, index) => {
        const pageId = batch[index]
        progress.processed++
        progress.lastUpdate = Date.now()
        
        if (result.status === 'fulfilled') {
          processedPages.add(pageId)
          
          if (result.value.skipped) {
            progress.skipped++
          } else if (result.value.success) {
            progress.succeeded++
          } else {
            progress.failed++
            if (result.value.error) {
              progress.errors.push({
                pageId,
                error: result.value.error,
                timestamp: Date.now()
              })
              if (progress.errors.length > 10) {
                progress.errors = progress.errors.slice(-10)
              }
            }
          }
        } else {
          progress.failed++
          progress.errors.push({
            pageId,
            error: result.reason?.message || 'Unknown error',
            timestamp: Date.now()
          })
        }
      })
      
      progress.currentBatch++
      
      // 進捗を更新
      await storage.set(PROGRESS_KEY, progress, 3600)
      
      // 処理継続の確認
      const currentProcessing = await storage.get(PROCESSING_KEY)
      if (!currentProcessing || currentProcessing.instanceId !== startInfo.instanceId) {
        console.log('[Warmup] Processing cancelled by another instance')
        break
      }
      
      // エラーが多すぎる場合は中断
      if (progress.errors.length > 50) {
        console.error('[Warmup] Too many errors, aborting')
        break
      }
      
      // 次のバッチまで少し待つ（サーバー負荷軽減）
      if (i + BATCH_SIZE < uniquePageIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // 処理完了
    console.log(`[Warmup] Completed: ${progress.processed}/${progress.total} pages`)
    console.log(`[Warmup] Results - Succeeded: ${progress.succeeded}, Failed: ${progress.failed}, Skipped: ${progress.skipped}`)
    
  } catch (error) {
    console.error('[Warmup] Process error:', error)
    progress.errors.push({
      pageId: 'system',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    })
  } finally {
    // 処理状態をクリア
    await storage.delete(PROCESSING_KEY)
    
    // 最終進捗を保存
    progress.completedAt = Date.now()
    await storage.set(PROGRESS_KEY, progress, 3600)
    
    console.log('[Warmup] All done - setting processing to false')
  }
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