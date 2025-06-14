import { ExtendedRecordMap } from 'notion-types';

export function patchFAQRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  // FAQマスターブロックのID
  const faqMasterBlockId = '212b802c-b0c6-80be-aa3a-e91428cbde58';
  const faqCollectionId = '212b802c-b0c6-8046-b4ee-000b2833619c';
  
  // FAQマスターブロックが存在するか確認
  const faqMasterBlock = recordMap.block[faqMasterBlockId];
  
  if (faqMasterBlock && faqMasterBlock.value && faqMasterBlock.value.type === 'collection_view') {
    console.log('Patching FAQ Master block with collection_id:', faqCollectionId);
    
    // collection_idを追加
    (faqMasterBlock.value as any).collection_id = faqCollectionId;
  }
  
  return recordMap;
}