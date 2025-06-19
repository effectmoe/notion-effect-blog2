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

// キャッシュ付きAPIインスタンスを作成
const cachedNotion = new CachedNotionAPI({
  authToken: process.env.NOTION_TOKEN,
  defaultTTL: 3600 // 1時間
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
  
  // グループ化されたコレクションのcollection_queryデータを手動で生成
  if (recordMap.collection_view) {
    // FAQマスターの処理
    const faqViewId = '215b802c-b0c6-8041-84fe-c3dcce036acf'
    const faqCollectionId = '212b802c-b0c6-8014-9263-000b71bd252e'
    
    if (recordMap.collection_view[faqViewId]) {
      // FAQマスター用のcollection_queryデータを作成
      if (!recordMap.collection_query) recordMap.collection_query = {}
      if (!recordMap.collection_query[faqCollectionId]) recordMap.collection_query[faqCollectionId] = {}
      
      recordMap.collection_query[faqCollectionId][faqViewId] = {
        'results:select:ユーザー管理': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:select:API': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:select:トラブルシューティング': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:select:その他': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:uncategorized': {
          type: 'results',
          blockIds: [],
          total: 0
        }
      }
      
      // FAQマスターのアイテムを各グループに振り分け
      Object.entries(recordMap.block).forEach(([blockId, blockData]) => {
        const block = blockData?.value
        if ((block as any)?.parent_id === faqCollectionId && (block as any)?.parent_table === 'collection') {
          // oa:|プロパティ（カテゴリ）から値を取得
          const category = (block as any)?.properties?.['oa:|']
          let categoryValue = 'uncategorized'
          
          if (category && category[0] && category[0][0]) {
            categoryValue = category[0][0]
          }
          
          const groupKey = categoryValue === 'uncategorized' ? 'results:uncategorized' : `results:select:${categoryValue}`
          
          if (recordMap.collection_query[faqCollectionId][faqViewId][groupKey]) {
            recordMap.collection_query[faqCollectionId][faqViewId][groupKey].blockIds.push(blockId)
            recordMap.collection_query[faqCollectionId][faqViewId][groupKey].total++
          } else {
            // グループが存在しない場合は新規作成
            recordMap.collection_query[faqCollectionId][faqViewId][groupKey] = {
              type: 'results',
              blockIds: [blockId],
              total: 1
            }
          }
        }
      })
      
      console.log('[getPage] Generated collection_query for FAQマスター')
    }
    
    // カフェキネシコンテンツ２の処理
    const cafeViewId = '216b802c-b0c6-8175-9f84-000c46171b61'
    const cafeCollectionId = '216b802c-b0c6-81c0-a940-000b2f6a23b3'
    
    if (recordMap.collection_view[cafeViewId]) {
      // ダミーのcollection_queryデータを作成（タグベースのグループ）
      if (!recordMap.collection_query) recordMap.collection_query = {}
      if (!recordMap.collection_query[cafeCollectionId]) recordMap.collection_query[cafeCollectionId] = {}
      
      recordMap.collection_query[cafeCollectionId][cafeViewId] = {
        'results:multi_select:インストラクター': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:multi_select:ショッピング': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:multi_select:ブログ': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:multi_select:代表者': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:multi_select:会員ページ': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:multi_select:講座': {
          type: 'results',
          blockIds: [],
          total: 0
        },
        'results:uncategorized': {
          type: 'results',
          blockIds: [],
          total: 0
        }
      }
      
      // コレクション内のアイテムを各グループに振り分け
      const collection = recordMap.collection?.[cafeCollectionId]
      if (collection) {
        Object.entries(recordMap.block).forEach(([blockId, blockData]) => {
          const block = blockData?.value
          if ((block as any)?.parent_id === cafeCollectionId && (block as any)?.parent_table === 'collection') {
            // xaH>プロパティ（Tags）から値を取得
            const tags = (block as any)?.properties?.['xaH>']
            let tagValue = 'uncategorized'
            
            // Tagsプロパティの値を取得（multi_selectなので最初のタグを使用）
            if (tags && tags[0] && tags[0][0]) {
              tagValue = tags[0][0]
            }
            
            const groupKey = tagValue === 'uncategorized' ? 'results:uncategorized' : `results:multi_select:${tagValue}`
            
            if (recordMap.collection_query[cafeCollectionId][cafeViewId][groupKey]) {
              recordMap.collection_query[cafeCollectionId][cafeViewId][groupKey].blockIds.push(blockId)
              recordMap.collection_query[cafeCollectionId][cafeViewId][groupKey].total++
            } else {
              // グループが存在しない場合は新規作成
              recordMap.collection_query[cafeCollectionId][cafeViewId][groupKey] = {
                type: 'results',
                blockIds: [blockId],
                total: 1
              }
            }
          }
        })
      }
      
      console.log('[getPage] Generated collection_query for カフェキネシコンテンツ２')
    }
  }
  
  // FAQマスターの特別処理 - ハイブリッドAPIを使用
  try {
    const faqMasterBlockId = '215b802c-b0c6-804a-8858-d72d4df6f128'
    if (recordMap.block[faqMasterBlockId]) {
      console.log('[getPage] Processing FAQ Master with hybrid API')
      recordMap = await handleCollectionWithHybridAPI(faqMasterBlockId, recordMap)
    }
  } catch (error) {
    console.error('[getPage] Error processing FAQ Master with hybrid API:', error)
    // エラーが発生しても処理を継続
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
