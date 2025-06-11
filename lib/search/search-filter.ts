/**
 * 検索結果のフィルタリング機能
 */

// システムページやNotionの内部ページを除外するフィルター
export function isSystemPage(pageId: string, title: string = ''): boolean {
  // Notionのシステムページのパターン
  const systemPagePatterns = [
    // Notion本体のページ
    /^notion\./i,
    /^getting started/i,
    /^quick note/i,
    /^task list/i,
    /^reading list/i,
    /^journal/i,
    /^meeting notes/i,
    /^personal home/i,
    /^team home/i,
    /^workspace/i,
    
    // テンプレート関連
    /template/i,
    /テンプレート/,
    
    // ゴミ箱・アーカイブ
    /trash/i,
    /archive/i,
    /ゴミ箱/,
    /アーカイブ/,
    
    // プライベートページ
    /private/i,
    /draft/i,
    /下書き/,
    
    // 設定関連
    /settings/i,
    /config/i,
    /設定/,
  ];
  
  // タイトルでチェック
  const titleLower = title.toLowerCase();
  for (const pattern of systemPagePatterns) {
    if (pattern.test(titleLower)) {
      return true;
    }
  }
  
  // 特定のページIDパターン（Notionの内部ページ）
  const systemPageIds = [
    // よく見られるNotionシステムページのID
    '0000000000000000000000000000', // 例
  ];
  
  if (systemPageIds.includes(pageId)) {
    return true;
  }
  
  return false;
}

// ブログ記事として有効なページかチェック
export function isValidBlogPage(
  pageId: string, 
  title: string = '', 
  content: string = ''
): boolean {
  // システムページは除外
  if (isSystemPage(pageId, title)) {
    return false;
  }
  
  // タイトルが空のページは除外
  if (!title || title.trim().length === 0) {
    return false;
  }
  
  // Untitledページは除外（部分一致も含む）
  if (title.toLowerCase().includes('untitled') || 
      title.includes('無題') || 
      title.includes('のページ')) {
    return false;
  }
  
  // Notionページという名前も除外
  if (title.toLowerCase().includes('notion') && title.includes('ページ')) {
    return false;
  }
  
  // 内容が極端に短いページは除外（10文字未満）
  if (content && content.trim().length < 10) {
    return false;
  }
  
  // テストページは除外
  if (/^test/i.test(title) || /テスト/.test(title)) {
    return false;
  }
  
  return true;
}

// 検索結果をフィルタリング
export function filterSearchResults<T extends { 
  pageId: string; 
  title: string; 
  content?: string;
}>(results: T[]): T[] {
  return results.filter(result => 
    isValidBlogPage(result.pageId, result.title, result.content)
  );
}

// ページIDが公開ブログのルート配下にあるかチェック
export function isUnderBlogRoot(pageId: string, rootPageId: string): boolean {
  // TODO: ページの階層構造をチェックする実装
  // 現時点では、すべてのページを許可
  return true;
}