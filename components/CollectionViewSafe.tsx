import * as React from 'react'
import dynamic from 'next/dynamic'
import { useNotionContext } from 'react-notion-x'

// Original Collection component
const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.Collection
  ),
  {
    ssr: false,
    loading: () => null
  }
)

interface Props {
  block: any;
  className?: string;
  ctx?: any;
}

export const CollectionViewSafe: React.FC<Props> = ({ 
  block, 
  className,
  ctx 
}) => {
  const context = ctx || useNotionContext()
  const [showError, setShowError] = React.useState(false)
  
  // Handle errors gracefully
  React.useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      const message = e.message?.toLowerCase() || ''
      if (message.includes('collection') || message.includes('cannot read')) {
        console.warn('Collection error suppressed:', e.message)
        e.preventDefault()
        e.stopPropagation()
        // Don't set error state - just suppress the error
      }
    }
    
    window.addEventListener('error', handleError, true)
    return () => window.removeEventListener('error', handleError, true)
  }, [])
  
  if (!block || showError) {
    return null
  }
  
  // Render the original Collection component
  return (
    <div className="collection-view-safe-wrapper">
      <Collection 
        block={block} 
        className={className} 
        ctx={context}
      />
    </div>
  )
}

export default CollectionViewSafe