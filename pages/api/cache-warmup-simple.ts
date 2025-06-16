import { NextApiRequest, NextApiResponse } from 'next';
import { getAllPageIds } from '@/lib/get-all-pages';

// グローバルな処理状態（シンプル）
let warmupState = {
  isProcessing: false,
  startTime: 0,
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  skipped: 0,
  errors: [] as string[],
  lastUpdate: Date.now()
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // ウォームアップ開始
    return startWarmup(req, res);
  } else if (req.method === 'GET') {
    // ステータス取得
    return getStatus(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// ウォームアップ開始
async function startWarmup(req: NextApiRequest, res: NextApiResponse) {
  // 認証チェック（オプション）
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CACHE_CLEAR_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 既に処理中の場合
  if (warmupState.isProcessing) {
    return res.status(200).json({
      success: false,
      message: 'Already processing',
      state: warmupState
    });
  }

  try {
    console.log('[Warmup Simple] Starting warmup process...');
    
    // ページリスト取得
    const pageIds = await getAllPageIds(
      process.env.NOTION_ROOT_PAGE_ID,
      process.env.NOTION_ROOT_SPACE_ID
    );

    if (pageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No pages found'
      });
    }

    console.log(`[Warmup Simple] Found ${pageIds.length} unique pages`);

    // 状態をリセット
    warmupState = {
      isProcessing: true,
      startTime: Date.now(),
      total: pageIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      lastUpdate: Date.now()
    };

    // 非同期で処理開始
    processAllPages(pageIds).then(() => {
      warmupState.isProcessing = false;
      warmupState.lastUpdate = Date.now();
      const duration = (Date.now() - warmupState.startTime) / 1000;
      console.log(`[Warmup Simple] ✅ Completed in ${duration.toFixed(1)}s`);
      console.log(`[Warmup Simple] Results: Success=${warmupState.succeeded}, Skip=${warmupState.skipped}, Fail=${warmupState.failed}`);
    }).catch(error => {
      console.error('[Warmup Simple] ❌ Fatal error:', error);
      warmupState.isProcessing = false;
      warmupState.errors.push(`Fatal: ${error.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Warmup started',
      total: pageIds.length
    });

  } catch (error: any) {
    console.error('[Warmup Simple] Start error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ステータス取得
async function getStatus(req: NextApiRequest, res: NextApiResponse) {
  const elapsed = warmupState.isProcessing 
    ? Math.round((Date.now() - warmupState.startTime) / 1000)
    : 0;

  const progress = warmupState.total > 0
    ? Math.round((warmupState.processed / warmupState.total) * 100)
    : 0;

  return res.status(200).json({
    ...warmupState,
    elapsed,
    progress
  });
}

// ページ処理
async function processAllPages(pageIds: string[]) {
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
    const batch = pageIds.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i/BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pageIds.length/BATCH_SIZE);
    
    console.log(`[Warmup Simple] Processing batch ${batchNum}/${totalBatches} (${batch.length} pages)`);
    
    // バッチ処理
    const results = await Promise.allSettled(
      batch.map(pageId => warmupSinglePage(pageId))
    );
    
    // 結果集計
    results.forEach((result, index) => {
      warmupState.processed++;
      warmupState.lastUpdate = Date.now();
      const pageId = batch[index];
      
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          warmupState.skipped++;
          console.log(`[Warmup Simple] ⏭️ Skipped: ${pageId}`);
        } else if (result.value.success) {
          warmupState.succeeded++;
          console.log(`[Warmup Simple] ✅ Success: ${pageId}`);
        } else {
          warmupState.failed++;
          if (result.value.error) {
            warmupState.errors.push(`${pageId}: ${result.value.error}`);
            console.log(`[Warmup Simple] ❌ Failed: ${pageId} - ${result.value.error}`);
          }
        }
      } else {
        warmupState.failed++;
        warmupState.errors.push(`${pageId}: ${result.reason}`);
        console.log(`[Warmup Simple] ❌ Failed: ${pageId} - ${result.reason}`);
      }
    });
    
    // Keep only last 10 errors to avoid memory issues
    if (warmupState.errors.length > 10) {
      warmupState.errors = warmupState.errors.slice(-10);
    }
    
    // 進捗ログ
    const progress = Math.round((warmupState.processed / warmupState.total) * 100);
    console.log(
      `[Warmup Simple] Progress: ${warmupState.processed}/${warmupState.total} (${progress}%) - ` +
      `Success: ${warmupState.succeeded}, Skip: ${warmupState.skipped}, Fail: ${warmupState.failed}`
    );
    
    // 少し待機（サーバー負荷軽減）
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 単一ページの処理
async function warmupSinglePage(pageId: string): Promise<{
  success: boolean;
  skipped: boolean;
  error?: string;
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.NEXT_PUBLIC_HOST || 
                   'http://localhost:3000';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト
    
    const response = await fetch(`${baseUrl}/api/notion-page-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cache-warmup': 'true',
        'x-skip-redis': 'true'  // Redisをスキップ
      },
      body: JSON.stringify({ pageId }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 304) {
      return { success: true, skipped: true };
    }
    
    if (!response.ok) {
      // 重複エラーは成功として扱う
      if (response.status === 409 || response.headers.get('x-duplicate-page')) {
        return { success: true, skipped: true };
      }
      return { success: false, skipped: false, error: `HTTP ${response.status}` };
    }
    
    await response.json();
    return { success: true, skipped: false };
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, skipped: false, error: 'Timeout' };
    }
    
    // 重複エラーメッセージをチェック
    if (error.message?.includes('duplicate')) {
      return { success: true, skipped: true };
    }
    
    return { 
      success: false, 
      skipped: false, 
      error: error.message || 'Unknown error'
    };
  }
}