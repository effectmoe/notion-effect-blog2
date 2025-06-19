import React, { useState } from 'react'

export default function TestHybridDirect() {
  const [query, setQuery] = useState('カフェ')
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testSearch = async () => {
    setIsLoading(true)
    try {
      // ハイブリッド検索APIを直接呼び出し
      const response = await fetch('/api/hybrid-search?query=' + encodeURIComponent(query), {
        method: 'GET'
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
      <h1>ハイブリッド検索直接テスト</h1>
      
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

      {isLoading && <p>検索中...</p>}
      
      {results && (
        <div>
          <h2>検索結果</h2>
          <div style={{ marginBottom: '20px' }}>
            <strong>総件数:</strong> {results.totalResults || results.total || 0}件<br />
            <strong>成功:</strong> {results.success ? 'はい' : 'いいえ'}
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
                    <li key={index} style={{ marginBottom: '15px', border: '1px solid #ddd', padding: '10px' }}>
                      <strong>タイトル:</strong> {result.title}<br />
                      <strong>ページID:</strong> {result.pageId}<br />
                      <strong>URL:</strong> <a href={result.url} target="_blank">{result.url}</a><br />
                      <strong>ソース:</strong> {result.source}<br />
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