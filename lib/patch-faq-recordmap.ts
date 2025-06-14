import { ExtendedRecordMap } from 'notion-types';

export function patchFAQRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  // FAQマスターブロックのID
  const faqMasterBlockId = '212b802c-b0c6-80be-aa3a-e91428cbde58';
  const faqCollectionId = '212b802c-b0c6-8046-b4ee-000b2833619c';
  
  // FAQマスターブロックが存在するか確認
  const faqMasterBlock = recordMap.block[faqMasterBlockId];
  
  if (faqMasterBlock && faqMasterBlock.value && faqMasterBlock.value.type === 'collection_view') {
    console.log('Patching FAQ Master block with collection_id:', faqCollectionId);
    
    // collection_idを追加（元のtypeとview_idsは維持）
    (faqMasterBlock.value as any).collection_id = faqCollectionId;
    
    // formatを追加（元のビュー設定を維持）
    const viewId = faqMasterBlock.value.view_ids?.[0];
    if (viewId) {
      const view = recordMap.collection_view?.[viewId]?.value;
      if (view && !faqMasterBlock.value.format) {
        (faqMasterBlock.value as any).format = view.format || {
          collection_pointer: {
            id: faqCollectionId,
            table: "collection",
            spaceId: "d1457284-c418-4f36-a7d3-658181f0a8f5"
          }
        };
      }
    }
  }
  
  return recordMap;
}