import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { getPage } from '@/lib/notion';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';
import { updateCacheStatus, resetCacheStatus } from './cache-status';

// タイムアウト付きでPromiseを実行
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: string = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutError)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 認証チェック
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CACHE_CLEAR_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Vercelのserverlessファンクションタイムアウト対策
  // vercel.jsonで60秒に設定済み
  const maxExecutionTime = 55000; // 55秒（安全マージン）
  const executionTimer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Function execution timeout',
        message: 'The cache warmup is taking too long. Please try with fewer pages or retry later.'
      });
    }
  }, maxExecutionTime);

  try {
    const startTime = Date.now();
    console.log('[Cache Warmup] Starting cache warmup process...');
    
    // Redis接続状態を確認
    const { getCacheStats } = await import('@/lib/cache');
    const cacheStats = await getCacheStats();
    const isRedisAvailable = cacheStats.redis.connected;
    
    console.log('[Cache Warmup] Redis status:', isRedisAvailable ? 'Connected' : 'Not available');
    if (!isRedisAvailable) {
      console.warn('[Cache Warmup] Redis is not available. Using memory cache only.');
    }
    
    // ステータスをリセット
    resetCacheStatus();
    
    let pageIds: string[] = [];
    let useFallback = false;
    
    // Check if specific page IDs were provided
    const providedPageIds = req.body?.pageIds;
    if (providedPageIds && Array.isArray(providedPageIds) && providedPageIds.length > 0) {
      console.log(`[Cache Warmup] Using ${providedPageIds.length} provided page IDs`);
      pageIds = providedPageIds.filter(id => typeof id === 'string' && id.trim());
      console.log(`[Cache Warmup] After filtering: ${pageIds.length} valid page IDs`);
    }
    
    // Check if we should skip getSiteMap (e.g., right after cache clear)
    // Fixed: Only skip if explicitly requested OR if we have provided page IDs
    const skipSiteMap = req.body?.skipSiteMap === true || pageIds.length > 0;
    
    if (!skipSiteMap) {
      try {
        // 主要ページのIDを取得
        console.log('[Cache Warmup] Attempting to get site map...');
        const siteMap = await getSiteMap();
        
        // デバッグ情報
        console.log('[Cache Warmup] Site map received:', {
          hasPageMap: !!siteMap.pageMap,
          hasCanonicalPageMap: !!siteMap.canonicalPageMap,
          canonicalPageMapType: typeof siteMap.canonicalPageMap,
          canonicalPageMapKeys: siteMap.canonicalPageMap ? Object.keys(siteMap.canonicalPageMap).length : 0
        });
        
        // canonicalPageMapからページIDを取得（values側が実際のページID）
        if (siteMap.canonicalPageMap && typeof siteMap.canonicalPageMap === 'object') {
          const allPageIds = Object.values(siteMap.canonicalPageMap)
            .filter(id => typeof id === 'string' && isValidPageId(id))
            .map(id => normalizePageId(id));
          
          // シンプルにすべてのページを取得
          pageIds = allPageIds; // すべてのページをウォームアップ
          console.log('[Cache Warmup] Found pages in canonicalPageMap:', pageIds.length);
        }
      } catch (error) {
        console.log('[Cache Warmup] Error getting site map:', error.message);
        useFallback = true;
      }
    } else {
      console.log('[Cache Warmup] Skipping site map lookup as requested');
      // Only use fallback if we don't have any page IDs
      if (pageIds.length === 0) {
        useFallback = true;
      }
    }
    
    // ページIDが取得できない場合は、重要なページIDを使用
    if (pageIds.length === 0 && useFallback) {
      console.log('[Cache Warmup] Using fallback strategy');
      console.log('[Cache Warmup] Current pageIds length:', pageIds.length);
      console.log('[Cache Warmup] useFallback:', useFallback);
      
      // フォールバック: 環境変数から取得
      const envPageIds = process.env.IMPORTANT_PAGE_IDS?.split(',').filter(Boolean) || [];
      console.log('[Cache Warmup] Environment IMPORTANT_PAGE_IDS:', envPageIds.length);
      
      const rootPageId = process.env.NOTION_PAGE_ID;
      if (rootPageId && isValidPageId(rootPageId)) {
        envPageIds.unshift(normalizePageId(rootPageId));
      }
      
      pageIds = envPageIds; // すべての環境変数ページIDを使用
      
      console.log('[Cache Warmup] Using fallback page IDs:', pageIds.length);
      console.log('[Cache Warmup] Fallback IDs sample:', pageIds.slice(0, 3).map(id => id.substring(0, 8) + '...'));
    }

    // バッチ処理の設定（Redis接続状態に応じて調整）
    const BATCH_SIZE = isRedisAvailable ? 2 : 1; // 429エラー対策で大幅に削減
    const DELAY_BETWEEN_BATCHES = isRedisAvailable ? 30000 : 45000; // 429エラー対策で遅延を大幅増加
    const RETRY_COUNT = isRedisAvailable ? 3 : 2; // Redis不在時はリトライを減らす
    const RETRY_DELAY = 5000; // リトライ前の待機時間（5秒に増加）
    const PAGE_TIMEOUT = 45000; // ページ取得のタイムアウト（45秒）
    // 処理ページ数の制限を削除（すべてのページを処理）
    console.log(`[Cache Warmup] Will process all ${pageIds.length} pages in batches`);

    console.log(`[Cache Warmup] Warming up cache for ${pageIds.length} pages`);
    
    // ページIDの重複をチェック
    const uniquePageIds = [...new Set(pageIds)];
    const duplicateCount = pageIds.length - uniquePageIds.length;
    
    if (duplicateCount > 0) {
      console.warn(`[Cache Warmup] WARNING: Found ${duplicateCount} duplicate page IDs!`);
      console.log('[Cache Warmup] Original count:', pageIds.length);
      console.log('[Cache Warmup] Unique count:', uniquePageIds.length);
      
      // 重複を除去
      pageIds = uniquePageIds;
    }
    
    console.log('[Cache Warmup] Page IDs to warm up (first 10):', pageIds.slice(0, 10));
    console.log('[Cache Warmup] Page IDs format check:', pageIds.slice(0, 5).map(id => ({
      id: id,
      length: id.length,
      hasHyphens: id.includes('-'),
      isUUID: /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(id)
    })));

    if (pageIds.length === 0) {
      return res.status(200).json({
        success: true,
        warmedUp: 0,
        failed: 0,
        message: 'No pages found to warm up. Site map might be empty after cache clear.'
      });
    }

    // リトライ機能付きのページ取得
    async function fetchPageWithRetry(pageIdOrSlug: string, retries = RETRY_COUNT): Promise<any> {
      // ページIDを正規化してから使用（スコープをループの外に移動）
      let pageIdToUse = pageIdOrSlug;
      if (isValidPageId(pageIdOrSlug)) {
        pageIdToUse = normalizePageId(pageIdOrSlug);
      }
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[Cache Warmup] 🔄 Fetching page: ${pageIdOrSlug} (attempt ${attempt}/${retries})`)
          
          // タイムアウト付きでページを取得
          const result = await withTimeout(
            getPage(pageIdToUse),
            PAGE_TIMEOUT,
            `Timeout fetching page ${pageIdOrSlug} after ${PAGE_TIMEOUT}ms`
          );
          
          console.log(`[Cache Warmup] Successfully fetched: ${pageIdOrSlug}`);
          return { pageId: pageIdOrSlug, success: true };
        } catch (error: any) {
          const isLastAttempt = attempt === retries;
          console.error(`[Cache Warmup] Failed to fetch page ${pageIdOrSlug} (attempt ${attempt}):`, {
            message: error.message,
            status: error.status,
            code: error.code,
            name: error.name,
            type: error.constructor.name,
            stack: error.stack?.split('\n').slice(0, 2).join('\n')
          });
          
          // レート制限エラーの場合は長めに待つ
          if (error.status === 429 || error.code === 'rate_limited') {
            const retryAfter = parseInt(error.headers?.['retry-after'] || '60');
            console.log(`[Cache Warmup] Rate limited for ${pageIdOrSlug}. Waiting ${retryAfter} seconds...`);
            console.log(`[Cache Warmup] Rate limit details:`, {
              pageId: pageIdOrSlug,
              headers: error.headers,
              attempt: attempt,
              willRetry: !isLastAttempt
            });
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          } else if (!isLastAttempt) {
            // 指数バックオフ（より長い待機時間）
            const backoffMs = Math.min(RETRY_DELAY * Math.pow(2, attempt - 1), 30000);
            console.log(`[Cache Warmup] Retrying in ${backoffMs}ms (attempt ${attempt}/${retries})...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
          
          if (isLastAttempt) {
            // 詳細なエラー情報をログ出力
            console.error(`[Cache Warmup] FAILED PAGE DETAILS:`, {
              pageId: pageIdOrSlug,
              normalizedPageId: pageIdToUse,
              errorMessage: error.message,
              errorStatus: error.status,
              errorCode: error.code,
              errorName: error.name,
              errorStack: error.stack?.split('\n').slice(0, 3).join('\n'),
              fullError: JSON.stringify(error, null, 2)
            });
            
            return { 
              pageId: pageIdOrSlug, 
              success: false, 
              error: error.message,
              status: error.status || 'unknown',
              details: {
                code: error.code,
                name: error.name,
                normalized: pageIdToUse
              }
            };
          }
        }
      }
      return { pageId: pageIdOrSlug, success: false, error: 'Max retries exceeded' };
    }

    // バッチ処理でページを読み込み
    const results = [];
    const totalBatches = Math.ceil(pageIds.length / BATCH_SIZE);
    
    console.log(`[Cache Warmup] Processing ${pageIds.length} pages in batches of ${BATCH_SIZE} with ${DELAY_BETWEEN_BATCHES/1000}s delay`);
    
    // 初期ステータスを設定
    updateCacheStatus({
      isProcessing: true,
      total: pageIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches,
      startTime: new Date()
    });
    
    for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
      const batch = pageIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`[Cache Warmup] Processing batch ${batchNumber}/${totalBatches} (pages ${i + 1}-${Math.min(i + BATCH_SIZE, pageIds.length)} of ${pageIds.length})`);
      console.log(`[Cache Warmup] Batch pages:`, batch);
      
      // バッチ内の並列処理
      const batchResults = await Promise.allSettled(
        batch.map(pageId => fetchPageWithRetry(pageId))
      );
      
      results.push(...batchResults);
      
      // バッチ結果の詳細ログ
      const batchSuccesses = batchResults.filter(r => r.status === 'fulfilled' && r.value?.success);
      const batchFailures = batchResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success));
      
      // 個別ページの結果をログ出力
      batchResults.forEach((result, index) => {
        const pageId = batch[index];
        if (result.status === 'fulfilled' && result.value?.success) {
          console.log(`[Cache Warmup] ✅ SUCCESS: ${pageId}`);
        } else {
          const error = result.status === 'rejected' ? result.reason : (result as any).value?.error;
          console.log(`[Cache Warmup] ❌ FAILED: ${pageId} - ${error?.message || error || 'Unknown error'}`);
        }
      });
      
      console.log(`[Cache Warmup] Batch ${batchNumber} summary:`, {
        total: batch.length,
        succeeded: batchSuccesses.length,
        failed: batchFailures.length,
        successRate: `${Math.round((batchSuccesses.length / batch.length) * 100)}%`
      });
      
      // 進捗ログ
      const processedCount = Math.min((batchNumber * BATCH_SIZE), pageIds.length);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      const failCount = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)).length;
      
      console.log(`[Cache Warmup] Overall progress: ${processedCount}/${pageIds.length} pages processed (${successCount} success, ${failCount} failed)`);
      
      // ステータスを更新
      updateCacheStatus({
        processed: processedCount,
        succeeded: successCount,
        failed: failCount,
        currentBatch: batchNumber,
        // 新しいエラーを追加
        errors: batchFailures.map(r => {
          const error = r.status === 'rejected' ? r.reason?.message || 'Unknown error' : (r as any).value.error;
          const pageId = r.status === 'rejected' ? 'unknown' : (r as any).value.pageId;
          return { pageId, error: String(error), timestamp: new Date() };
        })
      });
      
      // 最後のバッチでない場合は待機
      if (i + BATCH_SIZE < pageIds.length) {
        console.log(`[Cache Warmup] Waiting ${DELAY_BETWEEN_BATCHES/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
      
      // Vercelタイムアウト対策：50秒経過したら終了
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 50000) {
        console.log(`[Cache Warmup] Approaching Vercel timeout (${elapsedTime}ms), stopping early`);
        break;
      }
    }

    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)).length;
    
    // 失敗したページの詳細を取得
    const failedDetails = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success))
      .map((r) => {
        if (r.status === 'rejected') {
          return {
            pageId: 'unknown',
            error: r.reason?.message || r.reason || 'Unknown error',
            status: 'rejected'
          };
        }
        return {
          pageId: r.value.pageId,
          error: r.value.error,
          status: r.value.status || 'unknown'
        };
      });

    console.log(`[Cache Warmup] Results: ${successful} successful, ${failed} failed out of ${pageIds.length} total`);
    
    // 成功したページのIDをログ出力
    const successfulPages = results
      .filter(r => r.status === 'fulfilled' && r.value?.success)
      .map(r => r.value.pageId);
    console.log('[Cache Warmup] Successful page IDs:', successfulPages);
    
    // 失敗の種類を分析（より詳細に）
    const failureAnalysis = failedDetails.reduce((acc, detail) => {
      const errorLower = detail.error?.toLowerCase() || '';
      const statusStr = String(detail.status);
      
      const key = statusStr === '429' ? 'rateLimited' : 
                  statusStr === '400' ? 'badRequest' :
                  statusStr === '401' ? 'unauthorized' :
                  statusStr === '403' ? 'forbidden' :
                  statusStr === '404' ? 'notFound' :
                  statusStr === '500' ? 'serverError' :
                  errorLower.includes('timeout') ? 'timeout' :
                  errorLower.includes('network') || errorLower.includes('fetch') ? 'network' :
                  errorLower.includes('could not find') ? 'pageNotFound' :
                  'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 詳細なエラーログを出力
    console.log('[Cache Warmup] 📊 Detailed failure analysis:', failureAnalysis);
    
    // 失敗ページの詳細（最初の10件のみ表示）
    if (failedDetails.length > 0) {
      console.log(`[Cache Warmup] 📋 Failed page details (showing first 10 of ${failedDetails.length}):`, 
        failedDetails.slice(0, 10).map(detail => ({
          pageId: detail.pageId,
          error: detail.error?.substring(0, 100) + (detail.error?.length > 100 ? '...' : ''),
          status: detail.status
        }))
      );
      
      // 429エラーのページを特別に表示
      const rateLimitedPages = failedDetails.filter(d => d.status === '429' || d.error?.includes('rate_limited'));
      if (rateLimitedPages.length > 0) {
        console.log(`[Cache Warmup] ⏱️ Rate limited pages (${rateLimitedPages.length}):`, 
          rateLimitedPages.map(d => d.pageId)
        );
      }
    }
    
    // 最終結果のサマリー
    const successRate = successful > 0 ? Math.round((successful / pageIds.length) * 100) : 0;
    console.log(`[Cache Warmup] 🎯 Final Results:`, {
      totalPages: pageIds.length,
      successful,
      failed,
      successRate: `${successRate}%`,
      duration: `${Math.round((Date.now() - startTime) / 1000)}s`
    });
    
    // 推奨事項
    if (failureAnalysis.rateLimited > 0) {
      console.log('[Cache Warmup] 💡 Recommendation: Increase DELAY_BETWEEN_BATCHES to reduce rate limiting');
    }
    if (failureAnalysis.timeout > 0) {
      console.log('[Cache Warmup] 💡 Recommendation: Increase PAGE_TIMEOUT for slow pages');
    }

    // 元のページ数と制限後のページ数を記録
    const originalPageCount = req.body?.pageIds?.length || pageIds.length;
    const remainingPages = Math.max(0, originalPageCount - pageIds.length);
    
    // 最終ステータスを更新
    updateCacheStatus({
      isProcessing: false,
      processed: results.length,
      succeeded: successful,
      failed,
      lastUpdate: new Date()
    });

    res.status(200).json({
      success: true,
      warmedUp: successful,
      failed,
      message: `Cache warmed up for ${successful} pages`,
      pageIds: pageIds.slice(0, 5), // デバッグ用：最初の5ページIDを返す
      totalPages: pageIds.length,
      remainingPages,
      needMoreRequests: remainingPages > 0,
      failedDetails: failedDetails.slice(0, 10), // 最初の10個の失敗詳細
      debug: {
        totalAttempted: pageIds.length,
        originalPageCount,
        successful,
        failed,
        failureAnalysis,
        batchSize: BATCH_SIZE,
        totalBatches,
        processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
      }
    });

  } catch (error) {
    console.error('Cache warmup error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to warm up cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } finally {
    // タイマーをクリア
    clearTimeout(executionTimer);
  }
}