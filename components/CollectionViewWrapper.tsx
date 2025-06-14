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
    ssr: true, // Enable SSR for Collection component
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
  
  // Log on client and server
  if (typeof window !== 'undefined') {
    console.log('[CLIENT] CollectionViewWrapper called with block:', block?.id)
  } else {
    console.log('[SERVER] CollectionViewWrapper called with block:', block?.id)
  }
  
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
  
  // Special debug for FAQ Master
  if (block.id === '212b802c-b0c6-80be-aa3a-e91428cbde58' || block.collection_id === '212b802c-b0c6-8046-b4ee-000b2833619c') {
    console.log('🎯 FAQ Master block detected!', {
      blockId: block.id,
      collectionId: block.collection_id,
      viewIds: block.view_ids,
      hasRecordMap: !!recordMap,
      hasCollection: !!recordMap.collection,
      hasCollectionView: !!recordMap.collection_view
    })
    
    // Add a visible marker in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const elem = document.getElementById(`notion-block-${block.id}`)
        if (elem) {
          elem.style.border = '3px solid red'
          elem.setAttribute('data-faq-master', 'true')
        }
      }, 1000)
    }
  }

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
    console.log(`Rendering Collection component for block ${block.id}`)
    
    // Special marker for FAQ Master in development
    if (block.id === '212b802c-b0c6-80be-aa3a-e91428cbde58') {
      return (
        <>
          <div style={{ background: 'yellow', padding: '10px', margin: '10px 0' }}>
            🎯 FAQ Master Collection View (ID: {block.id})
          </div>
          <Collection block={block} className={className} ctx={context} />
        </>
      )
    }
    
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