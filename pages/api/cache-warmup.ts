import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { getPage } from '@/lib/notion';
import { getImportantPageIds } from '@/lib/get-important-pages';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 認証チェック
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CACHE_CLEAR_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 主要ページのIDを取得
    console.log('Getting site map...');
    const siteMap = await getSiteMap();
    
    // デバッグ情報
    console.log('Site map keys:', Object.keys(siteMap));
    console.log('Canonical page map:', siteMap.canonicalPageMap);
    
    let pageIds: string[] = [];
    
    // canonicalPageMapからページIDを取得
    if (siteMap.canonicalPageMap && typeof siteMap.canonicalPageMap === 'object') {
      pageIds = Object.keys(siteMap.canonicalPageMap).slice(0, 10); // 最初の10ページ
    }
    
    // ページIDが取得できない場合は、重要なページIDを使用
    if (pageIds.length === 0) {
      // デフォルトの重要ページを使用
      const importantPages = await getImportantPageIds();
      
      // ルートページは必ず含める
      const rootPageId = process.env.NOTION_PAGE_ID;
      if (rootPageId) {
        importantPages.unshift(rootPageId);
      }
      
      // 最近アクセスされたページ（仮の実装）
      // 実際には、アクセスログから取得するのが理想的
      const recentPages = [
        'cafekinesi',
        'カフェキネシ構造',
        '都道府県リスト',
        'カフェキネシコンテンツ',
        '講座一覧',
        'ブログ',
        'アロマ購入',
      ];
      
      // ページIDとページスラッグを結合
      pageIds = [...new Set([...importantPages, ...recentPages])].slice(0, 10);
      
      console.log('Using fallback page IDs:', pageIds);
    }

    console.log(`Warming up cache for ${pageIds.length} pages:`, pageIds);

    if (pageIds.length === 0) {
      return res.status(200).json({
        success: true,
        warmedUp: 0,
        failed: 0,
        message: 'No pages found to warm up. Site map might be empty after cache clear.'
      });
    }

    // 並列でページを読み込み（キャッシュに保存される）
    const results = await Promise.allSettled(
      pageIds.map(pageId => getPage(pageId))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.status(200).json({
      success: true,
      warmedUp: successful,
      failed,
      message: `Cache warmed up for ${successful} pages`,
      pageIds: pageIds.slice(0, 5) // デバッグ用：最初の5ページIDを返す
    });

  } catch (error) {
    console.error('Cache warmup error:', error);
    res.status(500).json({ 
      error: 'Failed to warm up cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}