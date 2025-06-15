import { ExtendedRecordMap } from 'notion-types'

// IDs of test databases/collections that should be hidden
const TEST_COLLECTION_IDS = [
  '212b802c-b0c6-8014-9263-000b71bd252e', // テスト collection ID
]

const TEST_BLOCK_IDS = [
  '212b802c-b0c6-80b3-b04a-fec4203ee8d7', // テスト block ID
]

/**
 * Filter out test collections and blocks from the recordMap
 * This prevents test databases from being displayed on the page
 */
export function filterTestCollections(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  if (!recordMap) return recordMap

  const filteredRecordMap = { ...recordMap }

  // Remove test collections
  if (filteredRecordMap.collection) {
    const filteredCollections = { ...filteredRecordMap.collection }
    TEST_COLLECTION_IDS.forEach(id => {
      if (filteredCollections[id]) {
        console.log(`Filtering out test collection: ${id}`)
        delete filteredCollections[id]
      }
    })
    filteredRecordMap.collection = filteredCollections
  }

  // Remove test blocks (collection_view blocks)
  if (filteredRecordMap.block) {
    const filteredBlocks = { ...filteredRecordMap.block }
    TEST_BLOCK_IDS.forEach(id => {
      if (filteredBlocks[id]) {
        console.log(`Filtering out test block: ${id}`)
        delete filteredBlocks[id]
      }
    })

    // Also check for blocks that reference test collections
    Object.entries(filteredBlocks).forEach(([blockId, blockData]) => {
      const block = blockData?.value
      if (block && (block.type === 'collection_view' || block.type === 'collection_view_page')) {
        // Check if this block references a test collection
        if (block.collection_id && TEST_COLLECTION_IDS.includes(block.collection_id)) {
          console.log(`Filtering out block ${blockId} that references test collection ${block.collection_id}`)
          delete filteredBlocks[blockId]
        }
      }
    })

    filteredRecordMap.block = filteredBlocks
  }

  // Remove test collection views
  if (filteredRecordMap.collection_view) {
    const filteredViews = { ...filteredRecordMap.collection_view }
    Object.entries(filteredViews).forEach(([viewId, viewData]) => {
      const view = viewData?.value
      if (view && view.parent_id && TEST_BLOCK_IDS.includes(view.parent_id)) {
        console.log(`Filtering out collection view ${viewId} with test parent`)
        delete filteredViews[viewId]
      }
    })
    filteredRecordMap.collection_view = filteredViews
  }

  return filteredRecordMap
}

/**
 * Check if a block should be hidden (is a test block)
 */
export function isTestBlock(blockId: string): boolean {
  return TEST_BLOCK_IDS.includes(blockId)
}

/**
 * Check if a collection should be hidden (is a test collection)
 */
export function isTestCollection(collectionId: string): boolean {
  return TEST_COLLECTION_IDS.includes(collectionId)
}