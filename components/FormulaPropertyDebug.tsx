import React, { useState } from 'react'
import { useNotionContext } from 'react-notion-x'

export const FormulaPropertyDebug: React.FC = () => {
  const { recordMap } = useNotionContext()
  const [showDebug, setShowDebug] = useState(false)
  
  const getPageIds = () => {
    const pageIds: string[] = []
    if (recordMap?.block) {
      Object.entries(recordMap.block).forEach(([blockId, blockData]) => {
        const block = (blockData as any)?.value
        if (block?.type === 'page' && block?.parent_table === 'collection') {
          pageIds.push(blockId)
        }
      })
    }
    return pageIds
  }
  
  const pageIds = getPageIds()
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      background: 'white', 
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <button onClick={() => setShowDebug(!showDebug)}>
        Debug Info ({pageIds.length} pages)
      </button>
      
      {showDebug && (
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <h4>ページID一覧:</h4>
          <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
            {pageIds.map((id) => (
              <li key={id} style={{ wordBreak: 'break-all' }}>
                {id}
                <button 
                  onClick={() => {
                    fetch(`/api/test-formula?pageId=${id}`)
                      .then(r => r.json())
                      .then(data => console.log(data))
                  }}
                  style={{ marginLeft: '5px', fontSize: '10px' }}
                >
                  Test
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FormulaPropertyDebug