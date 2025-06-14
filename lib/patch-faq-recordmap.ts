import { ExtendedRecordMap } from 'notion-types';

export function patchFAQRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  // FAQマスターブロックのID（リンクドビュー）
  const faqMasterBlockId = '212b802c-b0c6-80be-aa3a-e91428cbde58';
  // オリジナルFAQデータベースのブロックID
  const faqOriginalBlockId = '212b802c-b0c6-80ea-b7ed-ef4459f38819';
  const faqCollectionId = '212b802c-b0c6-8046-b4ee-000b2833619c';
  
  // FAQマスターブロックをオリジナルデータベースに置き換える
  const faqMasterBlock = recordMap.block[faqMasterBlockId];
  
  if (faqMasterBlock && faqMasterBlock.value) {
    console.log('Replacing FAQ Master linked view with original database');
    
    // オリジナルデータベースのタイプに変更
    (faqMasterBlock.value as any).type = 'collection_view_page';
    (faqMasterBlock.value as any).collection_id = faqCollectionId;
    
    // formatを追加
    (faqMasterBlock.value as any).format = {
      page_icon: '❓',
      collection_pointer: {
        id: faqCollectionId,
        table: "collection",
        spaceId: "d1457284-c418-4f36-a7d3-658181f0a8f5"
      }
    };
    
    // プロパティも追加
    if (!faqMasterBlock.value.properties) {
      (faqMasterBlock.value as any).properties = {
        title: [['FAQマスター']]
      };
    }
  }
  
  return recordMap;
}