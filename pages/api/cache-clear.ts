import { NextApiRequest, NextApiResponse } from 'next'
import { cacheManager } from '@/lib/cache-utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    cacheManager.clear()
    
    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Cache clear error:', error)
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error.message
    })
  }
}