import { ExtendedRecordMap } from 'notion-types'
import { NotionAPI } from 'notion-client'

/**
 * Enhance collection views with proper group_by data
 */
export async function enhanceCollectionViews(
  recordMap: ExtendedRecordMap,
  notion: NotionAPI
): Promise<ExtendedRecordMap> {
  if (!recordMap.collection_view) return recordMap

  console.log('[enhanceCollectionViews] Processing collection views...')

  // Process each collection view
  for (const [viewId, viewData] of Object.entries(recordMap.collection_view)) {
    const view = viewData?.value
    if (!view) continue

    // Skip if already has query2 data
    if ((view as any).query2?.group_by) {
      console.log(`[enhanceCollectionViews] View ${viewId} already has group_by`)
      continue
    }

    // Check if this is a list view that might need grouping
    if (view.type === 'list' || view.type === 'table') {
      console.log(`[enhanceCollectionViews] Checking view ${viewId} of type ${view.type}`)

      // Find the collection ID for this view
      let collectionId = null
      
      // Find block that uses this view
      for (const [blockId, blockData] of Object.entries(recordMap.block)) {
        const block = blockData?.value
        if ((block as any)?.view_ids?.includes(viewId)) {
          collectionId = (block as any).collection_id || 
                        (block as any).format?.collection_pointer?.id
          
          // For FAQ Master specifically
          if (blockId === '212b802c-b0c6-80b3-b04a-fec4203ee8d7' || 
              collectionId === '212b802c-b0c6-8014-9263-000b71bd252e') {
            console.log(`[enhanceCollectionViews] Found FAQ Master, adding group_by`)
            
            // Add the group_by configuration
            if (!(view as any).query2) {
              (view as any).query2 = {}
            }
            
            // Add grouping by category (property ID from the logs)
            (view as any).query2.group_by = {
              property: 'oa:|', // Category property ID
              type: 'select',
              value: {
                type: 'select',
                value: 'category'
              }
            }
            
            console.log(`[enhanceCollectionViews] Added group_by to FAQ Master view`)
          }
          break
        }
      }
    }
  }

  return recordMap
}