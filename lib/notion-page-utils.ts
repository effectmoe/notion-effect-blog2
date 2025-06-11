import { type ExtendedRecordMap, type Block } from 'notion-types'

/**
 * ブロックの親ページを取得する代替実装
 * notion-utilsのgetBlockParentPageが期待通り動作しない場合の代替
 */
export function getParentPageId(
  block: Block,
  recordMap: ExtendedRecordMap
): string | null {
  if (!block || !recordMap) {
    return null
  }

  console.log('getParentPageId - Current block:', {
    id: block.id,
    type: block.type,
    parent_id: block.parent_id,
    parent_table: block.parent_table
  })

  // ブロックがページタイプで、親がある場合
  if (block.parent_id && block.parent_table === 'block') {
    const parentBlock = recordMap.block[block.parent_id]?.value
    
    console.log('getParentPageId - Parent block:', {
      parent_id: block.parent_id,
      hasParentBlock: !!parentBlock,
      parentType: parentBlock?.type
    })

    // 親ブロックがページタイプの場合
    if (parentBlock?.type === 'page') {
      return block.parent_id
    }
    
    // 親ブロックがページでない場合、さらに上位を探す
    if (parentBlock) {
      return getParentPageId(parentBlock, recordMap)
    }
  }

  // コレクション（データベース）の場合
  if (block.parent_table === 'collection') {
    console.log('getParentPageId - Collection parent, looking for database page')
    
    // コレクションの親ページを探す
    const collectionId = block.parent_id
    if (collectionId) {
      // recordMapのblock内でこのコレクションを参照しているページを探す
      for (const [blockId, blockData] of Object.entries(recordMap.block)) {
        const b = blockData.value
        if (b?.type === 'collection_view' && b?.collection_id === collectionId) {
          // このcollection_viewブロックの親ページを返す
          const parentId = b.parent_id
          if (parentId && recordMap.block[parentId]?.value?.type === 'page') {
            console.log('getParentPageId - Found collection parent page:', parentId)
            return parentId
          }
        }
      }
    }
  }

  console.log('getParentPageId - No parent page found')
  return null
}