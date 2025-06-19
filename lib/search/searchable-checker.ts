/**
 * Notionページの検索対象フラグをチェック
 */

import { getPagePropertiesFromOfficialAPI } from './official-api-checker'

/**
 * ページが検索対象かどうかをチェック
 * 公式APIを使用してチェックボックスプロパティを正確に読み取る
 */
export async function isPageSearchable(pageId: string): Promise<boolean> {
  try {
    // 公式APIを使用してページプロパティを取得
    const properties = await getPagePropertiesFromOfficialAPI(pageId)
    if (!properties) {
      console.log(`No properties found for page ${pageId}`)
      return false
    }
    
    // デバッグ: すべてのプロパティキーをログ出力
    console.log(`Properties for page ${pageId}:`, Object.keys(properties))
    
    // チェックボックスプロパティを探す
    // プロパティ名とIDの両方でチェック
    const possibleNames = ['検索対象', 'Searchable', 'Public', '|}VV']
    let searchableProperty = null
    
    for (const name of possibleNames) {
      if (properties[name]) {
        searchableProperty = properties[name]
        console.log(`Found searchable property under name: ${name}`, searchableProperty)
        break
      }
    }
    
    // プロパティIDでも検索（|}VV）
    if (!searchableProperty) {
      for (const [key, value] of Object.entries(properties)) {
        if (key === '|}VV' || (value as any)?.id === '|}VV') {
          searchableProperty = value
          console.log(`Found searchable property by ID: ${key}`, searchableProperty)
          break
        }
      }
    }
    
    // チェックボックスの値を確認
    if (searchableProperty && searchableProperty.type === 'checkbox') {
      const isSearchable = searchableProperty.checkbox === true
      console.log(`Page ${pageId} searchable status:`, isSearchable)
      return isSearchable
    }
    
    // デフォルトは検索対象外
    console.log(`No searchable checkbox found for page ${pageId}, defaulting to false`)
    return false
  } catch (error) {
    console.error(`Error checking if page ${pageId} is searchable:`, error)
    return false
  }
}

/**
 * 複数ページの検索対象状態を一括チェック
 * 並列処理とタイムアウトを適用して効率化
 */
export async function filterSearchablePages(pageIds: string[]): Promise<string[]> {
  if (pageIds.length === 0) return []
  
  console.log(`Filtering ${pageIds.length} pages for searchability...`)
  const searchablePages: string[] = []
  
  // バッチ処理で効率化（公式APIのレート制限を考慮）
  const batchSize = 10 // 公式APIは非公式APIより安定しているため、バッチサイズを増やす
  const timeout = 5000 // 5秒のタイムアウト
  
  for (let i = 0; i < pageIds.length; i += batchSize) {
    const batch = pageIds.slice(i, i + batchSize)
    const promises = batch.map(async (pageId) => {
      // タイムアウト付きでチェック
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), timeout)
      })
      
      try {
        const isSearchable = await Promise.race([
          isPageSearchable(pageId),
          timeoutPromise
        ])
        return { pageId, isSearchable }
      } catch (error) {
        console.error(`Error checking page ${pageId}:`, error)
        return { pageId, isSearchable: false }
      }
    })
    
    const results = await Promise.all(promises)
    
    for (const { pageId, isSearchable } of results) {
      if (isSearchable) {
        searchablePages.push(pageId)
      }
    }
    
    // 進捗をログ出力
    console.log(`Processed ${Math.min(i + batchSize, pageIds.length)}/${pageIds.length} pages`)
  }
  
  console.log(`Found ${searchablePages.length} searchable pages out of ${pageIds.length}`)
  return searchablePages
}

/**
 * キャッシュ機能付きの検索対象チェック（オプション）
 */
const searchableCache = new Map<string, { isSearchable: boolean; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5分間のキャッシュ

export async function isPageSearchableWithCache(pageId: string): Promise<boolean> {
  const cached = searchableCache.get(pageId)
  const now = Date.now()
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.isSearchable
  }
  
  const isSearchable = await isPageSearchable(pageId)
  searchableCache.set(pageId, { isSearchable, timestamp: now })
  
  return isSearchable
}