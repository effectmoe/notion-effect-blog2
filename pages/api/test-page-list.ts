import { NextApiRequest, NextApiResponse } from 'next';
import { getAllPageIds } from '@/lib/get-all-pages';
import { getSiteMap } from '@/lib/get-site-map';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[TestPageList] Starting test...');
  
  try {
    // 環境変数チェック
    const envCheck = {
      NOTION_ROOT_PAGE_ID: process.env.NOTION_ROOT_PAGE_ID || 'NOT SET',
      NOTION_ROOT_SPACE_ID: process.env.NOTION_ROOT_SPACE_ID || 'NOT SET',
      NOTION_API_KEY: process.env.NOTION_API_KEY ? 'SET' : 'NOT SET',
      NOTION_TOKEN: process.env.NOTION_TOKEN ? 'SET' : 'NOT SET',
      NOTION_API_SECRET: process.env.NOTION_API_SECRET ? 'SET' : 'NOT SET',
    };
    
    console.log('[TestPageList] Environment:', envCheck);
    
    // サイトマップから取得を試みる
    console.log('[TestPageList] Trying getSiteMap...');
    let siteMapPages: string[] = [];
    let siteMapError: string | null = null;
    let siteMap: any = null;
    try {
      siteMap = await getSiteMap();
      if (siteMap?.canonicalPageMap) {
        siteMapPages = Object.keys(siteMap.canonicalPageMap);
      }
      console.log(`[TestPageList] getSiteMap returned ${siteMapPages.length} pages`);
    } catch (error: any) {
      siteMapError = error.message;
      console.error('[TestPageList] getSiteMap error:', error);
    }
    
    // getAllPageIdsから取得を試みる
    console.log('[TestPageList] Trying getAllPageIds...');
    let allPageIds: string[] = [];
    let allPageIdsError: string | null = null;
    try {
      allPageIds = await getAllPageIds(
        process.env.NOTION_ROOT_PAGE_ID,
        process.env.NOTION_ROOT_SPACE_ID
      );
      console.log(`[TestPageList] getAllPageIds returned ${allPageIds.length} pages`);
    } catch (error: any) {
      allPageIdsError = error.message;
      console.error('[TestPageList] getAllPageIds error:', error);
    }
    
    // サンプルページの詳細情報を取得
    const samplePagesWithDetails = siteMapPages.slice(0, 10).map(pageId => {
      try {
        const siteMapData = siteMap?.pageMap?.[pageId];
        const pageBlock = siteMapData?.block?.[pageId]?.value;
        const title = pageBlock?.properties?.title?.[0]?.[0] || 'Untitled';
        const url = siteMap?.canonicalPageMap?.[pageId] || `/${pageId.replace(/-/g, '')}`;
        
        return {
          id: pageId,
          title,
          url
        };
      } catch (e) {
        return {
          id: pageId,
          title: 'Untitled',
          url: `/${pageId.replace(/-/g, '')}`
        };
      }
    });

    // デバッグ情報をレスポンス
    const response = {
      success: true,
      environment: envCheck,
      results: {
        pageCount: Math.max(siteMapPages.length, allPageIds.length),
        uniquePageCount: allPageIds.length,
        duplicateCount: siteMapPages.length - allPageIds.length,
        rootPageId: process.env.NOTION_ROOT_PAGE_ID || process.env.NOTION_PAGE_ID || 'Not set',
        siteMap: {
          total: siteMapPages.length,
          unique: allPageIds.length,
          duplicates: siteMapPages.length - allPageIds.length,
          sample: samplePagesWithDetails
        },
        message: `${allPageIds.length || siteMapPages.length}個のページが検出されました`,
        siteMapDetails: {
          count: siteMapPages.length,
          sample: siteMapPages.slice(0, 5),
          method: 'getSiteMap()',
          error: siteMapError
        },
        allPageIdsDetails: {
          count: allPageIds.length,
          sample: allPageIds.slice(0, 5),
          method: 'getAllPageIds()',
          error: allPageIdsError
        }
      },
      recommendation: allPageIds.length > 0 ? 'Use getAllPageIds' : 
                     siteMapPages.length > 0 ? 'Use getSiteMap' : 
                     'Check environment variables and Notion permissions',
      troubleshooting: {
        noPages: 'If no pages found, check:',
        steps: [
          '1. NOTION_ROOT_PAGE_ID is correct',
          '2. NOTION_TOKEN or NOTION_API_KEY is set',
          '3. The Notion integration has access to the pages',
          '4. The root page has child pages'
        ]
      }
    };
    
    console.log('[TestPageList] Test complete:', response);
    return res.status(200).json(response);
    
  } catch (error: any) {
    console.error('[TestPageList] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}