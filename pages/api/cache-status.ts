import { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // キャッシュ統計を取得
    const stats = await cache.stats();
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get cache stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}