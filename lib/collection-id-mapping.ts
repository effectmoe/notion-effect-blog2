// Map of block IDs to their collection IDs
// This is needed because some database blocks don't have collection_id in their data
export const collectionIdMapping: Record<string, string> = {
  // FAQ Master database
  '213b802c-b0c6-80e4-85d0-f62dd6704d0c': '213b802c-b0c6-8037-bbce-04b5e7bb4beb',
  
  // カフェキネシコンテンツ (Working - has collection_id in data)
  '20db802c-b0c6-80e2-93d4-fc46bf2dd823': '20db802c-b0c6-80b4-aa12-000b61277830',
  
  // テスト database (Not working - missing collection_id)
  '212b802c-b0c6-80b3-b04a-fec4203ee8d7': '212b802c-b0c6-8014-9263-000b71bd252e',
  
  // カフェキネシコンテンツ (Not working - missing collection_id)
  '1ceb802c-b0c6-814a-b43e-ddb38e80f2e0': '1ceb802c-b0c6-81e8-a45e-000ba000bfe2',
  
  // FAQマスター database
  '212b802c-b0c6-80ea-b7ed-ef4459f38819': '212b802c-b0c6-8046-b4ee-000b2833619c',
  
  // FAQマスター (1) database
  '212b802c-b0c6-805a-b873-d9b44705e49b': '212b802c-b0c6-813f-913b-000b02bbab01',
  
  // Add more mappings as needed
};

export function getCollectionIdForBlock(blockId: string): string | null {
  return collectionIdMapping[blockId] || null;
}