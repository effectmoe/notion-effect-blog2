import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';

// 固定のページリストをバックアップとして定義
const BACKUP_PAGE_IDS = [
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
  // 主要なページを追加
  '1d3b802cb0c680519714ffd510528bc0', // ブログ
  '20db802cb0c681058506c03cbdd4c04f', // アロマ購入
  '1d3b802cb0c6805f959ec180966b2a45', // お申込みの流れ
  '1d3b802cb0c680569ac6e94e37eebfbf', // カテゴリー
  '20db802cb0c681368d5dc09b858cee46', // プライバシーポリシー
];

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
    
    // ページIDが少ない場合は、バックアップリストを使用
    if (pageIds.length < 10) {
      console.log(`Only ${pageIds.length} pages found, using backup list`);
      // バックアップリストから正規化して追加
      const backupIds = BACKUP_PAGE_IDS
        .filter(id => isValidPageId(id))
        .map(id => normalizePageId(id));
      
      // 既存のページIDとマージ（重複を避ける）
      const mergedIds = [...new Set([...pageIds, ...backupIds])];
      pageIds = mergedIds;
    }
    
    // ルートページIDを必ず含める（正規化して追加）
    const rootPageId = process.env.NOTION_PAGE_ID;
    if (rootPageId && isValidPageId(rootPageId)) {
      const normalizedRootId = normalizePageId(rootPageId);
      if (!pageIds.includes(normalizedRootId)) {
        pageIds.unshift(normalizedRootId);
      }
    }
    
    // シンプルに：すべてのページを平等に扱う
    // 重複を削除してすべてのページを返す
    const uniquePageIds = [...new Set(pageIds)];
    const selectedPageIds = uniquePageIds; // すべてのページを返す
    
    res.status(200).json({
      success: true,
      pageIds: selectedPageIds,
      total: uniquePageIds.length,
      message: `Retrieved ${selectedPageIds.length} pages`
    });

  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ 
      error: 'Failed to get page list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}