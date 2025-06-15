/**
 * Normalize page ID to ensure compatibility with Notion API
 * Notion APIはハイフン付き・なし両方の形式を受け付けるが、
 * 一貫性のためにハイフンなしの形式に統一する
 */
export function normalizePageId(pageId: string): string {
  if (!pageId || typeof pageId !== 'string') {
    return pageId;
  }
  
  // ハイフンを削除
  const normalized = pageId.replace(/-/g, '');
  
  // 32文字の16進数文字列であることを確認
  if (normalized.length === 32 && /^[a-f0-9]+$/i.test(normalized)) {
    return normalized;
  }
  
  // 無効な形式の場合は元の値を返す
  return pageId;
}

/**
 * Check if a string is a valid Notion page ID
 * ハイフン付き・なし両方の形式を有効とする
 */
export function isValidPageId(pageId: string): boolean {
  if (!pageId || typeof pageId !== 'string') {
    return false;
  }
  
  // ハイフンを削除して検証
  const normalized = pageId.replace(/-/g, '');
  
  // 32文字の16進数文字列であることを確認
  return normalized.length === 32 && /^[a-f0-9]+$/i.test(normalized);
}