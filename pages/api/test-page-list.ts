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
    
    // 全ページの詳細情報を取得
    const allPagesWithDetails = siteMapPages.map(pageId => {
      try {
        const siteMapData = siteMap?.pageMap?.[pageId];
        const pageBlock = siteMapData?.block?.[pageId]?.value;
        
        // タイトルの取得（複数の方法を試す）
        let title = 'Untitled';
        
        // デバッグ: ページブロック全体を確認
        if (pageBlock) {
          console.log(`[Page ${pageId}] Block type: ${pageBlock.type}`);
          console.log(`[Page ${pageId}] Has properties: ${!!pageBlock.properties}`);
          if (pageBlock.properties) {
            console.log(`[Page ${pageId}] Property keys:`, Object.keys(pageBlock.properties));
          }
        }
        
        // 方法1: properties.titleから取得
        if (pageBlock?.properties?.title) {
          const titleProperty = pageBlock.properties.title;
          console.log(`[Page ${pageId}] Title property:`, JSON.stringify(titleProperty));
          if (Array.isArray(titleProperty)) {
            if (titleProperty.length > 0 && Array.isArray(titleProperty[0])) {
              if (titleProperty[0].length > 0) {
                title = titleProperty[0][0];
                console.log(`[Page ${pageId}] Extracted title from properties.title:`, title);
              }
            }
          }
        }
        
        // 方法2: propertiesの他のフィールドをチェック
        if (title === 'Untitled' && pageBlock?.properties) {
          const possibleTitleKeys = ['Name', 'name', 'NAME', 'タイトル', 'title', 'Title'];
          for (const key of possibleTitleKeys) {
            const prop = pageBlock.properties[key];
            if (prop) {
              console.log(`[Page ${pageId}] Found property ${key}:`, prop);
              
              // プロパティの値を正しく取得
              if (Array.isArray(prop) && prop[0]) {
                if (typeof prop[0] === 'string') {
                  title = prop[0];
                } else if (Array.isArray(prop[0]) && prop[0][0]) {
                  title = prop[0][0];
                }
              } else if (typeof prop === 'string') {
                title = prop;
              }
              
              if (title !== 'Untitled') break;
            }
          }
        }
        
        // 方法3: ページブロック自体の他のフィールドを確認
        if (title === 'Untitled' && pageBlock) {
          // format_pageからタイトルを取得
          if (pageBlock.format?.page_icon) {
            console.log(`[Page ${pageId}] Has page icon:`, pageBlock.format.page_icon);
          }
          
          // ページブロックのcontentから最初のテキストを取得
          if (pageBlock.content && Array.isArray(pageBlock.content)) {
            const firstContentId = pageBlock.content[0];
            if (firstContentId && siteMapData?.block?.[firstContentId]?.value) {
              const firstBlock = siteMapData.block[firstContentId].value;
              if (firstBlock.type === 'header' || firstBlock.type === 'sub_header' || firstBlock.type === 'sub_sub_header') {
                if (firstBlock.properties?.title?.[0]?.[0]) {
                  title = firstBlock.properties.title[0][0];
                  console.log(`[Page ${pageId}] Got title from first header block:`, title);
                }
              }
            }
          }
        }
        
        console.log(`[Page ${pageId}] Final title: '${title}', ID: '${pageId}'`);
        
        const url = siteMap?.canonicalPageMap?.[pageId] || `/${pageId.replace(/-/g, '')}`;
        
        // 最終的なページデータを作成
        const result = {
          id: pageId,  // 必ずUUID形式のID
          title: title,  // 取得したタイトル
          url,
          type: pageBlock?.type || 'unknown',
          hasContent: !!pageBlock?.content,
          lastEdited: pageBlock?.last_edited_time ? 
            new Date(pageBlock.last_edited_time).toLocaleString('ja-JP') : 
            null
        };
        
        // 検証: IDがUUID形式であることを確認
        const isValidUUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(pageId.replace(/-/g, ''));
        if (!isValidUUID) {
          console.warn(`[Page ${pageId}] WARNING: Page ID is not a valid UUID format!`);
        }
        
        console.log(`[Page ${pageId}] Returning:`, { 
          id: result.id, 
          title: result.title,
          idIsUUID: isValidUUID,
          titleLength: result.title.length 
        });
        return result;
      } catch (e) {
        return {
          id: pageId,
          title: 'Untitled',
          url: `/${pageId.replace(/-/g, '')}`,
          type: 'unknown',
          hasContent: false,
          lastEdited: null
        };
      }
    });
    
    // タイトルでソート（Untitledは最後に）
    allPagesWithDetails.sort((a, b) => {
      if (a.title === 'Untitled' && b.title !== 'Untitled') return 1;
      if (a.title !== 'Untitled' && b.title === 'Untitled') return -1;
      return a.title.localeCompare(b.title, 'ja');
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
          pages: allPagesWithDetails
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