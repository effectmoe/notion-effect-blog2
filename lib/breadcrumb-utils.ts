import { type ExtendedRecordMap } from 'notion-types'
import { getBlockTitle, getBlockParentPage } from 'notion-utils'
import { getParentPageId } from './notion-page-utils'

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
  
  // 本番環境では無効化
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    console.log('🍞 getBreadcrumbs Debug - Start:', {
      pageId,
      rootPageId,
      hasRecordMap: !!recordMap,
      blockCount: Object.keys(recordMap?.block || {}).length
    })
  }
  
  if (!pageId || !recordMap) {
    console.log('getBreadcrumbs: Early return - missing pageId or recordMap')
    return breadcrumbs
  }

  // 現在のページから親ページを辿る
  let currentPageId = pageId
  const visitedPages = new Set<string>() // 無限ループ防止
  let iterationCount = 0
  
  while (currentPageId && currentPageId !== rootPageId && !visitedPages.has(currentPageId)) {
    visitedPages.add(currentPageId)
    iterationCount++
    
    const block = recordMap.block[currentPageId]?.value
    console.log(`getBreadcrumbs Iteration ${iterationCount}:`, {
      currentPageId,
      hasBlock: !!block,
      blockType: block?.type,
      parentId: block?.parent_id,
      parentTable: block?.parent_table
    })
    
    if (!block) {
      console.log('getBreadcrumbs: Breaking - no block found')
      break
    }
    
    const title = getBlockTitle(block, recordMap) || 'Untitled'
    
    // ページをパンくずに追加（先頭に挿入）
    breadcrumbs.unshift({
      id: currentPageId,
      title: title,
      url: currentPageId === pageId ? '' : `/${currentPageId}`
    })
    
    // 親ページを取得 - まず代替実装を試す
    const parentPageIdAlt = getParentPageId(block, recordMap)
    const parentPage = getBlockParentPage(block, recordMap)
    
    console.log('Parent page result:', {
      hasParentPage: !!parentPage,
      parentPageId: parentPage?.id,
      parentPageTitle: parentPage ? getBlockTitle(parentPage, recordMap) : null,
      alternativeParentId: parentPageIdAlt,
      usingAlternative: !parentPage?.id && !!parentPageIdAlt
    })
    
    // notion-utilsの結果がない場合は代替実装を使用
    currentPageId = parentPage?.id || parentPageIdAlt || ''
  }
  
  console.log('getBreadcrumbs: After loop:', {
    breadcrumbsCount: breadcrumbs.length,
    breadcrumbs: breadcrumbs.map(b => ({ id: b.id, title: b.title }))
  })
  
  // パンくずリストの最初の要素をホーム（CafeKinesi）に置き換える
  // CafeKinesiページのIDを検出して修正
  const cafeKinesiId = '1ceb802cb0c680f29369dba86095fb38'
  
  if (breadcrumbs.length > 0) {
    // CafeKinesiまたはその親がある場合、それより上は削除
    const cafeKinesiIndex = breadcrumbs.findIndex(b => 
      b.id === cafeKinesiId || b.title === 'CafeKinesi'
    )
    
    if (cafeKinesiIndex >= 0) {
      // CafeKinesiより上の階層を削除
      breadcrumbs = breadcrumbs.slice(cafeKinesiIndex)
      // CafeKinesiを「ホーム」として扱う
      if (breadcrumbs[0]) {
        breadcrumbs[0].title = 'ホーム'
        breadcrumbs[0].url = '/'
      }
    }
  }
  
  if (isDev) {
    console.log('🍞 getBreadcrumbs - Final result:', {
      currentPageId: pageId,
      rootPageId: rootPageId,
      isRootPage: pageId === rootPageId,
      totalCount: breadcrumbs.length,
      breadcrumbs: breadcrumbs.map(b => ({ id: b.id, title: b.title, url: b.url }))
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