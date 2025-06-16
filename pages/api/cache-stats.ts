import { NextApiRequest, NextApiResponse } from 'next';
import { getCacheStats } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = await getCacheStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('[Cache Stats] Error:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
}