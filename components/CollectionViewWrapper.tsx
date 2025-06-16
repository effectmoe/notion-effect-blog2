import * as React from 'react'
import dynamic from 'next/dynamic'
import { useNotionContext } from 'react-notion-x'
import { getBlockCollectionId } from 'notion-utils'
import { getCollectionIdForBlock } from '@/lib/collection-id-mapping'
import { prioritizeListView } from '@/lib/collection-view-utils'

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

export const CollectionViewWrapper: React.FC<{ block: any; className?: string; ctx?: any }> = ({ 
  block, 
  className,
  ctx 
}) => {
  const notionContext = useNotionContext()
  const { recordMap } = notionContext
  
  // Use provided ctx or fallback to notionContext
  const context = ctx || notionContext
  
  if (!block || !recordMap) {
    console.warn('CollectionViewWrapper: Missing block or recordMap')
    return null
  }

  // Debug: Log block structure
  console.log('CollectionViewWrapper: Processing block', {
    blockId: block.id,
    blockType: block.type,
    viewIds: block.view_ids,
    collectionId: block.collection_id,
    recordMapKeys: Object.keys(recordMap)
  })

  // Get collection ID from block - try multiple methods
  let collectionId = getBlockCollectionId(block, recordMap)
  
  // If getBlockCollectionId didn't work, try direct access
  if (!collectionId && block.collection_id) {
    collectionId = block.collection_id
  }
  
  // NEW: Use our hardcoded mapping as a fallback
  if (!collectionId) {
    const mappedId = getCollectionIdForBlock(block.id)
    if (mappedId) {
      collectionId = mappedId
      console.log(`CollectionViewWrapper: Found collection ID ${collectionId} from mapping for block ${block.id}`)
    } else {
      // Also try with parent_id for linked databases
      const parentMappedId = block.parent_id ? getCollectionIdForBlock(block.parent_id) : null
      if (parentMappedId) {
        collectionId = parentMappedId
        console.log(`CollectionViewWrapper: Found collection ID ${collectionId} from parent mapping for block ${block.id}`)
      }
    }
  }
  
  // If still no collection ID, try to find it by matching the parent block ID
  // This handles cases where the collection_view block doesn't have collection_id property
  if (!collectionId) {
    console.log('CollectionViewWrapper: Attempting to find collection by parent block ID')
    
    // Search through all collections to find one whose parent matches this block's parent
    const collections = Object.entries(recordMap.collection || {})
    for (const [id, collectionData] of collections) {
      const collection = collectionData.value
      // Check if any block in recordMap has this collection as parent_id and matches our block
      const blocksWithThisCollection = Object.values(recordMap.block || {})
        .filter(b => b.value?.parent_id === id && b.value?.parent_table === 'collection')
      
      if (blocksWithThisCollection.length > 0) {
        console.log(`Found potential collection ${id} with name: ${collection?.name?.[0]?.[0]}`)
      }
    }
    
    // Alternative approach: If block has a parent, check if parent has collection info
    if (block.parent_id) {
      const parentBlock = recordMap.block[block.parent_id]?.value
      if (parentBlock) {
        console.log('Parent block info:', {
          parentId: parentBlock.id,
          parentType: parentBlock.type,
          parentCollectionId: parentBlock.collection_id
        })
      }
    }
  }
  
  // NEW: Create a modified block with collection_id if we found one but block doesn't have it
  let modifiedBlock = block
  if (!block.collection_id && collectionId) {
    modifiedBlock = {
      ...block,
      collection_id: collectionId,
      format: {
        ...block.format,
        collection_pointer: {
          id: collectionId,
          table: 'collection',
          spaceId: block.space_id
        }
      }
    }
    console.log('CollectionViewWrapper: Created modified block with collection_id', collectionId)
  }
  
  // Find the best view ID (prefer list views)
  let bestViewId = block.view_ids?.[0]
  if (block.view_ids && recordMap.collection_view) {
    const views = block.view_ids.map((id: string) => ({
      id,
      value: recordMap.collection_view[id]?.value
    })).filter((v: any) => v.value)
    
    const prioritizedViews = prioritizeListView(views)
    if (prioritizedViews.length > 0 && prioritizedViews[0].id !== block.view_ids[0]) {
      bestViewId = prioritizedViews[0].id
      modifiedBlock = {
        ...modifiedBlock,
        view_ids: [bestViewId, ...(block.view_ids || []).filter((id: string) => id !== bestViewId)]
      }
      console.log(`CollectionViewWrapper: Reordered views to prioritize ${bestViewId} (${prioritizedViews[0].value?.type} view)`)
    }
  }
  
  // Check if collection exists
  const collection = recordMap.collection?.[collectionId]?.value
  const collectionView = recordMap.collection_view?.[bestViewId || block.view_ids?.[0]]?.value
  
  // Validate collection data
  if (!collectionId || !collection) {
    console.warn(`CollectionViewWrapper: Missing collection data for block ${block.id}`, {
      blockId: block.id,
      collectionId,
      hasCollection: !!collection,
      hasCollectionView: !!collectionView,
      availableCollections: Object.keys(recordMap.collection || {}),
      availableViews: Object.keys(recordMap.collection_view || {})
    })
    
    // Return a placeholder or null
    return (
      <div className="notion-collection-placeholder">
        <p>Collection view is not available</p>
      </div>
    )
  }

  // If collection view is missing but collection exists, try to render anyway
  if (!collectionView && collection) {
    console.warn(`CollectionViewWrapper: Collection view missing for block ${block.id}, attempting to render with default view`)
  }

  try {
    return <Collection block={modifiedBlock} className={className} ctx={context} />
  } catch (error) {
    console.error('CollectionViewWrapper: Error rendering collection', error)
    return (
      <div className="notion-collection-error">
        <p>Error loading collection view</p>
      </div>
    )
  }
}

export default CollectionViewWrapper