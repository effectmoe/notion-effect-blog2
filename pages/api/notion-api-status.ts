import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'
import { getCacheStats } from '@/lib/cache'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get API limiter stats if using the enhanced API
    const limiterStats = (notion as any).getLimiterStats ? (notion as any).getLimiterStats() : null
    
    // Get cache stats
    const cacheStats = await getCacheStats()
    
    // Get current time and uptime
    const now = new Date().toISOString()
    const uptime = process.uptime()
    
    res.status(200).json({
      status: 'ok',
      timestamp: now,
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      api: {
        type: limiterStats ? 'enhanced-with-retry' : 'standard',
        limiter: limiterStats || 'Not available',
        recommendations: [
          'Use batch processing with delays between requests',
          'Implement caching to reduce API calls',
          'Monitor 429 errors and adjust rate limits accordingly',
          'Consider using webhooks for real-time updates instead of polling'
        ]
      },
      cache: {
        memory: cacheStats.memory,
        redis: cacheStats.redis
      },
      rateLimits: {
        current: {
          requestsPerSecond: 3,
          requestsPerMinute: 50,
          concurrency: 2,
          batchSize: 2,
          delayBetweenBatches: '30-45 seconds'
        },
        recommendations: {
          requestsPerSecond: 'Keep below 3 requests/second',
          requestsPerMinute: 'Keep below 50 requests/minute',
          concurrency: 'Use max 2 concurrent requests',
          retryStrategy: 'Exponential backoff with initial 2s delay',
          caching: 'Cache all responses for at least 30 minutes'
        }
      }
    })
  } catch (error) {
    console.error('Error getting API status:', error)
    res.status(500).json({
      error: 'Failed to get API status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}