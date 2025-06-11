/**
 * ページの検証とフィルタリング
 */

import { rootNotionPageId } from '../config'

// ブログのルートページID
const BLOG_ROOT_PAGE_ID = rootNotionPageId || '1ceb802cb0c680f29369dba86095fb38'

// 既知のブログページIDのリスト（ホームページから取得したもの）
const KNOWN_BLOG_PAGE_IDS = [
  '1ceb802cb0c681068bbdd7b2107891f5',
  '1ceb802cb0c681b89b3ac07b70b7f37f',
  '1d3b802cb0c680519714ffd510528bc0',
  '1d3b802cb0c680569ac6e94e37eebfbf',
  '1d3b802cb0c6805f959ec180966b2a45',
  '1d3b802cb0c680b78f23e50d60a8fe4b',
  '1d3b802cb0c680d5a093f49cfd1c675c',
  '1d3b802cb0c680e48557cffb5e357161'
]

/**
 * ページIDがブログの有効なページかチェック
 */
export function isValidBlogPageId(pageId: string): boolean {
  // 既知のブログページIDに含まれているかチェック
  return KNOWN_BLOG_PAGE_IDS.includes(pageId)
}

/**
 * ページがブログルートの配下にあるかチェック
 */
export function isUnderBlogRoot(pageId: string, pageMap: any): boolean {
  // サイトマップに含まれているかチェック
  if (!pageMap || !pageMap[pageId]) {
    return false
  }
  
  // ルートページ自体は含める
  if (pageId === BLOG_ROOT_PAGE_ID) {
    return true
  }
  
  // 既知のブログページIDに含まれているかチェック
  return isValidBlogPageId(pageId)
}

/**
 * 検索対象として有効なページかチェック
 */
export function shouldIndexPage(
  pageId: string,
  title: string,
  pageMap?: any
): boolean {
  // タイトルがないページは除外
  if (!title || title.trim() === '') {
    return false
  }
  
  // Untitledページは除外
  if (title.toLowerCase() === 'untitled' || title === '無題') {
    return false
  }
  
  // テストページは除外
  if (title.toLowerCase().includes('test') || title.includes('テスト')) {
    return false
  }
  
  // プライベートページは除外
  if (title.toLowerCase().includes('private') || 
      title.toLowerCase().includes('draft') ||
      title.includes('下書き') ||
      title.includes('非公開')) {
    return false
  }
  
  // Notionのシステムページは除外
  if (title.toLowerCase().includes('getting started') ||
      title.toLowerCase().includes('quick note') ||
      title.toLowerCase().includes('task list') ||
      title.toLowerCase().includes('template')) {
    return false
  }
  
  // 既知のブログページIDのみ許可
  if (!isValidBlogPageId(pageId)) {
    console.log(`Excluding non-blog page: ${title} (${pageId})`);
    return false
  }
  
  return true
}