// クライアントサイド検索用のユーティリティ
// これはNotionのAPIでの検索が機能しない場合のフォールバックです

// 簡易的なクライアントサイド検索ロジック
export function clientSideSearch(content: Record<string, any>[], query: string) {
  if (!content || !Array.isArray(content) || content.length === 0) {
    return [];
  }
  
  // 空のクエリの場合はすべてを返す
  if (!query || query.trim() === '') {
    return content;
  }
  
  // 検索クエリの正規化
  const normalizedQuery = query.trim().toLowerCase();
  const queryTerms = normalizedQuery.split(/\s+/);
  
  // 各ページを検索してスコアリング
  return content
    .map(item => {
      // 検索対象テキストを抽出
      const title = extractText(item.title);
      const description = extractText(item.description);
      const text = extractText(item.text);
      
      // 検索対象のコンテンツ
      const searchableContent = `${title} ${description} ${text}`.toLowerCase();
      
      // スコアリング（単純なヒット数）
      let score = 0;
      for (const term of queryTerms) {
        // 完全一致の場合はより高いスコア
        if (title.toLowerCase().includes(term)) {
          score += 10;
        }
        
        // 通常の一致
        const matches = (searchableContent.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      }
      
      return {
        ...item,
        score
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

// テキスト抽出ヘルパー（様々な形式に対応）
function extractText(value: any): string {
  if (!value) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(extractText).join(' ');
  }
  
  if (typeof value === 'object') {
    // Notionの一般的なプロパティ構造
    if (value.plain_text) {
      return value.plain_text;
    }
    
    if (value.title && Array.isArray(value.title)) {
      return value.title.map(extractText).join(' ');
    }
    
    // その他のオブジェクト構造を再帰的に処理
    return Object.values(value).map(extractText).join(' ');
  }
  
  return String(value);
}
