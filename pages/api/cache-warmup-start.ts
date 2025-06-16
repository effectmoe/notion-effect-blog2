import { NextApiRequest, NextApiResponse } from 'next';
import { getPage } from '@/lib/notion';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';

// 処理ジョブの管理（メモリ内）
export const warmupJobs = new Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  errors: Array<{ pageId: string; error: string }>;
  result?: any;
}>();

// ジョブIDの生成（簡易版）
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  try {
    const { pageIds } = req.body;
    
    if (!pageIds || !Array.isArray(pageIds)) {
      return res.status(400).json({ error: 'Invalid pageIds' });
    }

    console.log(`[Warmup Start] Starting job for ${pageIds.length} pages`);

    // ジョブIDを生成
    const jobId = generateJobId();
    
    // ジョブ情報を保存
    warmupJobs.set(jobId, {
      id: jobId,
      status: 'pending',
      startedAt: new Date(),
      total: pageIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(pageIds.length / 5),
      errors: []
    });
    
    // バックグラウンド処理を開始（非同期）
    processWarmupAsync(jobId, pageIds).catch(error => {
      console.error(`[Warmup] Job ${jobId} failed:`, error);
      const job = warmupJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.completedAt = new Date();
        job.errors.push({
          pageId: 'system',
          error: error.message
        });
      }
    });
    
    // 即座にレスポンスを返す
    return res.status(202).json({
      success: true,
      jobId,
      message: 'Warmup job started',
      statusUrl: `/api/cache-warmup-status?jobId=${jobId}`,
      total: pageIds.length
    });
    
  } catch (error: any) {
    console.error('[Warmup Start] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// バックグラウンド処理
async function processWarmupAsync(jobId: string, pageIds: string[]) {
  const job = warmupJobs.get(jobId);
  if (!job) return;
  
  job.status = 'processing';
  console.log(`[Warmup Job ${jobId}] Starting processing of ${pageIds.length} pages`);
  
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 5000; // 5秒
  
  for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
    const batch = pageIds.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    
    job.currentBatch = batchNumber;
    
    console.log(`[Warmup Job ${jobId}] Processing batch ${batchNumber}/${job.totalBatches} (${batch.length} pages)`);
    
    // バッチ処理
    const results = await processWarmupBatch(batch);
    
    // 結果を集計
    results.forEach((result, index) => {
      job.processed++;
      if (result.status === 'fulfilled' && result.value.success) {
        job.succeeded++;
        console.log(`[Warmup Job ${jobId}] ✅ Success: ${batch[index]}`);
      } else {
        job.failed++;
        const pageId = batch[index];
        const error = result.status === 'rejected' 
          ? result.reason?.message || 'Unknown error'
          : result.value?.error?.message || 'Failed';
        
        console.log(`[Warmup Job ${jobId}] ❌ Failed: ${pageId} - ${error}`);
        
        job.errors.push({
          pageId,
          error: error.substring(0, 200) // エラーメッセージを制限
        });
      }
    });
    
    console.log(`[Warmup Job ${jobId}] Batch ${batchNumber} complete: ${job.succeeded}/${job.processed} succeeded`);
    
    // 次のバッチまで待機
    if (i + BATCH_SIZE < pageIds.length) {
      console.log(`[Warmup Job ${jobId}] Waiting ${BATCH_DELAY}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
  
  job.status = 'completed';
  job.completedAt = new Date();
  
  const duration = Math.round((job.completedAt.getTime() - job.startedAt.getTime()) / 1000);
  console.log(`[Warmup Job ${jobId}] Completed: ${job.succeeded}/${job.total} pages in ${duration}s`);
  
  // 古いジョブをクリーンアップ（1時間以上前のもの）
  const oneHourAgo = new Date(Date.now() - 3600000);
  for (const [id, oldJob] of warmupJobs.entries()) {
    if (oldJob.completedAt && oldJob.completedAt < oneHourAgo) {
      warmupJobs.delete(id);
      console.log(`[Warmup] Cleaned up old job: ${id}`);
    }
  }
}

async function processWarmupBatch(pageIds: string[]): Promise<any[]> {
  return Promise.allSettled(
    pageIds.map(async (pageId) => {
      try {
        // ページIDを正規化
        let pageIdToUse = pageId;
        if (isValidPageId(pageId)) {
          pageIdToUse = normalizePageId(pageId);
        }
        
        // getPageを直接呼び出してキャッシュに保存
        const page = await Promise.race([
          getPage(pageIdToUse),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 20000)
          )
        ]);
        
        if (!page) {
          throw new Error('Page not found');
        }
        
        return { pageId, success: true };
        
      } catch (error: any) {
        return { 
          pageId, 
          success: false, 
          error: {
            message: error.message || 'Unknown error',
            code: error.code
          }
        };
      }
    })
  );
}