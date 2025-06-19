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
    let siteMapError: string | null = null;
    let siteMap: any = null;
    try {
      siteMap = await getSiteMap();
      console.log('[TestPageList] Site map structure:', {
        hasCanonicalPageMap: !!siteMap?.canonicalPageMap,
        hasPageMap: !!siteMap?.pageMap,
        sampleCanonicalEntry: siteMap?.canonicalPageMap ? Object.entries(siteMap.canonicalPageMap)[0] : null
      });
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
    const allPagesWithDetails = [];
    
    if (siteMap?.canonicalPageMap) {
      // canonicalPageMapの構造: { [url/slug]: pageId }
      for (const [urlOrSlug, pageId] of Object.entries(siteMap.canonicalPageMap)) {
        if (typeof pageId !== 'string') continue;
        try {
          // pageIdが実際のNotionページID
          const notionPageId = pageId as string;
          const siteMapData = siteMap?.pageMap?.[notionPageId];
          const pageBlock = siteMapData?.block?.[notionPageId]?.value;
          
          console.log(`[TestPageList] Processing:`, {
            urlOrSlug,
            notionPageId,
            hasPageData: !!siteMapData,
            hasPageBlock: !!pageBlock
          });
        
        // タイトルの取得（複数の方法を試す）
        let title = 'Untitled';
        
          // デバッグ: ページブロック全体を確認
          if (pageBlock) {
            console.log(`[Page ${notionPageId}] Block type: ${pageBlock.type}`);
            console.log(`[Page ${notionPageId}] Has properties: ${!!pageBlock.properties}`);
            if (pageBlock.properties) {
              console.log(`[Page ${notionPageId}] Property keys:`, Object.keys(pageBlock.properties));
            }
          }
        
        // 方法1: properties.titleから取得
        if (pageBlock?.properties?.title) {
          const titleProperty = pageBlock.properties.title;
          console.log(`[Page ${notionPageId}] Title property:`, JSON.stringify(titleProperty));
          if (Array.isArray(titleProperty)) {
            if (titleProperty.length > 0 && Array.isArray(titleProperty[0])) {
              if (titleProperty[0].length > 0) {
                title = titleProperty[0][0];
                console.log(`[Page ${notionPageId}] Extracted title from properties.title:`, title);
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
              console.log(`[Page ${notionPageId}] Found property ${key}:`, prop);
              
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
            console.log(`[Page ${notionPageId}] Has page icon:`, pageBlock.format.page_icon);
          }
          
          // ページブロックのcontentから最初のテキストを取得
          if (pageBlock.content && Array.isArray(pageBlock.content)) {
            const firstContentId = pageBlock.content[0];
            if (firstContentId && siteMapData?.block?.[firstContentId]?.value) {
              const firstBlock = siteMapData.block[firstContentId].value;
              if (firstBlock.type === 'header' || firstBlock.type === 'sub_header' || firstBlock.type === 'sub_sub_header') {
                if (firstBlock.properties?.title?.[0]?.[0]) {
                  title = firstBlock.properties.title[0][0];
                  console.log(`[Page ${notionPageId}] Got title from first header block:`, title);
                }
              }
            }
          }
        }
        
          // 2. コレクションの場合のタイトル取得
          if (title === 'Untitled' && siteMapData?.collection) {
            const collectionId = Object.keys(siteMapData.collection)[0];
            const collection = siteMapData.collection[collectionId]?.value;
            if (collection?.name) {
              if (Array.isArray(collection.name) && collection.name[0]) {
                title = collection.name[0][0] || collection.name[0] || 'Untitled';
              } else if (typeof collection.name === 'string') {
                title = collection.name;
              }
              console.log(`[Page ${notionPageId}] Got title from collection:`, title);
            }
          }
          
          // 3. URLスラッグから推測（最終手段）
          if (title === 'Untitled' && urlOrSlug && urlOrSlug !== '/') {
            // URLをタイトルとして使用（キャメルケースやハイフンを変換）
            title = urlOrSlug
              .replace(/^\//, '') // 先頭のスラッシュを削除
              .replace(/-/g, ' ') // ハイフンをスペースに
              .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCaseをスペース区切りに
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            console.log(`[Page ${notionPageId}] Generated title from URL:`, title);
          }
          
          console.log(`[Page ${notionPageId}] Final title: '${title}', ID: '${notionPageId}'`);
          
          // 最終的なページデータを作成
          const result = {
            id: notionPageId,           // 正しいNotionページID
            title: title,               // 取得したタイトル
            url: urlOrSlug,            // URL/スラッグ
            slug: urlOrSlug,           // 明確にするため追加
            type: pageBlock?.type || 'unknown',
            hasContent: !!pageBlock?.content,
            lastEdited: pageBlock?.last_edited_time ? 
              new Date(pageBlock.last_edited_time).toLocaleString('ja-JP') : 
              null
          };
          
          // 検証: IDがUUID形式であることを確認
          const isValidUUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(notionPageId.replace(/-/g, ''));
          if (!isValidUUID) {
            console.warn(`[Page ${notionPageId}] WARNING: Page ID is not a valid UUID format!`);
          }
          
          console.log(`[Page ${notionPageId}] Returning:`, { 
            id: result.id, 
            title: result.title,
            url: result.url,
            idIsUUID: isValidUUID,
            titleLength: result.title.length 
          });
          
          allPagesWithDetails.push(result);
        } catch (e) {
          console.error(`[Page ${pageId}] Error processing:`, e);
          allPagesWithDetails.push({
            id: pageId as string,
            title: 'Untitled',
            url: urlOrSlug,
            slug: urlOrSlug,
            type: 'unknown',
            hasContent: false,
            lastEdited: null
          });
        }
      }
    }
    
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
        pageCount: allPagesWithDetails.length,
        uniquePageCount: allPageIds.length,
        duplicateCount: Math.max(0, allPagesWithDetails.length - allPageIds.length),
        rootPageId: process.env.NOTION_ROOT_PAGE_ID || process.env.NOTION_PAGE_ID || 'Not set',
        siteMap: {
          total: allPagesWithDetails.length,
          unique: allPageIds.length,
          duplicates: Math.max(0, allPagesWithDetails.length - allPageIds.length),
          pages: allPagesWithDetails
        },
        message: `${allPagesWithDetails.length}個のページが検出されました`,
        siteMapDetails: {
          count: allPagesWithDetails.length,
          sample: allPagesWithDetails.slice(0, 5).map(p => ({ id: p.id, title: p.title, url: p.url })),
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
                     allPagesWithDetails.length > 0 ? 'Use getSiteMap' : 
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