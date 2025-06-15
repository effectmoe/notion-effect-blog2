import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { getPage } from '@/lib/notion';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 認証チェック
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CACHE_CLEAR_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const startTime = Date.now();
    console.log('[Debug Cache Warmup] Starting debug process...');
    
    // 少数のページでテスト
    const testPageIds = req.body?.pageIds?.slice(0, 5) || [];
    
    if (testPageIds.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No test page IDs provided'
      });
    }

    console.log(`[Debug Cache Warmup] Testing ${testPageIds.length} pages`);
    
    const results = [];
    
    for (let i = 0; i < testPageIds.length; i++) {
      const pageId = testPageIds[i];
      const pageStartTime = Date.now();
      
      try {
        console.log(`[Debug Cache Warmup] Testing page ${i + 1}/${testPageIds.length}: ${pageId}`);
        
        // ページIDを正規化
        let pageIdToUse = pageId;
        if (isValidPageId(pageId)) {
          pageIdToUse = normalizePageId(pageId);
        }
        
        console.log(`[Debug Cache Warmup] Normalized ID: ${pageIdToUse}`);
        
        const result = await getPage(pageIdToUse);
        const pageEndTime = Date.now();
        const duration = pageEndTime - pageStartTime;
        
        console.log(`[Debug Cache Warmup] ✅ Page ${pageId} succeeded in ${duration}ms`);
        
        results.push({
          pageId,
          normalizedId: pageIdToUse,
          success: true,
          duration,
          hasBlocks: !!result?.block,
          blockCount: result?.block ? Object.keys(result.block).length : 0
        });
        
      } catch (error: any) {
        const pageEndTime = Date.now();
        const duration = pageEndTime - pageStartTime;
        
        console.error(`[Debug Cache Warmup] ❌ Page ${pageId} failed in ${duration}ms:`, {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          status: error.status,
          code: error.code,
          name: error.name
        });
        
        results.push({
          pageId,
          normalizedId: pageIdToUse,
          success: false,
          duration,
          error: {
            message: error.message,
            status: error.status,
            code: error.code,
            name: error.name,
            type: error.constructor.name
          }
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`[Debug Cache Warmup] Completed: ${successCount} success, ${failCount} failed in ${totalTime}ms`);
    
    // 失敗パターンの分析
    const failurePatterns = results
      .filter(r => !r.success)
      .reduce((acc, result) => {
        const errorType = result.error?.name || result.error?.type || 'Unknown';
        const errorMessage = result.error?.message || 'Unknown error';
        const key = `${errorType}: ${errorMessage}`;
        
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(result.pageId);
        
        return acc;
      }, {} as Record<string, string[]>);
    
    res.status(200).json({
      success: true,
      results,
      summary: {
        total: testPageIds.length,
        succeeded: successCount,
        failed: failCount,
        totalTime,
        averageTime: totalTime / testPageIds.length,
        successRate: (successCount / testPageIds.length) * 100
      },
      failurePatterns,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          VERCEL_ENV: process.env.VERCEL_ENV
        }
      }
    });

  } catch (error) {
    console.error('[Debug Cache Warmup] Global error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}