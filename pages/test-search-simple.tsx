import React, { useState } from 'react'

export default function SimpleSearchTest() {
  const [query, setQuery] = useState('カフェ')
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testSearch = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          options: { limit: 20 }
        })
      })
      
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Search failed:', error)
      setResults({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>シンプル検索テスト</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索キーワード"
          style={{
            padding: '10px',
            fontSize: '16px',
            width: '300px',
            marginRight: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={testSearch}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          検索実行
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>推奨検索キーワード:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['カフェ', 'キネシ', '講座', 'アロマ', '歴史', '動画', '特長'].map((keyword) => (
            <button
              key={keyword}
              onClick={() => setQuery(keyword)}
              style={{
                padding: '5px 10px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p>検索中...</p>}
      
      {results && (
        <div>
          <h2>検索結果</h2>
          <div style={{ marginBottom: '20px' }}>
            <strong>総件数:</strong> {results.total || 0}件
          </div>
          
          {results.error ? (
            <div style={{ color: 'red' }}>
              エラー: {results.error}
            </div>
          ) : (
            <>
              <h3>検索結果一覧:</h3>
              {results.results && results.results.length > 0 ? (
                <ul>
                  {results.results.map((result: any, index: number) => (
                    <li key={index} style={{ marginBottom: '15px' }}>
                      <strong>タイトル:</strong> {result.title}<br />
                      <strong>ページID:</strong> {result.pageId}<br />
                      <strong>URL:</strong> <a href={result.url} target="_blank">{result.url}</a><br />
                      <strong>スコア:</strong> {result.relevanceScore}<br />
                      {result.excerpt && (
                        <>
                          <strong>抜粋:</strong> {result.excerpt}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>検索結果がありません</p>
              )}
              
              <details style={{ marginTop: '20px' }}>
                <summary>生のレスポンスデータ</summary>
                <pre style={{
                  backgroundColor: '#f3f4f6',
                  padding: '20px',
                  borderRadius: '8px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(results, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  )
}