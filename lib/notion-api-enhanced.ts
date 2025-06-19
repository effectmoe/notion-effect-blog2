import { NotionAPI } from 'notion-client'
import { ExtendedRecordMap } from 'notion-types'

export class EnhancedNotionAPI extends NotionAPI {
  constructor(options?: any) {
    super(options)
  }

  async getPageWithGroupedViews(pageId: string): Promise<ExtendedRecordMap> {
    // First get the standard page data
    const recordMap = await this.getPage(pageId)
    
    // Process all collection views to ensure group_by data is included
    if (recordMap.collection_view) {
      for (const [viewId, viewData] of Object.entries(recordMap.collection_view)) {
        const view = viewData.value
        
        // Skip if no view data
        if (!view) continue
        
        // For list views, ensure we have complete query data
        if (view.type === 'list' || view.type === 'table') {
          console.log(`Processing view ${viewId} of type ${view.type}`)
          
          // If this view should have grouping but doesn't have query2 data,
          // we need to fetch additional data
          if (!view.query2 && (view.format as any)?.list_properties_v2) {
            console.log(`View ${viewId} might need group data`)
            
            // Try to get the collection ID
            let collectionId = null
            
            // Find the collection ID from blocks that use this view
            for (const [blockId, blockData] of Object.entries(recordMap.block)) {
              const block = blockData.value
              if ((block as any)?.view_ids?.includes(viewId)) {
                collectionId = (block as any)?.collection_id || 
                              (block as any)?.format?.collection_pointer?.id
                break
              }
            }
            
            if (collectionId) {
              try {
                // Fetch collection query data
                const collectionData = await this.getCollectionData(
                  collectionId,
                  viewId,
                  { loadContentCover: true }
                )
                
                // Merge the query data back into the view
                if (collectionData?.recordMap?.collection_view?.[viewId]) {
                  const enhancedView = collectionData.recordMap.collection_view[viewId].value
                  if (enhancedView?.query2) {
                    view.query2 = enhancedView.query2
                    console.log(`Added query2 data to view ${viewId}`)
                  }
                }
                
                // IMPORTANT: Also merge collection_query data
                if (collectionData?.result?.reducerResults) {
                  if (!recordMap.collection_query) {
                    recordMap.collection_query = {}
                  }
                  if (!recordMap.collection_query[collectionId]) {
                    recordMap.collection_query[collectionId] = {}
                  }
                  recordMap.collection_query[collectionId][viewId] = collectionData.result.reducerResults
                  console.log(`Added collection_query data for ${collectionId}/${viewId}`)
                }
              } catch (error) {
                console.error(`Failed to fetch collection data for ${viewId}:`, error)
              }
            }
          }
        }
      }
    }
    
    return recordMap
  }

  // Helper method to check if a database should be rendered with groups
  isGroupedView(view: any): boolean {
    return !!(
      view?.query2?.group_by || 
      (view?.format as any)?.list_properties_v2?.some?.((prop: any) => prop?.property === 'group')
    )
  }
}