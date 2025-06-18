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
import { findMissingBlocks } from './fetch-missing-blocks'
import { CachedNotionAPI } from './cache'
import { enhanceCollectionViews } from './notion-enhanced-fetch'
import { handleCollectionWithHybridAPI } from './hybrid-collection-handler'
import { generateGroupedHTML, injectGroupedHTML } from './server-side-group-renderer'

// キャッシュ付きAPIインスタンスを作成
const cachedNotion = new CachedNotionAPI({
  authToken: process.env.NOTION_TOKEN,
  defaultTTL: 1800 // 30分に統一
})

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

// Export function to clear navigation cache
export function clearNavigationCache() {
  console.log('[Navigation] Navigation cache clear requested')
  // p-memoizeのキャッシュは直接クリアできないため、
  // キャッシュが期限切れになるか、アプリケーションが再起動されるまで待つ必要がある
}

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  // キャッシュ付きAPIを使用（本番環境のみ）
  const api = process.env.NODE_ENV === 'production' ? cachedNotion : notion;
  
  try {
    let recordMap: ExtendedRecordMap = await api.getPage(pageId, {
      fetchMissingBlocks: true,
      fetchCollections: true,
      signFileUrls: false,
      chunkLimit: 500,  // Increase chunk limit
      chunkNumber: 0
    }) as ExtendedRecordMap
    
    // ページが空の場合のチェック
    if (!recordMap || !recordMap.block || Object.keys(recordMap.block).length === 0) {
      console.error(`[getPage] Empty or invalid page data for pageId: ${pageId}`);
      const error = new Error(`Page ${pageId} returned empty data`);
      (error as any).status = 404;
      (error as any).code = 'empty_page';
      throw error;
    }
  
  // Use the new helper function to find missing blocks
  const { missingBlocks, missingCollections, toggleContentBlocks } = findMissingBlocks(recordMap)
  
  console.log('Block analysis:', {
    totalBlocks: Object.keys(recordMap.block || {}).length,
    toggleContentBlocks: toggleContentBlocks.length,
    missingBlocks: missingBlocks.length,
    missingCollections: missingCollections.length
  })
  
  // If we have missing blocks, try to fetch them
  if (missingBlocks.length > 0) {
    console.log(`Attempting to fetch ${missingBlocks.length} missing blocks...`)
    
    try {
      // Fetch all missing blocks in parallel with concurrency limit
      const missingBlockData = await pMap(
        missingBlocks,
        async (blockId) => {
          try {
            const blockData = await notion.getPage(blockId, {
              fetchMissingBlocks: true,
              fetchCollections: true,
              signFileUrls: false
            })
            return blockData
          } catch (error) {
            console.error(`Failed to fetch block ${blockId}:`, error)
            return null
          }
        },
        { concurrency: 3 }
      )
      
      // Merge all fetched data
      missingBlockData.forEach(blockData => {
        if (blockData) {
          recordMap = mergeRecordMaps(recordMap, blockData)
        }
      })
      
      // Re-analyze after fetching
      const afterFetch = findMissingBlocks(recordMap)
      console.log('After fetching missing blocks:', {
        remainingMissing: afterFetch.missingBlocks.length,
        remainingMissingCollections: afterFetch.missingCollections.length
      })
    } catch (error) {
      console.error('Error fetching missing blocks:', error)
    }
  }

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

  // Enhance collection views with group_by data for FAQ Master
  recordMap = await enhanceCollectionViews(recordMap, notion)
  
  // サーバーサイドでグループ化HTMLを生成
  const groupedDatabases = [
    {
      blockId: '212b802c-b0c6-80b3-b04a-fec4203ee8d7',
      collectionId: '212b802c-b0c6-8014-9263-000b71bd252e',
      name: 'FAQマスター'
    },
    // カフェキネシコンテンツ
    {
      blockId: '216b802c-b0c6-808f-ac1d-dbf03d973fec',
      collectionId: '216b802c-b0c6-81c0-a940-000b2f6a23b3',
      name: 'カフェキネシコンテンツ'
    }
  ]
  
  // collection_queryデータを確保
  for (const db of groupedDatabases) {
    if (recordMap.block[db.blockId]) {
      // collection_queryが存在しない場合は作成
      if (!recordMap.collection_query) {
        recordMap.collection_query = {}
      }
      if (!recordMap.collection_query[db.collectionId]) {
        recordMap.collection_query[db.collectionId] = {}
      }
      
      // デフォルトのクエリ結果を追加
      const block = recordMap.block[db.blockId].value as any
      if (block.view_ids) {
        for (const viewId of block.view_ids) {
          if (!recordMap.collection_query[db.collectionId][viewId]) {
            // 基本的なクエリ結果を作成
            const items = []
            Object.entries(recordMap.block).forEach(([itemId, itemData]) => {
              const itemBlock = itemData?.value
              if (itemBlock?.parent_id === db.collectionId) {
                items.push(itemId)
              }
            })
            
            recordMap.collection_query[db.collectionId][viewId] = {
              type: 'results',
              blockIds: items,
              aggregations: [],
              total: items.length
            } as any
          }
        }
      }
      
      console.log(`[ServerSideRender] Processing ${db.name}`)
      const html = generateGroupedHTML(db.collectionId, recordMap)
      if (html) {
        recordMap = injectGroupedHTML(recordMap, db.blockId, html)
      }
    }
  }

  return recordMap
  } catch (error: any) {
    console.error(`[getPage] Error fetching page ${pageId}:`, {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name
    });
    
    // エラーに追加情報を付与
    if (!error.status) {
      error.status = error.message?.includes('not found') ? 404 : 500;
    }
    if (!error.code) {
      error.code = error.message?.includes('not found') ? 'page_not_found' : 'unknown_error';
    }
    
    throw error;
  }
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
