// Map of block IDs to their collection IDs
// This is needed because some database blocks don't have collection_id in their data
export const collectionIdMapping: Record<string, string> = {
  // FAQ Master database
  '213b802c-b0c6-80e4-85d0-f62dd6704d0c': '213b802c-b0c6-8037-bbce-04b5e7bb4beb',
  
  // カフェキネシコンテンツ
  '20db802c-b0c6-80e2-93d4-fc46bf2dd823': '20db802c-b0c6-80b4-aa12-000b61277830',
  
  // Add more mappings as needed
};

export function getCollectionIdForBlock(blockId: string): string | null {
  return collectionIdMapping[blockId] || null;
}