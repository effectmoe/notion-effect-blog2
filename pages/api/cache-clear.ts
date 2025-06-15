import { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';
import { rateLimit, rateLimitPresets } from '@/lib/rate-limiter';
import { clearSiteMapCache } from '@/lib/get-site-map';
import { clearNavigationCache } from '@/lib/notion';

// レート制限を適用
const rateLimiter = rateLimit(rateLimitPresets.strict);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[CacheClear] Request received:', {
    method: req.method,
    body: req.body,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'content-type': req.headers['content-type']
    }
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 簡易的な認証（本番環境では適切な認証を実装）
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CACHE_CLEAR_TOKEN;
  
  console.log('[CacheClear] Auth check:', {
    hasAuthHeader: !!authHeader,
    hasExpectedToken: !!expectedToken,
    tokenConfigured: !!process.env.CACHE_CLEAR_TOKEN
  });
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    console.log('[CacheClear] Authorization failed');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // レート制限チェック（認証後）
  const rateLimitResult = await new Promise<boolean>((resolve) => {
    rateLimiter(req, res, () => resolve(true));
  });
  
  if (!rateLimitResult) {
    console.log('[CacheClear] Rate limited');
    return; // レート制限でブロックされた
  }

  try {
    const { pattern, type = 'all' } = req.body;
    console.log('[CacheClear] Processing request:', { type, pattern });
    
    // Get cache stats before clearing
    const statsBefore = await cache.stats();
    console.log('[CacheClear] Cache stats before clear:', statsBefore);
    
    let result;
    
    switch (type) {
      case 'pattern':
        if (!pattern) {
          return res.status(400).json({ error: 'Pattern is required' });
        }
        console.log('[CacheClear] Invalidating pattern:', pattern);
        await cache.invalidate(pattern);
        result = { cleared: 'pattern', pattern };
        break;
        
      case 'notion':
        console.log('[CacheClear] Clearing Notion cache');
        await cache.invalidate('notion:');
        clearSiteMapCache(); // Clear pMemoize cache
        clearNavigationCache(); // Clear navigation cache
        result = { cleared: 'notion-cache' };
        break;
        
      case 'all':
        // 全キャッシュクリア
        console.log('[CacheClear] Clearing all caches');
        await cache.cleanup();
        clearSiteMapCache(); // Clear pMemoize cache
        clearNavigationCache(); // Clear navigation cache
        result = { cleared: 'all-caches' };
        break;
        
      default:
        console.log('[CacheClear] Invalid type:', type);
        return res.status(400).json({ error: 'Invalid type' });
    }
    
    // Get cache stats after clearing
    const statsAfter = await cache.stats();
    console.log('[CacheClear] Cache stats after clear:', statsAfter);
    
    // Log the difference
    console.log('[CacheClear] Cache clear results:', {
      memory: {
        before: statsBefore.memory.size,
        after: statsAfter.memory.size,
        cleared: statsBefore.memory.size - statsAfter.memory.size
      },
      redis: {
        before: statsBefore.redis.keyCount,
        after: statsAfter.redis.keyCount,
        cleared: statsBefore.redis.keyCount - statsAfter.redis.keyCount
      }
    });
    
    // Revalidate pages if clearing all or notion cache
    if (type === 'all' || type === 'notion') {
      console.log('[CacheClear] Triggering page revalidation...');
      try {
        // Revalidate common pages
        const pathsToRevalidate = ['/', '/about', '/archive'];
        
        // Get all page IDs from sitemap if available
        try {
          const { getSiteMap } = await import('@/lib/get-site-map');
          const siteMap = await getSiteMap();
          if (siteMap?.pageMap) {
            Object.keys(siteMap.pageMap).forEach(pageId => {
              pathsToRevalidate.push(`/${pageId}`);
            });
          }
        } catch (e) {
          console.log('[CacheClear] Could not get sitemap for revalidation');
        }
        
        // Revalidate each path
        const revalidationResults = await Promise.allSettled(
          pathsToRevalidate.map(async (path) => {
            try {
              await res.revalidate(path);
              console.log(`[CacheClear] Revalidated: ${path}`);
              return { path, success: true };
            } catch (err) {
              console.error(`[CacheClear] Failed to revalidate ${path}:`, err);
              return { path, success: false, error: err };
            }
          })
        );
        
        const successCount = revalidationResults.filter(
          r => r.status === 'fulfilled' && r.value.success
        ).length;
        
        console.log(`[CacheClear] Revalidated ${successCount}/${pathsToRevalidate.length} pages`);
      } catch (error) {
        console.error('[CacheClear] Revalidation error:', error);
        // Don't fail the whole request if revalidation fails
      }
    }
    
    // Service Workerのキャッシュもクリア（クライアントサイドで実行）
    const response = {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      message: 'Cache cleared successfully',
      stats: {
        before: statsBefore,
        after: statsAfter
      }
    };
    
    console.log('[CacheClear] Sending response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('[CacheClear] Error:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}