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
  const searchParams: SearchParams = {
    query: params.query,
    ancestorId: process.env.NOTION_PAGE_ID,
    filters: {
      isDeletedOnly: false,
      excludeTemplates: true,
      isNavigableOnly: false,    // falseに変更して検索範囲を広げる
      requireEditPermissions: false,
      includePublicPagesWithoutExplicitAccess: true,
      ancestorIds: [process.env.NOTION_PAGE_ID]
    },
    limit: 50
  };
  
  // クエリがない場合や短すぎる場合は空の結果を返す
  if (!searchParams.query || searchParams.query.trim().length < 2) {
    return { results: [], total: 0, recordMap: { block: {} } } as SearchResults
  }

  // クエリをトリム
  searchParams.query = searchParams.query.trim();
  
  console.log('Search params:', JSON.stringify(searchParams, null, 2));
  
  try {
    const results = await notion.search(searchParams);
    
    // 結果を適切な形式に変換
    const formattedResults = {
      ...results,
      results: results.results.map((result: any) => {
        // ブロックタイプやフォーマットによって適切にタイトルと説明を抽出
        let title = '';
        let description = '';
        
        if (result.properties?.title) {
          // データベースアイテムの場合
          const titleProp = result.properties.title;
          if (Array.isArray(titleProp)) {
            title = titleProp.map((t: any) => t[0]).join('');
          } else if (titleProp.title) {
            title = titleProp.title.map((t: any) => t.plain_text).join('');
          }
        } else if (result.title) {
          // ページの場合
          if (Array.isArray(result.title)) {
            title = result.title.map((t: any) => t[0]).join('');
          } else {
            title = result.title;
          }
        }
        
        // 説明を取得（存在する場合）
        if (result.description) {
          description = result.description;
        }
        
        return {
          id: result.id,
          title: title || '無題',
          description,
          url: result.url,
          icon: result.icon
        };
      })
    };
    
    console.log(`Found ${formattedResults.results?.length || 0} results for query: ${searchParams.query}`);
    return formattedResults as SearchResults;
  } catch (err) {
    console.error('Search error:', err);
    return { results: [], total: 0, recordMap: { block: {} } } as SearchResults;
  }
}
