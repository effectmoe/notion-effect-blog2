import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Getting current page list from site map...');
    const siteMap = await getSiteMap();
    
    let pageIds: string[] = [];
    
    // canonicalPageMapからページIDを取得
    // canonicalPageMapは { [slug]: pageId } の形式なので、valuesを取得
    if (siteMap.canonicalPageMap && typeof siteMap.canonicalPageMap === 'object') {
      // スラッグではなく実際のページIDを取得
      const allPageIds = Object.values(siteMap.canonicalPageMap);
      console.log('All page IDs from canonicalPageMap:', allPageIds.slice(0, 5));
      
      // ハイフン付き・なし両方に対応し、一貫性のため正規化
      pageIds = allPageIds
        .filter(id => typeof id === 'string' && isValidPageId(id))
        .map(id => normalizePageId(id));
      console.log(`Found ${pageIds.length} valid page IDs out of ${allPageIds.length} total in site map`);
      console.log('Sample valid page IDs:', pageIds.slice(0, 3));
    }
    
    // ルートページIDを必ず含める（正規化して追加）
    const rootPageId = process.env.NOTION_PAGE_ID;
    if (rootPageId && isValidPageId(rootPageId)) {
      const normalizedRootId = normalizePageId(rootPageId);
      if (!pageIds.includes(normalizedRootId)) {
        pageIds.unshift(normalizedRootId);
      }
    }
    
    // シンプルに：すべてのページを平等に扱う
    // 重複を削除して最初の30ページを取得（十分な数）
    const uniquePageIds = [...new Set(pageIds)];
    const selectedPageIds = uniquePageIds.slice(0, 30);
    
    res.status(200).json({
      success: true,
      pageIds: selectedPageIds,
      total: uniquePageIds.length,
      message: `Retrieved ${selectedPageIds.length} pages`
    });

  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ 
      error: 'Failed to get page list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}