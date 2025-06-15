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
    
    // データベースページを優先的に含める
    const databasePageSlugs = ['都道府県リスト', '講座一覧'];
    const databasePageIds: string[] = [];
    
    // データベースページのページIDを取得
    for (const [slug, pageId] of Object.entries(siteMap.canonicalPageMap || {})) {
      if (databasePageSlugs.includes(slug) && isValidPageId(pageId)) {
        databasePageIds.push(normalizePageId(pageId));
      }
    }
    
    // データベースページを先頭に、その他のページを後に
    const allUniquePageIds = [...new Set([...databasePageIds, ...pageIds])];
    const importantPageIds = allUniquePageIds.slice(0, 20);
    
    console.log(`Database pages included: ${databasePageIds.length}`);
    console.log('Database page IDs:', databasePageIds);
    
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