import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { parsePageId } from 'notion-utils';

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
      
      pageIds = allPageIds.filter(id => {
        // 有効なページIDのみをフィルタリング
        if (typeof id !== 'string') {
          console.log('Non-string page ID:', id);
          return false;
        }
        const parsed = parsePageId(id);
        if (!parsed) {
          console.log('Failed to parse page ID:', id);
        }
        return !!parsed;
      });
      console.log(`Found ${pageIds.length} valid page IDs out of ${allPageIds.length} total in site map`);
      console.log('Sample valid page IDs:', pageIds.slice(0, 3));
    }
    
    // ルートページIDを必ず含める
    const rootPageId = process.env.NOTION_PAGE_ID;
    if (rootPageId && !pageIds.includes(rootPageId)) {
      pageIds.unshift(rootPageId);
    }
    
    // 重複を削除して最大20ページまでに制限
    const uniquePageIds = [...new Set(pageIds)];
    const importantPageIds = uniquePageIds.slice(0, 20);
    
    res.status(200).json({
      success: true,
      pageIds: importantPageIds,
      total: pageIds.length,
      message: `Retrieved ${importantPageIds.length} important pages`
    });

  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ 
      error: 'Failed to get page list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}