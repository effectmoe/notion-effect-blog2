import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';

// 既知の重要なページIDをハードコード（バックアップ用）
const KNOWN_PAGE_IDS = [
  '1ceb802cb0c680f29369dba86095fb38', // ルートページ
  '208b802cb0c6802db085d73f792a895f', // カフェキネシ構造
  '20db802cb0c6809a9c4be362113bc3fa', // 都道府県リスト
  '1ceb802cb0c681b89b3ac07b70b7f37f', // 講座一覧
  '1ceb802cb0c6814ab43eddb38e80f2e0', // カフェキネシコンテンツ
  '212b802cb0c6808887ebf9ab5017eb6b', // カフェキネシとは何ですか (FAQ)
  '213b802cb0c6808fba84d668cf155624', // 資格の有効期限は (FAQ)
  '212b802cb0c68051accccaa61f27c8cd', // 講座料金はいくらですか (FAQ)
  '213b802cb0c680e985d0f62dd6704d0c', // オンライン受講は可能ですか (FAQ)
  '213b802cb0c680b9bd4dd1be176f5e44', // 講座の所要時間は (FAQ)
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[GetAllPageIds] Starting to fetch all page IDs...');
    
    // まずgetSiteMapを試す（キャッシュをバイパスして最新のデータを取得）
    const siteMap = await getSiteMap(true);
    
    let allPageIds: string[] = [];
    
    // canonicalPageMapから全ページIDを取得
    if (siteMap.canonicalPageMap && typeof siteMap.canonicalPageMap === 'object') {
      // Object.keys() はスラッグを返すので、Object.values() で実際のページIDを取得
      const pageIds = Object.values(siteMap.canonicalPageMap);
      console.log(`[GetAllPageIds] Found ${pageIds.length} pages in canonicalPageMap`);
      
      // 有効なページIDのみをフィルタリングして正規化
      allPageIds = pageIds
        .filter(id => typeof id === 'string' && isValidPageId(id))
        .map(id => normalizePageId(id));
    }
    
    // ページが少ない場合は既知のページIDを追加
    if (allPageIds.length < 50) {
      console.log(`[GetAllPageIds] Only ${allPageIds.length} pages found, adding known page IDs`);
      const knownIds = KNOWN_PAGE_IDS
        .filter(id => isValidPageId(id))
        .map(id => normalizePageId(id));
      
      // 既存のIDとマージ（重複を避ける）
      const mergedIds = [...new Set([...allPageIds, ...knownIds])];
      allPageIds = mergedIds;
    }
    
    // ルートページIDを必ず含める
    const rootPageId = process.env.NOTION_PAGE_ID;
    if (rootPageId && isValidPageId(rootPageId)) {
      const normalizedRootId = normalizePageId(rootPageId);
      if (!allPageIds.includes(normalizedRootId)) {
        allPageIds.unshift(normalizedRootId);
      }
    }
    
    console.log(`[GetAllPageIds] Returning ${allPageIds.length} page IDs`);
    
    res.status(200).json({
      success: true,
      pageIds: allPageIds,
      total: allPageIds.length,
      source: allPageIds.length > 50 ? 'sitemap' : 'sitemap_with_backup',
      message: `Found ${allPageIds.length} pages`
    });

  } catch (error) {
    console.error('[GetAllPageIds] Error:', error);
    res.status(500).json({ 
      error: 'Failed to get all page IDs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}