import { NextApiRequest, NextApiResponse } from 'next';
import { getAllPageIds } from '@/lib/get-all-pages';

// 処理状態の管理
const processingStatus = {
  isProcessing: false,
  startTime: 0,
  processed: 0,
  total: 0,
  succeeded: 0,
  failed: 0,
  skipped: 0,
  errors: [] as Array<{ pageId: string; error: string }>
};

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

  // 既に処理中の場合は拒否
  if (processingStatus.isProcessing) {
    return res.status(409).json({ 
      error: 'Warmup already in progress',
      status: processingStatus 
    });
  }

  try {
    // 重複を除外したページリストを取得
    const pageIds = await getAllPageIds(
      process.env.NOTION_ROOT_PAGE_ID,
      process.env.NOTION_ROOT_SPACE_ID
    );

    if (pageIds.length === 0) {
      return res.status(400).json({ error: 'No pages found' });
    }

    console.log(`[Warmup Optimized] Starting warmup for ${pageIds.length} unique pages`);

    // 処理開始
    processingStatus.isProcessing = true;
    processingStatus.startTime = Date.now();
    processingStatus.total = pageIds.length;
    processingStatus.processed = 0;
    processingStatus.succeeded = 0;
    processingStatus.failed = 0;
    processingStatus.skipped = 0;
    processingStatus.errors = [];

    // 非同期で処理開始
    processWarmupBatch(pageIds).then(() => {
      processingStatus.isProcessing = false;
      const duration = (Date.now() - processingStatus.startTime) / 1000;
      console.log(`[Warmup Optimized] ✅ Completed in ${duration.toFixed(1)}s`);
      console.log(`[Warmup Optimized] Results: Success=${processingStatus.succeeded}, Skip=${processingStatus.skipped}, Fail=${processingStatus.failed}`);
    }).catch(error => {
      console.error('[Warmup Optimized] ❌ Batch processing failed:', error);
      processingStatus.isProcessing = false;
    });

    // 即座にレスポンス
    return res.status(202).json({
      success: true,
      message: 'Warmup started',
      total: pageIds.length,
      statusUrl: '/api/cache-warmup-status'
    });

  } catch (error: any) {
    console.error('[Warmup Optimized] Error:', error);
    processingStatus.isProcessing = false;
    return res.status(500).json({ error: error.message });
  }
}

// 最適化されたバッチ処理
async function processWarmupBatch(pageIds: string[]) {
  const CONCURRENT_LIMIT = 5;  // 同時実行数を減らして安定性重視
  const CHUNK_SIZE = 10;       // チャンクサイズ
  
  // チャンク分割
  const chunks: string[][] = [];
  for (let i = 0; i < pageIds.length; i += CHUNK_SIZE) {
    chunks.push(pageIds.slice(i, i + CHUNK_SIZE));
  }

  // 各チャンクを順次処理
  for (const [index, chunk] of chunks.entries()) {
    console.log(`[Warmup Optimized] Processing chunk ${index + 1}/${chunks.length} (${chunk.length} pages)`);
    
    // チャンク内で並列処理（制限付き）
    const promises = [];
    for (let i = 0; i < chunk.length; i += CONCURRENT_LIMIT) {
      const batch = chunk.slice(i, i + CONCURRENT_LIMIT);
      promises.push(processBatch(batch));
    }
    
    await Promise.all(promises);
    
    // 進捗ログ
    const progress = Math.round((processingStatus.processed / processingStatus.total) * 100);
    console.log(
      `[Warmup Optimized] Progress: ${processingStatus.processed}/${processingStatus.total} (${progress}%) - ` +
      `Success: ${processingStatus.succeeded}, Skip: ${processingStatus.skipped}, Fail: ${processingStatus.failed}`
    );
    
    // 少し待機（サーバー負荷軽減）
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// バッチ処理
async function processBatch(pageIds: string[]) {
  const results = await Promise.allSettled(
    pageIds.map(pageId => warmupPage(pageId))
  );
  
  results.forEach((result, index) => {
    processingStatus.processed++;
    const pageId = pageIds[index];
    
    if (result.status === 'fulfilled') {
      if (result.value.cached) {
        processingStatus.skipped++;
        console.log(`[Warmup Optimized] ⏭️ Skipped (cached/duplicate): ${pageId}`);
      } else if (result.value.success) {
        processingStatus.succeeded++;
        console.log(`[Warmup Optimized] ✅ Success: ${pageId}`);
      } else {
        processingStatus.failed++;
        processingStatus.errors.push({
          pageId,
          error: result.value.error || 'Unknown error'
        });
        console.log(`[Warmup Optimized] ❌ Failed: ${pageId} - ${result.value.error}`);
      }
    } else {
      processingStatus.failed++;
      processingStatus.errors.push({
        pageId,
        error: result.reason?.message || 'Unknown error'
      });
      console.log(`[Warmup Optimized] ❌ Failed: ${pageId} - ${result.reason?.message}`);
    }
  });
}

// 個別ページのウォームアップ
async function warmupPage(pageId: string): Promise<{
  success: boolean;
  cached: boolean;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.NEXT_PUBLIC_HOST || 
                   'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/notion-page-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cache-warmup': 'true'
      },
      body: JSON.stringify({ 
        pageId,
        skipDuplicateCheck: true  // 重複チェックをスキップ
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    // 304 = キャッシュ済み
    if (response.status === 304) {
      return { success: true, cached: true };
    }
    
    if (!response.ok) {
      // 重複エラーは警告として処理を継続
      if (response.status === 409) {
        console.warn(`[Warmup Optimized] Duplicate page skipped: ${pageId}`);
        return { success: true, cached: true };
      }
      
      throw new Error(`HTTP ${response.status}`);
    }
    
    await response.json();
    return { success: true, cached: false };
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, cached: false, error: 'Timeout' };
    }
    
    // エラーメッセージから重複エラーを検出
    if (error.message?.includes('duplicate')) {
      console.warn(`[Warmup Optimized] Duplicate error for ${pageId}, skipping`);
      return { success: true, cached: true };
    }
    
    return { success: false, cached: false, error: error.message };
  }
}

// ステータス取得（エクスポート）
export function getWarmupStatus() {
  const elapsed = processingStatus.isProcessing 
    ? (Date.now() - processingStatus.startTime) / 1000 
    : 0;
    
  const errorSummary: Record<string, number> = {};
  processingStatus.errors.forEach(err => {
    const key = err.error.includes('Timeout') ? 'timeout' :
                err.error.includes('duplicate') ? 'duplicate' :
                err.error.includes('429') ? 'rateLimited' :
                err.error.includes('HTTP 4') ? 'notFound' :
                'other';
    errorSummary[key] = (errorSummary[key] || 0) + 1;
  });
    
  return {
    ...processingStatus,
    elapsedSeconds: Math.round(elapsed),
    progress: processingStatus.total > 0 
      ? Math.round((processingStatus.processed / processingStatus.total) * 100)
      : 0,
    errorSummary,
    recentErrors: processingStatus.errors.slice(-5) // 最新5件のエラー
  };
}