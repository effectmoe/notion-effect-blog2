import { NextApiRequest, NextApiResponse } from 'next';
import { warmupJobs } from './cache-warmup-start';
import { getJobStatus as getFastJobStatus } from './cache-warmup-fast';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { jobId } = req.query;
  
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Invalid jobId' });
  }
  
  // まず高速ジョブを確認
  const fastJob = getFastJobStatus(jobId);
  if (fastJob) {
    const progress = fastJob.total > 0 ? Math.round((fastJob.processed / fastJob.total) * 100) : 0;
    const elapsedSeconds = Math.floor((Date.now() - fastJob.startTime) / 1000);
    
    return res.status(200).json({
      jobId,
      status: fastJob.status,
      progress,
      total: fastJob.total,
      processed: fastJob.processed,
      succeeded: fastJob.succeeded,
      failed: fastJob.failed,
      skipped: fastJob.skipped,
      elapsedSeconds,
      isComplete: fastJob.status === 'completed' || fastJob.status === 'failed',
      isFastJob: true
    });
  }
  
  // 既存のジョブを確認
  const job = warmupJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // 進捗率の計算
  const progress = job.total > 0 ? (job.processed / job.total) * 100 : 0;
  
  // 経過時間
  const elapsedMs = Date.now() - job.startedAt.getTime();
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  
  // 推定残り時間
  let estimatedSecondsRemaining = null;
  if (job.processed > 0 && job.status === 'processing') {
    const avgTimePerPage = elapsedMs / job.processed;
    const remainingPages = job.total - job.processed;
    estimatedSecondsRemaining = Math.floor((avgTimePerPage * remainingPages) / 1000);
  }
  
  // 成功率
  const successRate = job.processed > 0 
    ? Math.round((job.succeeded / job.processed) * 100)
    : 0;
  
  return res.status(200).json({
    jobId: job.id,
    status: job.status,
    progress: Math.round(progress),
    successRate,
    total: job.total,
    processed: job.processed,
    succeeded: job.succeeded,
    failed: job.failed,
    currentBatch: job.currentBatch,
    totalBatches: job.totalBatches,
    elapsedSeconds,
    estimatedSecondsRemaining,
    errors: job.errors.slice(-10), // 最新の10件のエラー
    errorSummary: job.errors.reduce((acc, err) => {
      const key = err.error.includes('Timeout') ? 'timeout' :
                  err.error.includes('not found') ? 'notFound' :
                  err.error.includes('429') ? 'rateLimited' :
                  'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    startedAt: job.startedAt,
    completedAt: job.completedAt
  });
}