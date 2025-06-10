import { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';
import { CACHE_HEADERS } from '@/lib/cache-strategies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // キャッシュ統計を取得
    const stats = await cache.stats();
    
    // レスポンスヘッダーの設定
    Object.entries(CACHE_HEADERS.dynamicContent).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // 統計情報に追加情報を含める
    const response = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      cache: stats,
      features: {
        redis: !!process.env.REDIS_URL,
        serviceWorker: true,
        edgeCache: !!process.env.VERCEL_ENV,
      },
      performance: {
        hitRate: calculateHitRate(stats),
        efficiency: calculateEfficiency(stats),
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Cache status error:', error);
    res.status(500).json({ 
      error: 'Failed to get cache status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ヒット率の計算
function calculateHitRate(stats: any): number {
  const { memory } = stats;
  const totalRequests = (memory.hits || 0) + (memory.misses || 0);
  
  if (totalRequests === 0) return 0;
  
  return Math.round((memory.hits / totalRequests) * 100);
}

// キャッシュ効率の計算
function calculateEfficiency(stats: any): string {
  const { memory, redis } = stats;
  
  if (redis.connected) {
    return 'High (Redis + Memory)';
  } else if (memory.size > 0) {
    return 'Medium (Memory only)';
  }
  
  return 'Low (No cache)';
}