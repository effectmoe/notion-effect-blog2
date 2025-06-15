import { NextApiRequest, NextApiResponse } from 'next';
import { getAllPagesInSpace } from 'notion-utils';
import { notion } from '@/lib/notion-api';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[GetAllPages] Fetching all pages from Notion...');
    
    const rootPageId = process.env.NOTION_PAGE_ID;
    const rootSpaceId = process.env.NOTION_SPACE_ID || undefined;
    
    if (!rootPageId) {
      return res.status(400).json({ error: 'NOTION_PAGE_ID not configured' });
    }

    // Notionから直接すべてのページを取得
    const pageMap = await getAllPagesInSpace(
      rootPageId,
      rootSpaceId,
      async (pageId: string) => {
        console.log(`[GetAllPages] Fetching page: ${pageId}`);
        try {
          return await notion.getPage(pageId);
        } catch (error) {
          console.error(`[GetAllPages] Failed to fetch page ${pageId}:`, error.message);
          return null;
        }
      }
    );

    // ページIDを抽出して正規化
    const pageIds = Object.keys(pageMap)
      .filter(id => {
        const recordMap = pageMap[id];
        // nullやundefinedのページをスキップ
        if (!recordMap) return false;
        // 有効なページIDかチェック
        return isValidPageId(id);
      })
      .map(id => normalizePageId(id));

    console.log(`[GetAllPages] Found ${pageIds.length} pages`);

    res.status(200).json({
      success: true,
      pageIds,
      total: pageIds.length,
      message: `Found ${pageIds.length} pages in Notion`
    });

  } catch (error) {
    console.error('[GetAllPages] Error:', error);
    res.status(500).json({ 
      error: 'Failed to get all pages',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}