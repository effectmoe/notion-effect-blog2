import { NextApiRequest, NextApiResponse } from 'next'
import { cacheManager } from '@/lib/cache-utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const stats = cacheManager.getStats()
    
    res.status(200).json({
      success: true,
      cache: {
        totalItems: stats.totalKeys,
        totalSize: `${(stats.totalSize / 1024).toFixed(2)} KB`,
        items: stats.items.map(item => ({
          key: item.key,
          size: `${(item.size / 1024).toFixed(2)} KB`,
          age: `${(item.age / 1000 / 60).toFixed(1)} minutes`,
          remainingTTL: `${((item.ttl - item.age) / 1000 / 60).toFixed(1)} minutes`
        }))
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Cache status error:', error)
    res.status(500).json({
      error: 'Failed to get cache status',
      details: error.message
    })
  }
}