import { getPageContentBlockIds } from 'notion-utils';
import type * as notion from 'notion-types';

// コレクションデータを安全に取得するヘルパー関数
export async function fetchCollectionDataSafely(
  recordMap: notion.ExtendedRecordMap,
  notionAPI: any,
  options: {
    concurrency?: number;
    kyOptions?: any;
  } = {}
) {
  const { concurrency = 3, kyOptions } = options;
  
  if (!recordMap?.block) return;

  const contentBlockIds = getPageContentBlockIds(recordMap);
  const collectionInstances: Array<{
    collectionId: string;
    collectionViewId: string;
  }> = [];

  // コレクションインスタンスを収集
  for (const blockId of contentBlockIds) {
    const block = recordMap.block[blockId]?.value;
    if (!block) continue;

    if (
      block.type === 'collection_view' ||
      block.type === 'collection_view_page'
    ) {
      const collectionId = block.collection_id;
      if (collectionId && block.view_ids?.length) {
        console.log(`Found collection block: ${blockId}`, {
          type: block.type,
          collectionId: collectionId,
          viewIds: block.view_ids
        });
        
        for (const collectionViewId of block.view_ids) {
          collectionInstances.push({
            collectionId,
            collectionViewId
          });
        }
      }
    }
  }
  
  console.log(`Total collection instances to fetch: ${collectionInstances.length}`);

  // 並列でコレクションデータを取得（エラーを許容）
  const results = await Promise.allSettled(
    collectionInstances.map(async ({ collectionId, collectionViewId }) => {
      try {
        const collectionView = recordMap.collection_view?.[collectionViewId]?.value;
        
        const collectionData = await notionAPI.getCollectionData(
          collectionId,
          collectionViewId,
          collectionView,
          { kyOptions }
        );

        return {
          collectionId,
          collectionViewId,
          data: collectionData
        };
      } catch (error) {
        console.warn(
          `Failed to fetch collection data for ${collectionId}/${collectionViewId}:`,
          error
        );
        return null;
      }
    })
  );

  // 結果のサマリーをログ出力
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failureCount = results.filter(r => r.status === 'rejected' || !r.value).length;
  console.log(`Collection fetch results: ${successCount} success, ${failureCount} failed`);

  // 成功したコレクションデータをrecordMapに統合
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const { collectionId, collectionViewId, data } = result.value;
      
      console.log(`Integrating collection data for ${collectionId}/${collectionViewId}`, {
        hasRecordMap: !!data?.recordMap,
        hasBlock: !!data?.recordMap?.block,
        hasCollection: !!data?.recordMap?.collection,
        hasCollectionView: !!data?.recordMap?.collection_view,
        hasReducerResults: !!data?.result?.reducerResults
      });
      
      if (data?.recordMap) {
        // ブロックデータの統合
        if (data.recordMap.block) {
          recordMap.block = {
            ...recordMap.block,
            ...data.recordMap.block
          };
        }

        // コレクションデータの統合
        if (data.recordMap.collection) {
          recordMap.collection = {
            ...recordMap.collection,
            ...data.recordMap.collection
          };
        }

        // コレクションビューの統合
        if (data.recordMap.collection_view) {
          recordMap.collection_view = {
            ...recordMap.collection_view,
            ...data.recordMap.collection_view
          };
        }

        // ユーザーデータの統合
        if (data.recordMap.notion_user) {
          recordMap.notion_user = {
            ...recordMap.notion_user,
            ...data.recordMap.notion_user
          };
        }

        // コレクションクエリ結果の統合
        if (data.result?.reducerResults) {
          if (!recordMap.collection_query) {
            recordMap.collection_query = {};
          }
          if (!recordMap.collection_query[collectionId]) {
            recordMap.collection_query[collectionId] = {};
          }
          recordMap.collection_query[collectionId][collectionViewId] = data.result.reducerResults;
        }
      }
    }
  }

  return recordMap;
}