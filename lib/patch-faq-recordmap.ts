import { ExtendedRecordMap } from 'notion-types';

export function patchFAQRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  // 以前のコードで参照されていた存在しないブロックID
  const oldFaqMasterBlockId = '212b802c-b0c6-80be-aa3a-e91428cbde58';
  const faqCollectionId = '212b802c-b0c6-8046-b4ee-000b2833619c';
  
  // 実際のFAQマスターブロックID
  const actualFaqMasterBlockId = '212b802c-b0c6-80ea-b7ed-ef4459f38819';
  
  // 古いブロックIDへの参照がある場合のための互換性パッチ
  const oldFaqMasterBlock = recordMap.block[oldFaqMasterBlockId];
  if (oldFaqMasterBlock && oldFaqMasterBlock.value && oldFaqMasterBlock.value.type === 'collection_view') {
    console.log('Patching old FAQ Master block reference with collection_id:', faqCollectionId);
    
    // collection_idを追加
    (oldFaqMasterBlock.value as any).collection_id = faqCollectionId;
    
    // format.collection_pointerも追加
    if (!oldFaqMasterBlock.value.format) {
      (oldFaqMasterBlock.value as any).format = {};
    }
    (oldFaqMasterBlock.value.format as any).collection_pointer = {
      id: faqCollectionId,
      table: 'collection',
      spaceId: oldFaqMasterBlock.value.space_id || 'd1457284-c418-4f36-a7d3-658181f0a8f5'
    };
  }
  
  // 実際のFAQブロックのビューフィルターをチェック
  const actualFaqBlock = recordMap.block[actualFaqMasterBlockId];
  if (actualFaqBlock && actualFaqBlock.value && actualFaqBlock.value.type === 'collection_view') {
    // ビューIDを取得して、フィルターを確認
    const viewIds = actualFaqBlock.value.view_ids || [];
    viewIds.forEach(viewId => {
      const view = recordMap.collection_view?.[viewId];
      if (view?.value?.format?.filter) {
        console.log(`Checking filter for FAQ view ${viewId}:`, view.value.name);
        // 必要に応じてフィルターを調整
      }
    });
  }
  
  // FAQコレクションのクエリ結果が空の場合の対処
  if (recordMap.collection_query?.[faqCollectionId]) {
    const query = recordMap.collection_query[faqCollectionId];
    if (!query.collection_group_results?.blockIds?.length) {
      console.log('FAQ collection query has no results - may need to fetch collection data');
    }
  }
  
  return recordMap;
}