// Notionとの接続をテストするための最もシンプルなエンドポイント
import { type NextApiRequest, type NextApiResponse } from 'next'

export default async function testNotionConnection(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // 環境変数の確認
    const apiKey = process.env.NOTION_API_SECRET;
    const pageId = process.env.NOTION_PAGE_ID;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'NOTION_API_SECRET環境変数が設定されていません' 
      });
    }
    
    // 非常にシンプルなリクエストをNotionのAPIに送信する
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: '', // 空のクエリは全ての閲覧可能なページを返す
        page_size: 1 // 1つだけ結果を取得
      })
    });
    
    // レスポンスのステータスコードをチェック
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Notion API Error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }
    
    // 正常なレスポンスをパース
    const data = await response.json();
    
    // 簡易的なレスポンスを返す
    res.status(200).json({
      status: 'success',
      message: 'Notion APIに正常に接続できました',
      apiKeyIsValid: true,
      resultsCount: data.results?.length || 0,
      pageIdConfigured: !!pageId,
      pageId: pageId ? `${pageId.substring(0, 6)}...` : null,
      firstResult: data.results?.[0] ? {
        id: data.results[0].id,
        object: data.results[0].object,
        hasUrl: !!data.results[0].url
      } : null
    });
  } catch (error) {
    console.error('Notion接続テストエラー:', error);
    res.status(500).json({
      error: 'Notion APIとの接続中にエラーが発生しました',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
