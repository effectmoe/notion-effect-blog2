/**
 * Notionページの検索対象フラグをチェック
 */

import { notion } from '../notion-api'

/**
 * ページが検索対象かどうかをチェック
 */
export async function isPageSearchable(pageId: string): Promise<boolean> {
  try {
    const page = await notion.getPage(pageId)
    if (!page) return false
    
    // ページのプロパティから「検索対象」チェックボックスを取得
    const block = page.block[pageId]?.value
    const properties = block?.properties
    
    // プロパティIDでチェック（デバッグ情報から: |}VV が検索対象のプロパティID）
    const searchableProperty = properties?.['|}VV'] || 
                             properties?.['検索対象'] || 
                             properties?.['Searchable'] || 
                             properties?.['Public']
    
    if (searchableProperty && searchableProperty[0] && searchableProperty[0][0]) {
      const value = searchableProperty[0][0]
      return value === 'Yes' || value === 'true' || value === true || value === '✓'
    }
    
    // デフォルトは検索対象外
    return false
  } catch (error) {
    console.error(`Error checking if page ${pageId} is searchable:`, error)
    return false
  }
}

/**
 * 複数ページの検索対象状態を一括チェック
 */
export async function filterSearchablePages(pageIds: string[]): Promise<string[]> {
  const searchablePages: string[] = []
  
  // バッチ処理で効率化
  const batchSize = 5
  for (let i = 0; i < pageIds.length; i += batchSize) {
    const batch = pageIds.slice(i, i + batchSize)
    const promises = batch.map(async (pageId) => {
      const isSearchable = await isPageSearchable(pageId)
      return { pageId, isSearchable }
    })
    
    const results = await Promise.all(promises)
    
    for (const { pageId, isSearchable } of results) {
      if (isSearchable) {
        searchablePages.push(pageId)
      }
    }
  }
  
  return searchablePages
}