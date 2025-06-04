import React, { useState } from 'react'
import { useNotionContext } from 'react-notion-x'

export const FormulaPropertyDebug: React.FC = () => {
  const { recordMap } = useNotionContext()
  const [showDebug, setShowDebug] = useState(false)
  
  const getPageIds = () => {
    const pageIds: string[] = []
    const collections: string[] = []
    
    if (recordMap?.block) {
      Object.entries(recordMap.block).forEach(([blockId, blockData]) => {
        const block = (blockData as any)?.value
        
        // すべてのページを収集（タイプに関係なく）
        if (block?.type === 'page') {
          pageIds.push(blockId)
        }
        
        // コレクションビューを収集
        if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
          collections.push(blockId)
        }
      })
    }
    
    console.log('Found blocks:', {
      totalBlocks: Object.keys(recordMap?.block || {}).length,
      pages: pageIds.length,
      collections: collections.length,
      sampleBlocks: Object.entries(recordMap?.block || {}).slice(0, 5).map(([id, data]) => ({
        id,
        type: (data as any)?.value?.type
      }))
    })
    
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
          <h4>RecordMap情報:</h4>
          <div>
            <p>Block数: {Object.keys(recordMap?.block || {}).length}</p>
            <p>Collection数: {Object.keys(recordMap?.collection || {}).length}</p>
            <p>Collection View数: {Object.keys(recordMap?.collection_view || {}).length}</p>
          </div>
          
          {recordMap?.collection && Object.keys(recordMap.collection).length > 0 && (
            <>
              <h4>コレクション（データベース）:</h4>
              <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
                {Object.entries(recordMap.collection).map(([id, data]) => (
                  <li key={id} style={{ wordBreak: 'break-all', marginBottom: '10px' }}>
                    <div>ID: {id}</div>
                    <button 
                      onClick={() => {
                        // コレクション内のページを探す
                        const collectionPages: string[] = []
                        Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
                          const block = (blockData as any)?.value
                          if (block?.parent_id === id && block?.type === 'page') {
                            collectionPages.push(blockId)
                          }
                        })
                        console.log(`Collection ${id} has ${collectionPages.length} pages:`, collectionPages)
                        
                        // 最初のページでテスト
                        if (collectionPages.length > 0) {
                          fetch(`/api/test-formula?pageId=${collectionPages[0]}`)
                            .then(r => r.json())
                            .then(data => console.log('Formula test result:', data))
                        }
                      }}
                      style={{ marginLeft: '5px', fontSize: '10px' }}
                    >
                      Test Pages
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          
          <h4>ページID一覧 ({pageIds.length}):</h4>
          <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
            {pageIds.length === 0 ? (
              <li>ページが見つかりません</li>
            ) : (
              pageIds.map((id) => (
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
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FormulaPropertyDebug