// 重要なページのリストを管理
export const IMPORTANT_PAGES = [
  // メインページ
  { id: process.env.NOTION_PAGE_ID, name: 'ホーム' },
  
  // 主要なセクション（実際のページIDに置き換えてください）
  // { id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', name: 'About' },
  // { id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', name: 'Products' },
  // { id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', name: 'Blog' },
];

// デフォルトの重要ページスラッグ
export const DEFAULT_IMPORTANT_SLUGS = [
  'cafekinesi',
  'カフェキネシ構造',
  '都道府県リスト',
  'カフェキネシコンテンツ',
  '講座一覧',
  'ブログ',
  'アロマ購入',
  'お申込みの流れ',
  'カテゴリー',
  'プライバシーポリシー'
];

// 動的に重要なページを取得
export async function getImportantPageIds(): Promise<string[]> {
  const pageIds: string[] = [];
  
  // 環境変数から追加の重要ページIDを取得
  const additionalPageIds = process.env.IMPORTANT_PAGE_IDS?.split(',') || [];
  
  // 基本のページID
  if (process.env.NOTION_PAGE_ID) {
    pageIds.push(process.env.NOTION_PAGE_ID);
  }
  
  // 追加のページID
  pageIds.push(...additionalPageIds.filter(id => id.trim()));
  
  // 重複を削除
  return [...new Set(pageIds)];
}