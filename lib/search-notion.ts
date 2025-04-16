import ExpiryMap from 'expiry-map'
import pMemoize from 'p-memoize'
import { SearchParams, SearchResults } from 'notion-types' // オリジナルの型をインポート

import type * as types from './types'
import { api } from './config'

// オリジナルの型を使用したタイプエイリアス
type SearchNotionFn = (params: SearchParams) => Promise<SearchResults>

export const searchNotion = pMemoize(searchNotionImpl, {
  cacheKey: (args) => args[0]?.query,
  cache: new ExpiryMap(10_000)
}) as SearchNotionFn // 型キャストを追加

async function searchNotionImpl(
  params: types.SearchParams | { query: string }
): Promise<SearchResults> { // 戻り値の型を修正
  // クエリのロギング
  console.log('Client search query:', params.query)

  // 検索パラメータの標準化
  const searchParams: types.SearchParams = {
    query: params.query,
    ancestorId: api.notionPageId,
    filters: {
      isDeletedOnly: false,
      excludeTemplates: true,
      isNavigableOnly: false,
      requireEditPermissions: false,
      includePublicPagesWithoutExplicitAccess: true
    },
    limit: 20
  };
  
  return fetch(api.searchNotion, {
    method: 'POST',
    body: JSON.stringify(searchParams),
    headers: {
      'content-type': 'application/json'
    }
  })
    .then((res) => {
      if (res.ok) {
        return res
      }

      // convert non-2xx HTTP responses into errors
      const error: any = new Error(res.statusText)
      error.response = res
      console.error('Search API error:', error)
      throw error
    })
    .then((res) => res.json())
    .then((results) => {
      // 結果のロギング
      console.log(`Client received ${results.results?.length || 0} results for query: ${params.query}`)
      return results as SearchResults // 型キャスト
    })
    .catch((err) => {
      console.error('Search request failed:', err)
      return { results: [], total: 0, recordMap: { block: {} } } as SearchResults
    })
}
