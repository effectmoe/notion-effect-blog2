import { NextApiRequest, NextApiResponse } from 'next'
import { getFromCache, setToCache } from '@/lib/cache-memory-only'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { domain } from '@/lib/config'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only POST method allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate request body
  const { pageId } = req.body
  if (!pageId) {
    return res.status(400).json({ error: 'pageId is required' })
  }

  // Check headers
  const skipRedis = req.headers['x-skip-redis'] === 'true'
  const isWarmup = req.headers['x-cache-warmup'] === 'true'

  // Generate cache key
  const cacheKey = `notion-page:${pageId}`

  try {
    // Check cache (skip for warmup requests)
    if (!isWarmup) {
      const cached = await getFromCache(cacheKey)
      
      if (cached) {
        console.log(`[NotionPageInfo] Cache hit for ${pageId}`)
        res.setHeader('X-Cache', 'HIT')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        return res.status(200).json(cached)
      }
    }
    
    console.log(`[NotionPageInfo] Cache miss for ${pageId}, fetching from Notion...`)
    
    // Fetch page data using existing logic
    const pageData = await resolveNotionPage(domain, pageId)
    
    if (!pageData) {
      return res.status(404).json({ error: 'Page not found' })
    }
    
    // Save to cache
    await setToCache(cacheKey, pageData, 3600) // 1 hour TTL
    
    // For warmup requests, return minimal response
    if (isWarmup) {
      return res.status(200).json({ success: true, pageId })
    }
    
    // Normal response
    res.setHeader('X-Cache', 'MISS')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(200).json(pageData)
    
  } catch (error: any) {
    console.error(`[NotionPageInfo] Error processing ${pageId}:`, error)
    
    // Check for duplicate page errors
    if (error.message?.includes('duplicate')) {
      res.setHeader('x-duplicate-page', 'true')
      return res.status(409).json({ 
        error: 'Duplicate page', 
        pageId 
      })
    }
    
    // Other errors
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      pageId
    })
  }
}