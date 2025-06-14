import { ExtendedRecordMap } from 'notion-types';

export function patchFAQRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  // FAQマスターブロックのID
  const faqMasterBlockId = '212b802c-b0c6-80be-aa3a-e91428cbde58';
  const faqCollectionId = '212b802c-b0c6-8046-b4ee-000b2833619c';
  
  // FAQマスターブロックが存在するか確認
  const faqMasterBlock = recordMap.block[faqMasterBlockId];
  
  if (faqMasterBlock && faqMasterBlock.value && faqMasterBlock.value.type === 'collection_view') {
    // ビューからcollection IDを取得
    const viewId = faqMasterBlock.value.view_ids?.[0];
    if (viewId) {
      const view = recordMap.collection_view?.[viewId]?.value;
      const collectionId = view?.format?.collection_pointer?.id || faqCollectionId;
      
      if (collectionId && !faqMasterBlock.value.collection_id) {
        console.log('Patching FAQ Master block with collection_id:', collectionId);
        
        // collection_idとformatを追加
        (faqMasterBlock.value as any).collection_id = collectionId;
        (faqMasterBlock.value as any).format = {
          collection_pointer: {
            id: collectionId,
            table: "collection",
            spaceId: view.format?.collection_pointer?.spaceId || "d1457284-c418-4f36-a7d3-658181f0a8f5"
          }
        };
        
        // コレクションデータが存在するか確認
        if (!recordMap.collection || !recordMap.collection[collectionId]) {
          console.log('FAQ collection data is missing in recordMap. Collection ID:', collectionId);
          console.log('Available collections:', Object.keys(recordMap.collection || {}));
        } else {
          console.log('FAQ collection data found in recordMap');
        }
        
        // collection_queryデータも確認
        if (!recordMap.collection_query || !recordMap.collection_query[collectionId]) {
          console.log('FAQ collection_query data is missing');
        }
      }
    }
  }
  
  return recordMap;
}