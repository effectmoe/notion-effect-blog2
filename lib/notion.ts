import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap = await notion.getPage(pageId)

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
    }
  }

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  return recordMap
}

export async function search(params: SearchParams | { query: string }): Promise<SearchResults> {
  // 環境変数の確認
  console.log('NOTION_PAGE_ID:', process.env.NOTION_PAGE_ID);
  console.log('rootNotionPageId:', process.env.NOTION_ROOT_PAGE_ID || 'not set');
  
  // 検索パラメータの設定
  // ancestorIdは必ず文字列を渡すようにする
  const rootId = process.env.NOTION_PAGE_ID || '';
  
  const searchParams: SearchParams = {
    query: params.query,
    ancestorId: rootId,
    filters: {
      isDeletedOnly: false,
      excludeTemplates: true,
      isNavigableOnly: false,    // falseに変更して検索範囲を広げる
      requireEditPermissions: false,
      includePublicPagesWithoutExplicitAccess: true,
      // ancestorIdsは検索範囲を広げるため一時的にコメントアウト
      // ancestorIds: rootId ? [rootId] : undefined
    } as any,
    sort: {
      field: 'relevance',
      direction: 'desc'
    },
    limit: 100 // 検索結果を増やす
  } as SearchParams;
  
  // クエリがない場合や短すぎる場合は空の結果を返す
  if (!searchParams.query || searchParams.query.trim().length < 2) {
    return { results: [], total: 0, recordMap: { block: {} } } as SearchResults
  }

  // クエリをトリム
  searchParams.query = searchParams.query.trim();
  
  console.log('検索パラメータ詳細:', JSON.stringify(searchParams, null, 2));
  
  try {
    console.log('Notion API search実行...');
    const results = await notion.search(searchParams);
    
    console.log('検索結果概要:', {
      resultsCount: results?.results?.length || 0,
      totalCount: results?.total || 0
    });
    
    if (results?.results?.length === 0) {
      console.log('検索結果が見つかりませんでした。検索クエリ:', params.query);
      console.log('ancestorIdを外して再検索を試みます...');
      
      // ancestorIdを外して再検索
      const searchParamsWithoutAncestor = {
        ...searchParams,
        ancestorId: undefined,
        filters: {
          ...searchParams.filters,
          ancestorIds: undefined
        } as any
      };
      
      try {
        const fallbackResults = await notion.search(searchParamsWithoutAncestor);
        console.log('ancestorIdなしの検索結果:', {
          resultsCount: fallbackResults?.results?.length || 0,
          totalCount: fallbackResults?.total || 0
        });
        
        return fallbackResults as SearchResults;
      } catch (fallbackErr) {
        console.error('ancestorIdなしの検索エラー:', fallbackErr);
        return results as SearchResults;
      }
    }
    
    return results as SearchResults;
  } catch (err) {
    console.error('Notion検索エラー:', err);
    return { results: [], total: 0, recordMap: { block: {} } } as SearchResults;
  }
}
