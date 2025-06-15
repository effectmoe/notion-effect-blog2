import { NextApiRequest, NextApiResponse } from 'next';
import { getSiteMap } from '@/lib/get-site-map';
import { getPage } from '@/lib/notion';

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
    const siteMap = await getSiteMap();
    const pageIds = Object.keys(siteMap.canonicalPageMap).slice(0, 10); // 最初の10ページ

    console.log(`Warming up cache for ${pageIds.length} pages...`);

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
      message: `Cache warmed up for ${successful} pages`
    });

  } catch (error) {
    console.error('Cache warmup error:', error);
    res.status(500).json({ 
      error: 'Failed to warm up cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}