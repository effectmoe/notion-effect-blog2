import React, { useEffect, useState } from 'react'
import { notion } from '../lib/notion-api'

export default function TestCollectionBlock() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // テスト用のブロックIDを設定（ログから取得）
        const testBlockIds = [
          '208b802c-b0c6-80d8-a147-fc3344e95e46', // 最初のエラーのブロック
          '1ceb802c-b0c6-81e8-a45e-000ba000bfe2'  // 成功しているブロック
        ]

        const results = []
        
        for (const blockId of testBlockIds) {
          console.log(`Testing block: ${blockId}`)
          
          // ブロックを含むページを取得
          const recordMap = await notion.getPage(blockId, {
            fetchMissingBlocks: true,
            fetchCollections: true,
            signFileUrls: false
          })

          // ブロック情報を抽出
          const block = recordMap.block?.[blockId]?.value as any
          const collectionId = block?.collection_id || block?.format?.collection_pointer?.id
          const collection = collectionId ? recordMap.collection?.[collectionId]?.value : null

          results.push({
            blockId,
            blockType: block?.type,
            collectionId: collectionId,
            hasBlock: !!block,
            hasCollection: !!collection,
            collectionName: collection?.name?.[0]?.[0],
            availableCollections: Object.keys(recordMap.collection || {}),
            availableViews: Object.keys(recordMap.collection_view || {}),
            blockData: block,
            collectionData: collection
          })
        }

        setData(results)
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Collection Block Test</h1>
      {data?.map((item: any, index: number) => (
        <div key={index} style={{ marginBottom: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h2>Block: {item.blockId}</h2>
          <pre>{JSON.stringify(item, null, 2)}</pre>
        </div>
      ))}
    </div>
  )
}