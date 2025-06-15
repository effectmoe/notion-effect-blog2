import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { parsePageId } from 'notion-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== Debug Warmup Info ===');
    
    // 1. Get site map
    const siteMap = await getSiteMap();
    
    // 2. Extract page info
    const canonicalEntries = Object.entries(siteMap.canonicalPageMap || {});
    console.log(`Total entries in canonicalPageMap: ${canonicalEntries.length}`);
    
    // 3. Analyze page IDs
    const pageAnalysis = canonicalEntries.slice(0, 10).map(([key, value]) => {
      const keyParsed = parsePageId(key);
      const valueParsed = parsePageId(value);
      
      return {
        key: key.substring(0, 20) + '...',
        keyType: keyParsed ? 'valid-id' : 'slug',
        value: value.substring(0, 20) + '...',
        valueType: valueParsed ? 'valid-id' : 'slug',
        isDatabase: key.includes('データベース') || key.includes('都道府県') || key.includes('リスト')
      };
    });
    
    // 4. Count valid IDs
    const validIds = canonicalEntries
      .map(([_, value]) => value)
      .filter(id => parsePageId(id));
    
    // 5. Find database pages
    const databasePages = canonicalEntries
      .filter(([key, _]) => 
        key.includes('データベース') || 
        key.includes('都道府県') || 
        key.includes('リスト') ||
        key.includes('一覧')
      )
      .map(([key, value]) => ({ slug: key, id: value }));
    
    res.status(200).json({
      summary: {
        totalEntries: canonicalEntries.length,
        validPageIds: validIds.length,
        databasePages: databasePages.length
      },
      sampleAnalysis: pageAnalysis,
      databasePages: databasePages.slice(0, 5),
      rootPageId: process.env.NOTION_PAGE_ID,
      includeNotionIdInUrls: process.env.NEXT_PUBLIC_INCLUDE_NOTION_ID_IN_URLS
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}