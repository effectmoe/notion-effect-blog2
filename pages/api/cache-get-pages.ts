import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Getting current page list from site map...');
    const siteMap = await getSiteMap();
    
    let pageIds: string[] = [];
    
    // canonicalPageMapからページIDを取得
    if (siteMap.canonicalPageMap && typeof siteMap.canonicalPageMap === 'object') {
      pageIds = Object.keys(siteMap.canonicalPageMap);
      console.log(`Found ${pageIds.length} pages in site map`);
    }
    
    // 最大20ページまでに制限
    const importantPageIds = pageIds.slice(0, 20);
    
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