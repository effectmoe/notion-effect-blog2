import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { getPage } from '@/lib/notion';
import { detectDatabasePages, isDatabaseByTitle } from '@/lib/detect-database-pages';
import { normalizePageId } from '@/lib/normalize-page-id';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Detecting database pages...');
    const siteMap = await getSiteMap();
    
    const databasePages: Array<{
      slug: string;
      pageId: string;
      hasDatabase: boolean;
      titleSuggestsDatabase: boolean;
    }> = [];
    
    // サンプルとして最初の10ページを調べる
    const entries = Object.entries(siteMap.canonicalPageMap || {}).slice(0, 10);
    
    for (const [slug, pageId] of entries) {
      console.log(`Checking page: ${slug}`);
      
      const titleSuggestsDatabase = isDatabaseByTitle(slug);
      let hasDatabase = false;
      
      try {
        // ページデータを取得して実際にデータベースが含まれているか確認
        const normalizedId = normalizePageId(pageId);
        const recordMap = await getPage(normalizedId);
        
        if (recordMap) {
          hasDatabase = detectDatabasePages(recordMap);
        }
      } catch (error) {
        console.error(`Failed to check page ${slug}:`, error);
      }
      
      if (hasDatabase || titleSuggestsDatabase) {
        databasePages.push({
          slug,
          pageId,
          hasDatabase,
          titleSuggestsDatabase
        });
      }
    }
    
    res.status(200).json({
      success: true,
      checkedPages: entries.length,
      databasePagesFound: databasePages.length,
      databasePages,
      message: 'Database detection complete. This checked only the first 10 pages as a sample.'
    });
    
  } catch (error) {
    console.error('Database detection error:', error);
    res.status(500).json({ 
      error: 'Failed to detect databases',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}