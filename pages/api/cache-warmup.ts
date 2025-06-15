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
      console.log('No pages found in siteMap, using fallback strategy');
      
      // デフォルトの重要ページスラッグ
      const defaultSlugs = [
        'cafekinesi',
        'カフェキネシ構造',
        '都道府県リスト',
        'カフェキネシコンテンツ',
        '講座一覧',
        'ブログ',
        'アロマ購入',
        'カフェキネシとは何ですか',
        '講座料金はいくらですか',
        'オンライン受講は可能ですか'
      ];
      
      // 環境変数のページIDも含める
      const importantPageIds = await getImportantPageIds();
      
      // 結合して重複を削除
      pageIds = [...new Set([...importantPageIds, ...defaultSlugs])].slice(0, 15);
      
      console.log('Using fallback page IDs:', pageIds);
      console.log('Fallback includes:', {
        importantPageIds: importantPageIds.length,
        defaultSlugs: defaultSlugs.length,
        total: pageIds.length
      });
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
      pageIds.map(async (pageId) => {
        try {
          console.log(`Fetching page: ${pageId}`);
          const result = await getPage(pageId);
          console.log(`Successfully fetched: ${pageId}`);
          return { pageId, success: true };
        } catch (error) {
          console.error(`Failed to fetch page ${pageId}:`, error);
          return { pageId, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)).length;
    
    // 失敗したページの詳細を取得
    const failedDetails = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success))
      .map((r, idx) => ({
        pageId: pageIds[idx],
        reason: r.status === 'rejected' ? r.reason : r.value?.error
      }));

    res.status(200).json({
      success: true,
      warmedUp: successful,
      failed,
      message: `Cache warmed up for ${successful} pages`,
      pageIds: pageIds.slice(0, 5), // デバッグ用：最初の5ページIDを返す
      totalPages: pageIds.length,
      failedDetails: failedDetails.slice(0, 3) // 最初の3つの失敗詳細
    });

  } catch (error) {
    console.error('Cache warmup error:', error);
    res.status(500).json({ 
      error: 'Failed to warm up cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}