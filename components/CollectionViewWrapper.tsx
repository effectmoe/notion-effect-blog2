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
  
  // Check if collection exists
  const collection = recordMap.collection?.[collectionId]?.value
  const collectionView = recordMap.collection_view?.[block.view_ids?.[0]]?.value
  
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
    return <Collection block={block} className={className} ctx={context} />
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