import { type ExtendedRecordMap } from 'notion-types'
import { getBlockTitle, getBlockParentPage } from 'notion-utils'

export interface BreadcrumbItem {
  id: string
  title: string
  url: string
}

/**
 * ページの階層構造からパンくずリストを生成
 * @param pageId 現在のページID
 * @param recordMap Notionのレコードマップ
 * @param rootPageId ルートページのID
 * @returns パンくずリストの配列
 */
export function getBreadcrumbs(
  pageId: string,
  recordMap: ExtendedRecordMap,
  rootPageId: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = []
  
  if (!pageId || !recordMap) {
    return breadcrumbs
  }

  // 現在のページから親ページを辿る
  let currentPageId = pageId
  const visitedPages = new Set<string>() // 無限ループ防止
  
  while (currentPageId && currentPageId !== rootPageId && !visitedPages.has(currentPageId)) {
    visitedPages.add(currentPageId)
    
    const block = recordMap.block[currentPageId]?.value
    if (!block) break
    
    const title = getBlockTitle(block, recordMap) || 'Untitled'
    
    // ページをパンくずに追加（先頭に挿入）
    breadcrumbs.unshift({
      id: currentPageId,
      title: title,
      url: currentPageId === pageId ? '' : `/${currentPageId}`
    })
    
    // 親ページを取得
    const parentPage = getBlockParentPage(block, recordMap)
    currentPageId = parentPage?.id || ''
  }
  
  // ホームページを先頭に追加（現在のページがホームでない場合）
  if (pageId !== rootPageId && breadcrumbs.length > 0) {
    breadcrumbs.unshift({
      id: rootPageId,
      title: 'ホーム',
      url: '/'
    })
  }
  
  return breadcrumbs
}

/**
 * パンくずリストからJSON-LD構造化データを生成
 * @param breadcrumbs パンくずリストの配列
 * @param baseUrl サイトのベースURL
 * @returns JSON-LD構造化データ
 */
export function getBreadcrumbJsonLd(
  breadcrumbs: BreadcrumbItem[],
  baseUrl: string
) {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.title,
      'item': item.url ? `${baseUrl}${item.url}` : undefined
    }))
  }
}