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
    console.log('[Cache Warmup] Starting cache warmup process...');
    
    let pageIds: string[] = [];
    let useFallback = false;
    
    // Check if specific page IDs were provided
    const providedPageIds = req.body?.pageIds;
    if (providedPageIds && Array.isArray(providedPageIds) && providedPageIds.length > 0) {
      console.log(`[Cache Warmup] Using ${providedPageIds.length} provided page IDs`);
      pageIds = providedPageIds.filter(id => typeof id === 'string' && id.trim());
      console.log(`[Cache Warmup] After filtering: ${pageIds.length} valid page IDs`);
    }
    
    // Check if we should skip getSiteMap (e.g., right after cache clear)
    // Fixed: Only skip if explicitly requested OR if we have provided page IDs
    const skipSiteMap = req.body?.skipSiteMap === true || pageIds.length > 0;
    
    if (!skipSiteMap) {
      try {
        // 主要ページのIDを取得
        console.log('[Cache Warmup] Attempting to get site map...');
        const siteMap = await getSiteMap();
        
        // デバッグ情報
        console.log('[Cache Warmup] Site map received:', {
          hasPageMap: !!siteMap.pageMap,
          hasCanonicalPageMap: !!siteMap.canonicalPageMap,
          canonicalPageMapType: typeof siteMap.canonicalPageMap,
          canonicalPageMapKeys: siteMap.canonicalPageMap ? Object.keys(siteMap.canonicalPageMap).length : 0
        });
        
        // canonicalPageMapからページIDを取得（values側が実際のページID）
        if (siteMap.canonicalPageMap && typeof siteMap.canonicalPageMap === 'object') {
          const allPageIds = Object.values(siteMap.canonicalPageMap)
            .filter(id => typeof id === 'string' && isValidPageId(id))
            .map(id => normalizePageId(id));
          
          // シンプルにすべてのページを取得
          pageIds = allPageIds; // すべてのページをウォームアップ
          console.log('[Cache Warmup] Found pages in canonicalPageMap:', pageIds.length);
        }
      } catch (error) {
        console.log('[Cache Warmup] Error getting site map:', error.message);
        useFallback = true;
      }
    } else {
      console.log('[Cache Warmup] Skipping site map lookup as requested');
      // Only use fallback if we don't have any page IDs
      if (pageIds.length === 0) {
        useFallback = true;
      }
    }
    
    // ページIDが取得できない場合は、重要なページIDを使用
    if (pageIds.length === 0 && useFallback) {
      console.log('[Cache Warmup] Using fallback strategy');
      console.log('[Cache Warmup] Current pageIds length:', pageIds.length);
      console.log('[Cache Warmup] useFallback:', useFallback);
      
      // フォールバック: 環境変数から取得
      const envPageIds = process.env.IMPORTANT_PAGE_IDS?.split(',').filter(Boolean) || [];
      console.log('[Cache Warmup] Environment IMPORTANT_PAGE_IDS:', envPageIds.length);
      
      const rootPageId = process.env.NOTION_PAGE_ID;
      if (rootPageId && isValidPageId(rootPageId)) {
        envPageIds.unshift(normalizePageId(rootPageId));
      }
      
      pageIds = envPageIds; // すべての環境変数ページIDを使用
      
      console.log('[Cache Warmup] Using fallback page IDs:', pageIds.length);
      console.log('[Cache Warmup] Fallback IDs sample:', pageIds.slice(0, 3).map(id => id.substring(0, 8) + '...'));
    }

    console.log(`[Cache Warmup] Warming up cache for ${pageIds.length} pages`);
    console.log('[Cache Warmup] Page IDs to warm up:', pageIds.map(id => {
      if (typeof id === 'string' && id.length > 8) {
        return id.substring(0, 8) + '...';
      }
      return id;
    }));

    if (pageIds.length === 0) {
      return res.status(200).json({
        success: true,
        warmedUp: 0,
        failed: 0,
        message: 'No pages found to warm up. Site map might be empty after cache clear.'
      });
    }

    // 並列でページを読み込み（キャッシュに保存される）
    const results = await Promise.allSettled(
      pageIds.map(async (pageIdOrSlug) => {
        try {
          console.log(`[Cache Warmup] Fetching page: ${pageIdOrSlug}`);
          
          // ページIDを正規化してから使用
          let pageIdToUse = pageIdOrSlug;
          if (isValidPageId(pageIdOrSlug)) {
            pageIdToUse = normalizePageId(pageIdOrSlug);
          }
          
          const result = await getPage(pageIdToUse);
          console.log(`[Cache Warmup] Successfully fetched: ${pageIdOrSlug} (used: ${pageIdToUse})`);
          return { pageId: pageIdOrSlug, success: true };
        } catch (error) {
          console.error(`[Cache Warmup] Failed to fetch page ${pageIdOrSlug}:`, error.message);
          return { pageId: pageIdOrSlug, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)).length;
    
    // 失敗したページの詳細を取得
    const failedDetails = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success))
      .map((r, idx) => ({
        pageId: pageIds[idx],
        reason: r.status === 'rejected' ? r.reason : r.value?.error
      }));

    console.log(`[Cache Warmup] Results: ${successful} successful, ${failed} failed out of ${pageIds.length} total`);
    
    res.status(200).json({
      success: true,
      warmedUp: successful,
      failed,
      message: `Cache warmed up for ${successful} pages`,
      pageIds: pageIds.slice(0, 5), // デバッグ用：最初の5ページIDを返す
      totalPages: pageIds.length,
      failedDetails: failedDetails.slice(0, 5), // 最初の5つの失敗詳細
      debug: {
        totalAttempted: pageIds.length,
        successful,
        failed,
        sampleFailures: failedDetails.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('Cache warmup error:', error);
    res.status(500).json({ 
      error: 'Failed to warm up cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}