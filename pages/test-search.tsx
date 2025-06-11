/**
 * 検索機能のテストページ
 */

import React, { useState } from 'react'
import { SearchModal } from '../components/SearchModal'

export default function TestSearchPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 検索APIのテスト
  const testSearchAPI = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'React',
          options: {
            searchType: 'all',
            limit: 5
          }
        })
      })
      
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Test failed:', error)
      setTestResults({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // インデックス状態の確認
  const checkIndexStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/search/reindex')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Status check failed:', error)
      setTestResults({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // インデックスの構築
  const buildIndex = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/search/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'full' })
      })
      
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Index build failed:', error)
      setTestResults({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>検索機能テストページ</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>1. 検索モーダルのテスト</h2>
        <button 
          onClick={() => setIsSearchOpen(true)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          検索モーダルを開く（または Cmd/Ctrl + K）
        </button>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>2. API機能のテスト</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={testSearchAPI}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            検索APIテスト
          </button>
          
          <button 
            onClick={checkIndexStatus}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            インデックス状態確認
          </button>
          
          <button 
            onClick={buildIndex}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            インデックス構築
          </button>
        </div>

        {isLoading && <p>処理中...</p>}
        
        {testResults && (
          <pre style={{
            backgroundColor: '#f3f4f6',
            padding: '20px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        )}
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>3. テスト手順</h2>
        <ol>
          <li>まず「インデックス状態確認」をクリックして現在の状態を確認</li>
          <li>インデックスが存在しない場合は「インデックス構築」をクリック</li>
          <li>インデックス構築完了後、「検索APIテスト」で動作確認</li>
          <li>「検索モーダルを開く」で実際のUI動作を確認</li>
        </ol>
      </div>

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  )
}