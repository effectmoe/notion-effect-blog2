import { NextApiRequest, NextApiResponse } from 'next';
import { getCacheStats } from '@/lib/cache-memory-only';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // メモリキャッシュの統計のみ返す
    const stats = await getCacheStats();
    
    return res.status(200).json({
      success: true,
      memory: {
        ...stats.memory,
        status: 'active'
      },
      redis: {
        status: 'disabled',
        connected: false,
        keyCount: 0,
        memoryUsage: 0,
        message: 'Redis is not used in this deployment'
      }
    });
  } catch (error: any) {
    console.error('[Cache Stats] Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get cache stats'
    });
  }
}