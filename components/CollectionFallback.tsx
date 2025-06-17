import * as React from 'react'
import { useNotionContext } from 'react-notion-x'

interface CollectionFallbackProps {
  block: any;
  className?: string;
}

export const CollectionFallback: React.FC<CollectionFallbackProps> = ({ 
  block, 
  className 
}) => {
  const { recordMap } = useNotionContext()
  
  // Try to find the actual collection data
  const collectionId = block?.collection_id || block?.collection_pointer?.id
  const viewIds = block?.view_ids || []
  
  if (!collectionId || viewIds.length === 0) {
    return (
      <div className={`notion-collection-fallback ${className || ''}`}>
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          margin: '1rem 0'
        }}>
          <p>このデータベースは現在表示できません。</p>
          <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
            データベースがリンクされているか、権限設定を確認してください。
          </p>
        </div>
      </div>
    )
  }
  
  // Attempt to find collection items manually
  const collectionItems: any[] = []
  
  if (recordMap?.block) {
    Object.entries(recordMap.block).forEach(([blockId, blockData]) => {
      const b = (blockData as any)?.value
      if (b?.parent_id === collectionId || 
          (b?.parent_table === 'collection' && b?.parent_id === collectionId)) {
        collectionItems.push({
          id: blockId,
          ...b
        })
      }
    })
  }
  
  if (collectionItems.length === 0) {
    return (
      <div className={`notion-collection-fallback ${className || ''}`}>
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          margin: '1rem 0'
        }}>
          <p>データベースにアイテムが見つかりません。</p>
        </div>
      </div>
    )
  }
  
  // Simple list rendering as fallback
  return (
    <div className={`notion-collection-fallback ${className || ''}`}>
      <div className="notion-collection-list" style={{ margin: '1rem 0' }}>
        {collectionItems.map((item) => (
          <div 
            key={item.id} 
            className="notion-collection-list-item"
            style={{
              padding: '1rem',
              borderBottom: '1px solid #e1e1e1',
              cursor: 'pointer'
            }}
          >
            <a 
              href={`/${item.id.replace(/-/g, '')}`}
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'block'
              }}
            >
              {/* Title extraction */}
              <div style={{ fontWeight: 500 }}>
                {item.properties?.title?.[0]?.[0] || 
                 item.properties?.Name?.[0]?.[0] || 
                 item.properties?.name?.[0]?.[0] ||
                 item.properties?.['名前']?.[0]?.[0] ||
                 'Untitled'}
              </div>
              
              {/* Additional properties could be shown here */}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CollectionFallback