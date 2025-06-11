// 検索専用のシンプルなNotionクライアント実装
// Next.jsではグローバルなfetchが使用可能

// 簡易版Notion APIクライアント（検索専用）
export async function searchNotion(query: string) {
  if (!query || query.trim().length < 2) {
    return { results: [], total: 0 };
  }

  // 環境変数からの設定読み込み
  const notionToken = process.env.NOTION_API_SECRET;
  const rootPageId = process.env.NOTION_PAGE_ID;
  
  // 認証トークンがない場合はエラー
  if (!notionToken) {
    console.error('NOTION_API_SECRET環境変数が設定されていません。');
    return { results: [], total: 0 };
  }
  
  console.log(`検索クエリ: "${query}", 対象ページID: ${rootPageId || '指定なし'}`);
  
  try {
    // Notion APIのエンドポイント
    const url = 'https://api.notion.com/v1/search';
    
    // リクエストボディ
    const body = {
      query: query.trim(),
      page_size: 20,
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      }
    };
    
    // 特定のページIDが指定されている場合、検索対象を制限
    if (rootPageId) {
      body['filter'] = {
        value: 'page',
        property: 'object'
      };
    }
    
    // APIリクエスト
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // レスポンスのステータスコードをチェック
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Notion API エラー: ${response.status} ${response.statusText}`, errorText);
      return { results: [], total: 0 };
    }
    
    // レスポンスをJSONとしてパース
    const data = await response.json();
    
    console.log(`検索結果: ${data.results?.length || 0}件`);
    
    // 検索結果を返す（最初の2件のみ詳細をログに出力）
    if (data.results?.length > 0) {
      console.log('検索結果サンプル:', 
        JSON.stringify(data.results.slice(0, 2).map(r => ({
          id: r.id,
          url: r.url,
          title: r.properties?.title?.title?.[0]?.plain_text || r.title?.[0]?.[0] || '無題'
        })), null, 2)
      );
    }
    
    return data;
  } catch (error) {
    console.error('Notion検索エラー:', error);
    return { results: [], total: 0 };
  }
}
