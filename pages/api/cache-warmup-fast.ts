import { NextApiRequest, NextApiResponse } from 'next';
import { getFromCache } from '@/lib/cache';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';

// ジョブ管理（メモリ内）
export const activeJobs = new Map<string, {
  status: 'running' | 'completed' | 'failed';
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  startTime: number;
  endTime?: number;
}>();

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

  const { pageIds } = req.body;
  if (!pageIds || !Array.isArray(pageIds)) {
    return res.status(400).json({ error: 'Invalid pageIds' });
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // ジョブ情報を記録
  activeJobs.set(jobId, {
    status: 'running',
    total: pageIds.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    startTime: Date.now()
  });

  // 非同期処理を開始（待たない）
  processWarmupOptimized(jobId, pageIds).catch(error => {
    console.error(`[Warmup] Job ${jobId} failed:`, error);
    const job = activeJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.endTime = Date.now();
    }
  });

  // 即座にレスポンス
  return res.status(202).json({
    success: true,
    jobId,
    message: 'Warmup job started',
    total: pageIds.length
  });
}

// 最適化されたウォームアップ処理
async function processWarmupOptimized(jobId: string, pageIds: string[]) {
  const job = activeJobs.get(jobId);
  if (!job) return;

  console.log(`[Warmup] Starting job ${jobId} with ${pageIds.length} pages`);

  // 設定
  const CONCURRENT_REQUESTS = 10;  // 同時実行数
  const REQUEST_TIMEOUT = 15000;   // 15秒タイムアウト
  
  // ページIDをチャンクに分割
  const chunks: string[][] = [];
  for (let i = 0; i < pageIds.length; i += CONCURRENT_REQUESTS) {
    chunks.push(pageIds.slice(i, i + CONCURRENT_REQUESTS));
  }

  // 各チャンクを処理
  for (const [index, chunk] of chunks.entries()) {
    console.log(`[Warmup] Processing chunk ${index + 1}/${chunks.length} (${chunk.length} pages)`);
    
    // チャンク内のページを並列処理
    const results = await Promise.allSettled(
      chunk.map(pageId => processPageOptimized(pageId, REQUEST_TIMEOUT))
    );

    // 結果を集計
    results.forEach((result, i) => {
      job.processed++;
      
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          job.skipped++;
          console.log(`[Warmup] ⏭️ Skipped (cached): ${chunk[i]}`);
        } else if (result.value.success) {
          job.succeeded++;
          console.log(`[Warmup] ✅ Success: ${chunk[i]}`);
        } else {
          job.failed++;
          console.log(`[Warmup] ❌ Failed: ${chunk[i]} - ${result.value.error}`);
        }
      } else {
        job.failed++;
        console.log(`[Warmup] ❌ Failed: ${chunk[i]} - ${result.reason}`);
      }
    });

    // 進捗ログ
    console.log(
      `[Warmup] Progress: ${job.processed}/${job.total} ` +
      `(Success: ${job.succeeded}, Skip: ${job.skipped}, Fail: ${job.failed})`
    );
  }

  job.status = 'completed';
  job.endTime = Date.now();
  
  const duration = (job.endTime - job.startTime) / 1000;
  console.log(
    `[Warmup] Job ${jobId} completed in ${duration.toFixed(1)}s - ` +
    `Success: ${job.succeeded}, Skip: ${job.skipped}, Fail: ${job.failed}`
  );

  // 古いジョブをクリーンアップ
  cleanupOldJobs();
}

// 個別ページの最適化処理
async function processPageOptimized(
  pageId: string, 
  timeout: number
): Promise<{ success: boolean; skipped: boolean; error?: string }> {
  try {
    // ページIDを正規化
    let normalizedPageId = pageId;
    if (isValidPageId(pageId)) {
      normalizedPageId = normalizePageId(pageId);
    }

    // まずキャッシュを確認
    const cacheKey = `notion-page-${normalizedPageId}`;
    const cached = await getFromCache(cacheKey);
    
    if (cached) {
      return { success: true, skipped: true };
    }

    // キャッシュがない場合のみリクエスト
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     process.env.NEXT_PUBLIC_HOST || 
                     'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/notion-page-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cache-warmup': 'true',
          'x-cache-control': 'max-age=7200' // 2時間キャッシュ
        },
        body: JSON.stringify({ pageId: normalizedPageId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 304) {
        // Not Modified = キャッシュ済み
        return { success: true, skipped: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await response.json();
      return { success: true, skipped: false };

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return { success: false, skipped: false, error: 'Timeout' };
      }
      
      throw error;
    }

  } catch (error: any) {
    return { success: false, skipped: false, error: error.message };
  }
}

// 古いジョブのクリーンアップ
function cleanupOldJobs() {
  const oneHourAgo = Date.now() - 3600000;
  for (const [id, job] of activeJobs.entries()) {
    if (job.endTime && job.endTime < oneHourAgo) {
      activeJobs.delete(id);
      console.log(`[Warmup] Cleaned up old job: ${id}`);
    }
  }
}

// ジョブステータス取得（エクスポート）
export function getJobStatus(jobId: string) {
  return activeJobs.get(jobId);
}