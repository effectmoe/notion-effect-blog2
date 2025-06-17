import * as React from 'react'
import dynamic from 'next/dynamic'
import { useNotionContext } from 'react-notion-x'
import { getBlockCollectionId } from 'notion-utils'
import { CollectionFallback } from './CollectionFallback'

// Dynamically import the original Collection component
const OriginalCollection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.Collection
  ),
  {
    ssr: false,
    loading: () => <div className="notion-collection-loading">Loading...</div>
  }
)

interface Props {
  block: any;
  className?: string;
  ctx?: any;
}

export const CollectionWithFallback: React.FC<Props> = ({ 
  block, 
  className,
  ctx 
}) => {
  const notionContext = useNotionContext()
  const { recordMap } = notionContext
  const [hasError, setHasError] = React.useState(false)
  
  // Use provided ctx or fallback to notionContext
  const context = ctx || notionContext
  
  // Reset error state when block changes
  React.useEffect(() => {
    setHasError(false)
  }, [block?.id])
  
  if (!block || !recordMap) {
    console.warn('CollectionWithFallback: Missing block or recordMap')
    return <CollectionFallback block={block} className={className} />
  }

  // Get collection ID
  const collectionId = getBlockCollectionId(block, recordMap) || 
                      block?.collection_id || 
                      block?.collection_pointer?.id
  
  // Check if this is a problematic collection
  const hasCollectionData = collectionId && recordMap.collection?.[collectionId]
  const hasCollectionQuery = collectionId && recordMap.collection_query?.[collectionId]
  
  console.log('CollectionWithFallback check:', {
    blockId: block.id,
    collectionId,
    hasCollectionData,
    hasCollectionQuery,
    viewIds: block.view_ids
  })
  
  // If we already know there's an error or missing data, use fallback
  if (hasError || (!hasCollectionData && !hasCollectionQuery)) {
    console.warn('CollectionWithFallback: Using fallback due to missing data')
    return <CollectionFallback block={block} className={className} />
  }
  
  // Error boundary for Collection component
  const CollectionErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        if (event.message.includes('collection') || 
            event.message.includes('spaceId') ||
            event.message.includes('Cannot read properties of undefined')) {
          console.error('Collection rendering error caught:', event.message)
          setHasError(true)
          event.preventDefault()
        }
      }
      
      window.addEventListener('error', handleError)
      return () => window.removeEventListener('error', handleError)
    }, [])
    
    return <>{children}</>
  }
  
  return (
    <CollectionErrorBoundary>
      <div className="collection-with-fallback-wrapper">
        {!hasError ? (
          <OriginalCollection 
            block={block} 
            className={className} 
            ctx={context}
          />
        ) : (
          <CollectionFallback block={block} className={className} />
        )}
      </div>
    </CollectionErrorBoundary>
  )
}

export default CollectionWithFallback