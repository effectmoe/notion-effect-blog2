import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { parsePageId } from 'notion-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DEBUG: Cache Warmup Analysis ===');
    
    // Get site map
    const siteMap = await getSiteMap();
    
    // Analyze canonicalPageMap
    const canonicalEntries = Object.entries(siteMap.canonicalPageMap || {});
    console.log(`Total entries in canonicalPageMap: ${canonicalEntries.length}`);
    
    // Analyze each entry
    const analysis = canonicalEntries.slice(0, 10).map(([slug, pageId]) => {
      const parsed = parsePageId(pageId as string);
      return {
        slug,
        rawPageId: pageId,
        parsedPageId: parsed,
        isValid: !!parsed,
        type: typeof pageId
      };
    });
    
    // Count valid vs invalid
    const validCount = canonicalEntries.filter(([_, pageId]) => !!parsePageId(pageId as string)).length;
    
    // Get some sample slugs
    const sampleSlugs = Object.keys(siteMap.canonicalPageMap || {}).slice(0, 10);
    
    res.status(200).json({
      totalEntries: canonicalEntries.length,
      validPageIds: validCount,
      invalidPageIds: canonicalEntries.length - validCount,
      sampleAnalysis: analysis,
      sampleSlugs,
      rootPageId: process.env.NOTION_PAGE_ID,
      includeNotionIdInUrls: process.env.NODE_ENV === 'development'
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: 'Failed to debug cache warmup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}