import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { getPage } from '@/lib/notion';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';

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

    // バッチ処理の設定（より保守的な設定）
    const BATCH_SIZE = 3; // 一度に処理するページ数（より少なく）
    const DELAY_BETWEEN_BATCHES = 1200; // バッチ間の待機時間（ミリ秒）
    const RETRY_COUNT = 2; // リトライ回数（より少なく）
    const RETRY_DELAY = 2000; // リトライ前の待機時間（ミリ秒）
    const PAGE_TIMEOUT = 10000; // ページ取得のタイムアウト（10秒）
    const MAX_PAGES_PER_REQUEST = 30; // 1リクエストで処理する最大ページ数（より少なく）

    // 処理ページ数を制限（必要に応じて）
    if (pageIds.length > MAX_PAGES_PER_REQUEST) {
      console.log(`[Cache Warmup] Limiting pages from ${pageIds.length} to ${MAX_PAGES_PER_REQUEST} for this request`);
      pageIds = pageIds.slice(0, MAX_PAGES_PER_REQUEST);
    }

    console.log(`[Cache Warmup] Warming up cache for ${pageIds.length} pages`);
    console.log('[Cache Warmup] Page IDs to warm up:', pageIds.map(id => {
      if (typeof id === 'string' && id.length > 8) {
        return id.substring(0, 8) + '...';
      }
      return id;
    }));

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
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[Cache Warmup] Fetching page: ${pageIdOrSlug} (attempt ${attempt}/${retries})`);
          
          // ページIDを正規化してから使用
          let pageIdToUse = pageIdOrSlug;
          if (isValidPageId(pageIdOrSlug)) {
            pageIdToUse = normalizePageId(pageIdOrSlug);
          }
          
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
            const retryAfter = error.headers?.['retry-after'] || 60;
            console.log(`[Cache Warmup] Rate limited. Waiting ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          } else if (!isLastAttempt) {
            // 指数バックオフ
            const backoffMs = Math.min(RETRY_DELAY * Math.pow(2, attempt - 1), 10000);
            console.log(`[Cache Warmup] Retrying in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
          
          if (isLastAttempt) {
            return { 
              pageId: pageIdOrSlug, 
              success: false, 
              error: error.message,
              status: error.status || 'unknown'
            };
          }
        }
      }
      return { pageId: pageIdOrSlug, success: false, error: 'Max retries exceeded' };
    }

    // バッチ処理でページを読み込み
    const results = [];
    const totalBatches = Math.ceil(pageIds.length / BATCH_SIZE);
    
    console.log(`[Cache Warmup] Processing ${pageIds.length} pages in ${totalBatches} batches of ${BATCH_SIZE}`);
    
    for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
      const batch = pageIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`[Cache Warmup] Processing batch ${batchNumber}/${totalBatches} (${batch.length} pages)`);
      
      // バッチ内の並列処理
      const batchResults = await Promise.allSettled(
        batch.map(pageId => fetchPageWithRetry(pageId))
      );
      
      results.push(...batchResults);
      
      // 進捗ログ
      const processedCount = Math.min((batchNumber * BATCH_SIZE), pageIds.length);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      const failCount = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)).length;
      
      console.log(`[Cache Warmup] Progress: ${processedCount}/${pageIds.length} pages processed (${successCount} success, ${failCount} failed)`);
      
      // 最後のバッチでない場合は待機
      if (i + BATCH_SIZE < pageIds.length) {
        console.log(`[Cache Warmup] Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
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
    
    // 失敗の種類を分析
    const failureAnalysis = failedDetails.reduce((acc, detail) => {
      const errorLower = detail.error?.toLowerCase() || '';
      const key = detail.status === '429' || detail.status === 429 ? 'rateLimited' : 
                  errorLower.includes('timeout') ? 'timeout' :
                  errorLower.includes('not found') || errorLower.includes('could not find') ? 'notFound' :
                  errorLower.includes('unauthorized') || detail.status === '401' || detail.status === 401 ? 'unauthorized' :
                  errorLower.includes('network') || errorLower.includes('fetch') ? 'network' :
                  'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 元のページ数と制限後のページ数を記録
    const originalPageCount = req.body?.pageIds?.length || pageIds.length;
    const remainingPages = Math.max(0, originalPageCount - pageIds.length);

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
        maxPagesPerRequest: MAX_PAGES_PER_REQUEST,
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