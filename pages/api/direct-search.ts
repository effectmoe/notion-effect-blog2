// このファイルはNotion公式APIを使った検索エンドポイント
import { type NextApiRequest, type NextApiResponse } from 'next'
import { searchNotion } from '@/lib/notion-direct-search'

export default async function directSearch(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS (プリフライト) リクエストには200を返す
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // リクエスト内容を確認
    console.log('Direct Search API: リクエスト本文', JSON.stringify(req.body, null, 2));
    
    // 検索クエリ取得
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    // 環境変数チェック
    console.log('環境変数:', {
      NOTION_API_SECRET: process.env.NOTION_API_SECRET ? '設定済み' : '未設定',
      NOTION_PAGE_ID: process.env.NOTION_PAGE_ID
    });
    
    // 検索実行
    console.log(`検索実行: "${query}"`);
    const results = await searchNotion(query);
    
    // 結果をログに出力
    console.log('検索結果概要:', {
      total: results.total || 0,
      count: results.results?.length || 0
    });
    
    // 結果を返す
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, max-age=60, stale-while-revalidate=60'
    );
    res.status(200).json(results);
  } catch (error) {
    console.error('Direct search API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
