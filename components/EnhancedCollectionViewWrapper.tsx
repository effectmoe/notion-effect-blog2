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

export const EnhancedCollectionViewWrapper: React.FC<{ block: any; className?: string; ctx?: any }> = ({ 
  block, 
  className,
  ctx 
}) => {
  const notionContext = useNotionContext()
  const { recordMap } = notionContext
  
  // Use provided ctx or fallback to notionContext
  const context = ctx || notionContext
  
  if (!block || !recordMap) {
    console.warn('EnhancedCollectionViewWrapper: Missing block or recordMap')
    return null
  }

  // Enhanced collection ID retrieval that handles linked databases
  let collectionId = null
  let collectionPointer = null
  
  // Method 1: Direct collection_id on block (regular databases)
  if (block.collection_id) {
    collectionId = block.collection_id
    console.log(`Found direct collection_id: ${collectionId}`)
  }
  
  // Method 2: Collection pointer in block format (some regular databases)
  if (!collectionId && block.format?.collection_pointer?.id) {
    collectionId = block.format.collection_pointer.id
    collectionPointer = block.format.collection_pointer
    console.log(`Found collection_id in block format.collection_pointer: ${collectionId}`)
  }
  
  // Method 3: Collection pointer in view format (linked databases)
  if (!collectionId && block.view_ids?.length > 0) {
    // Check each view for a collection pointer
    for (const viewId of block.view_ids) {
      const view = recordMap.collection_view?.[viewId]?.value
      if (view?.format?.collection_pointer?.id) {
        collectionId = view.format.collection_pointer.id
        collectionPointer = view.format.collection_pointer
        console.log(`Found collection_id in view ${viewId} format.collection_pointer: ${collectionId}`)
        break // Use the first view with a collection pointer
      }
    }
  }
  
  // Use notion-utils as fallback (it implements similar logic)
  if (!collectionId) {
    collectionId = getBlockCollectionId(block, recordMap)
    console.log(`Using notion-utils getBlockCollectionId: ${collectionId}`)
  }
  
  // Debug logging
  console.log('EnhancedCollectionViewWrapper: Processing block', {
    blockId: block.id,
    blockType: block.type,
    viewIds: block.view_ids,
    hasDirectCollectionId: !!block.collection_id,
    hasBlockFormatPointer: !!block.format?.collection_pointer,
    resolvedCollectionId: collectionId,
    isLinkedDatabase: !block.collection_id && !!collectionPointer
  })
  
  // Check if collection exists
  const collection = recordMap.collection?.[collectionId]?.value
  const collectionView = recordMap.collection_view?.[block.view_ids?.[0]]?.value
  
  // Validate collection data
  if (!collectionId || !collection) {
    console.warn(`EnhancedCollectionViewWrapper: Missing collection data for block ${block.id}`, {
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

  // Success - we have a collection
  console.log(`EnhancedCollectionViewWrapper: Successfully resolved collection`, {
    blockId: block.id,
    collectionId,
    collectionName: collection.name?.[0]?.[0],
    isLinkedDatabase: !block.collection_id && !!collectionPointer
  })

  try {
    // For linked databases, we might need to pass additional context
    // to ensure the Collection component uses the correct collection_id
    const enhancedBlock = {
      ...block,
      // Ensure collection_id is set for the Collection component
      collection_id: collectionId
    }
    
    return <Collection block={enhancedBlock} className={className} ctx={context} />
  } catch (error) {
    console.error('EnhancedCollectionViewWrapper: Error rendering collection', error)
    return (
      <div className="notion-collection-error">
        <p>Error loading collection view</p>
      </div>
    )
  }
}

export default EnhancedCollectionViewWrapper