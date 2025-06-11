/**
 * Notionで検索対象にチェックが入っているページのID
 * 手動で更新が必要ですが、確実に動作します
 */

export const SEARCHABLE_PAGE_IDS = [
  // チェックが入っているページ（スクリーンショットから確認）
  '1ceb802cb0c680f29369dba86095fb38', // ホームページ（常に含める）
  '1d3b802cb0c680519714ffd510528bc0', // カフェキネシ公認インストラクターの紹介
  '1d3b802cb0c681b89b3ac07b70b7f37f', // カフェキネシ講座の概要と内容
  '1d3b802cb0c680569ac6e94e37eebfbf', // ブログ
  '1d3b802cb0c680e48557cffb5e357161', // カフェキネシラバーズ
  // Notionを使ったウェブサイトのアプローチ方法（ページIDが必要）
]

/**
 * ページIDが検索対象かどうかを確認
 */
export function isSearchablePage(pageId: string): boolean {
  return SEARCHABLE_PAGE_IDS.includes(pageId)
}