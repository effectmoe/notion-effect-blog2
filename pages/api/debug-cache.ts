import { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';
import { activeJobs } from './cache-warmup-fast';
import { warmupJobs } from './cache-warmup-start';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // キャッシュ統計を取得
    const cacheStats = cache.statistics();
    const memoryStats = await cache.stats();

    // アクティブなジョブを取得（高速版）
    const fastJobs = Array.from(activeJobs.entries()).map(([id, job]) => ({
      id,
      type: 'fast',
      ...job,
      duration: job.endTime ? (job.endTime - job.startTime) / 1000 : null,
      throughput: job.processed > 0 && job.endTime 
        ? job.processed / ((job.endTime - job.startTime) / 1000) 
        : null
    }));

    // アクティブなジョブを取得（既存版）
    const standardJobs = Array.from(warmupJobs.entries()).map(([id, job]) => ({
      id,
      type: 'standard',
      status: job.status,
      total: job.total,
      processed: job.processed,
      succeeded: job.succeeded,
      failed: job.failed,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      duration: job.completedAt 
        ? (job.completedAt.getTime() - job.startedAt.getTime()) / 1000 
        : null
    }));

    // 最近のジョブパフォーマンス統計
    const recentFastJobs = fastJobs.filter(job => job.duration !== null);
    const performanceStats = recentFastJobs.length > 0 ? {
      averageDuration: recentFastJobs.reduce((sum, job) => sum + (job.duration || 0), 0) / recentFastJobs.length,
      averageThroughput: recentFastJobs.reduce((sum, job) => sum + (job.throughput || 0), 0) / recentFastJobs.length,
      totalProcessed: recentFastJobs.reduce((sum, job) => sum + job.processed, 0),
      totalSkipped: recentFastJobs.reduce((sum, job) => sum + (job.skipped || 0), 0)
    } : null;

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      cache: {
        statistics: cacheStats,
        memory: memoryStats.memory,
        redis: memoryStats.redis
      },
      jobs: {
        fast: {
          active: fastJobs.filter(job => job.status === 'running').length,
          completed: fastJobs.filter(job => job.status === 'completed').length,
          failed: fastJobs.filter(job => job.status === 'failed').length,
          total: fastJobs.length,
          list: fastJobs
        },
        standard: {
          active: standardJobs.filter(job => job.status === 'processing' || job.status === 'pending').length,
          completed: standardJobs.filter(job => job.status === 'completed').length,
          failed: standardJobs.filter(job => job.status === 'failed').length,
          total: standardJobs.length,
          list: standardJobs
        }
      },
      performance: performanceStats,
      recommendations: generateRecommendations(cacheStats, fastJobs, performanceStats)
    });
  } catch (error: any) {
    console.error('[Debug Cache] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get debug info',
      details: error.message 
    });
  }
}

function generateRecommendations(cacheStats: any, jobs: any[], performance: any) {
  const recommendations = [];

  // キャッシュサイズの推奨
  if (cacheStats.estimatedSizeKB > 1024 * 100) { // 100MB以上
    recommendations.push({
      type: 'warning',
      message: 'キャッシュサイズが大きくなっています。定期的なクリアを検討してください。',
      metric: `${Math.round(cacheStats.estimatedSizeKB / 1024)}MB`
    });
  }

  // パフォーマンスの推奨
  if (performance && performance.averageThroughput < 5) {
    recommendations.push({
      type: 'info',
      message: '処理速度が遅い可能性があります。同時実行数の増加を検討してください。',
      metric: `${performance.averageThroughput.toFixed(1)} pages/sec`
    });
  }

  // スキップ率の推奨
  if (performance && performance.totalProcessed > 0) {
    const skipRate = (performance.totalSkipped / performance.totalProcessed) * 100;
    if (skipRate > 80) {
      recommendations.push({
        type: 'success',
        message: 'キャッシュヒット率が高く、効率的に動作しています。',
        metric: `${skipRate.toFixed(1)}% skip rate`
      });
    }
  }

  return recommendations;
}