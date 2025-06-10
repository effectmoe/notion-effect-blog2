import { ExtendedRecordMap } from 'notion-types'
import { getBlockCollectionId } from 'notion-utils'

/**
 * Recursively finds all blocks that need additional data fetching
 */
export function findMissingBlocks(recordMap: ExtendedRecordMap): {
  missingBlocks: string[]
  missingCollections: string[]
  toggleContentBlocks: string[]
} {
  const missingBlocks: string[] = []
  const missingCollections: string[] = []
  const toggleContentBlocks: string[] = []
  
  if (!recordMap?.block) {
    return { missingBlocks, missingCollections, toggleContentBlocks }
  }
  
  // Recursively check blocks
  function checkBlock(blockId: string, depth = 0) {
    const block = recordMap.block[blockId]?.value
    if (!block) return
    
    // Log block for debugging
    if (block.type === 'toggle' || block.type === 'collection_view') {
      const logData: any = {
        id: block.id,
        type: block.type,
        hasContent: !!(block.content && block.content.length > 0),
        contentLength: block.content?.length || 0
      }
      
      // Add collection-specific properties only for collection_view blocks
      if (block.type === 'collection_view') {
        logData.viewIds = (block as any).view_ids
        logData.collectionId = (block as any).collection_id
      }
      
      console.log(`[Depth ${depth}] Found ${block.type} block:`, logData)
    }
    
    // Check toggle blocks
    if (block.type === 'toggle' && block.content?.length > 0) {
      block.content.forEach((contentId: string) => {
        toggleContentBlocks.push(contentId)
        
        // Check if the content block exists
        if (!recordMap.block[contentId]) {
          missingBlocks.push(contentId)
          console.warn(`Missing toggle content block: ${contentId}`)
        } else {
          // Recursively check the content block
          checkBlock(contentId, depth + 1)
        }
      })
    }
    
    // Check collection view blocks
    if (block.type === 'collection_view' || block.type === 'collection_view_page') {
      const collectionId = getBlockCollectionId(block, recordMap) || (block as any).collection_id
      
      if (collectionId && !recordMap.collection?.[collectionId]) {
        missingCollections.push(collectionId)
        console.warn(`Missing collection: ${collectionId} for block ${block.id}`)
      }
      
      // Check view IDs
      const viewIds = (block as any).view_ids
      if (viewIds?.length > 0) {
        viewIds.forEach((viewId: string) => {
          if (!recordMap.collection_view?.[viewId]) {
            console.warn(`Missing collection view: ${viewId} for block ${block.id}`)
          }
        })
      }
    }
    
    // Recursively check child blocks
    if (block.content?.length > 0) {
      block.content.forEach((childId: string) => {
        if (recordMap.block[childId]) {
          checkBlock(childId, depth + 1)
        }
      })
    }
  }
  
  // Start checking from all top-level blocks
  Object.keys(recordMap.block).forEach(blockId => {
    checkBlock(blockId, 0)
  })
  
  return { missingBlocks, missingCollections, toggleContentBlocks }
}