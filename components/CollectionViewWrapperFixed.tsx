import * as React from 'react'
import dynamic from 'next/dynamic'
import { useNotionContext } from 'react-notion-x'
import { getBlockCollectionId } from 'notion-utils'

// Dynamically import the Collection component
const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.Collection
  ),
  {
    ssr: false,
    loading: () => <div className="notion-collection-loading">Loading collection...</div>
  }
)

interface Props {
  block: any;
  className?: string;
  ctx?: any;
}

export const CollectionViewWrapperFixed: React.FC<Props> = ({ 
  block, 
  className,
  ctx 
}) => {
  const notionContext = useNotionContext()
  const { recordMap } = notionContext
  
  // Use provided ctx or fallback to notionContext
  const context = ctx || notionContext
  
  if (!block || !recordMap) {
    console.warn('CollectionViewWrapperFixed: Missing block or recordMap')
    return null
  }

  // Get collection ID from block - try multiple methods
  let collectionId = getBlockCollectionId(block, recordMap)
  
  // If getBlockCollectionId didn't work, try direct access
  if (!collectionId && block.collection_id) {
    collectionId = block.collection_id
  }
  
  // If still no collection ID, try from collection pointer
  if (!collectionId && block.collection_pointer?.id) {
    collectionId = block.collection_pointer.id
  }
  
  // Create a modified recordMap that includes collection data
  const modifiedRecordMap = React.useMemo(() => {
    if (!collectionId || !block.view_ids?.length) {
      return recordMap
    }
    
    // Find actual collection items first
    const collectionItems: string[] = []
    Object.entries(recordMap.block).forEach(([blockId, blockData]) => {
      const b = blockData?.value
      if (b?.parent_id === collectionId || 
          (b?.parent_table === 'collection' && b?.parent_id === collectionId)) {
        collectionItems.push(blockId)
      }
    })
    
    // If no collection_query exists or it's missing data, create it
    const existingQuery = recordMap.collection_query?.[collectionId] || {}
    const newCollectionQuery: any = {}
    
    // For each view, ensure it has proper results
    block.view_ids.forEach((viewId: string) => {
      const existing = existingQuery[viewId]
      
      // Check if results exist and are valid
      if (!existing || (existing as any).result === false || !(existing as any).result) {
        // Create a proper query result
        newCollectionQuery[viewId] = {
          result: {
            type: 'table',
            blockIds: collectionItems,
            total: collectionItems.length,
            aggregationResults: [],
            reducerResults: {
              collection_group_results: {
                type: 'results',
                blockIds: collectionItems
              }
            }
          }
        }
      } else {
        // Keep existing valid results
        newCollectionQuery[viewId] = existing
      }
    })
    
    return {
      ...recordMap,
      collection_query: {
        ...recordMap.collection_query,
        [collectionId]: newCollectionQuery
      }
    }
  }, [recordMap, collectionId, block.view_ids])
  
  // Create a modified context with the fixed recordMap
  const modifiedContext = React.useMemo(() => ({
    ...context,
    recordMap: modifiedRecordMap
  }), [context, modifiedRecordMap])

  try {
    return (
      <Collection 
        block={block} 
        className={className} 
        ctx={modifiedContext}
      />
    )
  } catch (error) {
    console.error('CollectionViewWrapperFixed: Error rendering collection', error)
    return (
      <div className="notion-collection-error">
        <p>Error loading collection view</p>
      </div>
    )
  }
}

export default CollectionViewWrapperFixed