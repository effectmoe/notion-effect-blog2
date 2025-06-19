/**
 * 検索モーダルコンポーネント
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import type { SearchResult, SearchOptions } from '@/lib/search/types'
import styles from './SearchModal.module.css'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const router = typeof window !== 'undefined' ? useRouter() : null
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchType, setSearchType] = useState<'all' | 'content' | 'metadata'>('all')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // 高度な検索オプション
  const [filters, setFilters] = useState<SearchOptions['filters']>({})
  
  // 検索の実行
  const performSearch = useCallback(async (searchQuery: string, searchOptions?: SearchOptions) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          options: {
            searchType,
            filters,
            limit: 10,
            ...searchOptions
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      // フロントエンドでも追加フィルタリング
      const filteredResults = (data.results || []).filter((result: SearchResult) => {
        // 無題のページを除外
        if (result.title.includes('無題') || 
            result.title.toLowerCase().includes('untitled') ||
            result.title.includes('のページ')) {
          return false
        }
        
        // Notionページを除外
        if (result.title.toLowerCase().includes('notion') && result.title.includes('ページ')) {
          return false
        }
        
        // タイトルが空または短すぎる場合は除外
        if (!result.title || result.title.trim().length < 2) {
          return false
        }
        
        return true
      })
      
      setResults(filteredResults)
    } catch (err) {
      console.error('Search error:', err)
      setError('検索中にエラーが発生しました')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [searchType, filters])
  
  // デバウンスされた検索
  const debouncedSearch = useRef(
    debounce((searchQuery: string) => {
      performSearch(searchQuery)
    }, 300)
  ).current
  
  // クエリ変更時の処理
  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])
  
  // モーダルが開いた時の処理
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
      setSelectedIndex(0)
    }
  }, [isOpen])
  
  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex])
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }
  
  // 検索結果のクリック処理
  const handleResultClick = (result: SearchResult) => {
    if (router) {
      router.push(result.url)
    } else {
      window.location.href = result.url
    }
    onClose()
    
    // 検索履歴に追加（ローカルストレージ）
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    history.unshift({ query, timestamp: Date.now() })
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)))
  }
  
  // フィルターの更新
  const updateFilter = (key: keyof NonNullable<SearchOptions['filters']>, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  if (!isOpen) return null
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="検索..."
            className={styles.searchInput}
          />
          
          <div className={styles.searchTypeSelector}>
            <button
              className={searchType === 'all' ? styles.active : ''}
              onClick={() => setSearchType('all')}
            >
              すべて
            </button>
            <button
              className={searchType === 'content' ? styles.active : ''}
              onClick={() => setSearchType('content')}
            >
              コンテンツ
            </button>
            <button
              className={searchType === 'metadata' ? styles.active : ''}
              onClick={() => setSearchType('metadata')}
            >
              メタデータ
            </button>
          </div>
          
          <button
            className={styles.advancedToggle}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            高度な検索 {showAdvanced ? '▲' : '▼'}
          </button>
        </div>
        
        {showAdvanced && (
          <div className={styles.advancedOptions}>
            <div className={styles.filterGroup}>
              <label>タグ:</label>
              <input
                type="text"
                placeholder="#React #Next.js"
                onChange={(e) => {
                  const tags = e.target.value
                    .split(' ')
                    .filter(t => t.startsWith('#'))
                    .map(t => t.substring(1))
                  updateFilter('tags', tags.length > 0 ? tags : undefined)
                }}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>カテゴリ:</label>
              <input
                type="text"
                placeholder="技術記事"
                onChange={(e) => {
                  const value = e.target.value.trim()
                  updateFilter('categories', value ? [value] : undefined)
                }}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>著者:</label>
              <input
                type="text"
                placeholder="著者名"
                onChange={(e) => {
                  const value = e.target.value.trim()
                  updateFilter('authors', value ? [value] : undefined)
                }}
              />
            </div>
          </div>
        )}
        
        <div className={styles.resultsContainer}>
          {isLoading && (
            <div className={styles.loading}>検索中...</div>
          )}
          
          {error && (
            <div className={styles.error}>{error}</div>
          )}
          
          {!isLoading && !error && results.length === 0 && query && query.length >= 2 && (
            <div className={styles.noResults}>
              「{query}」に一致する結果が見つかりませんでした
            </div>
          )}
          
          {!isLoading && !error && results.length > 0 && (
            <div className={styles.results}>
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className={`${styles.resultItem} ${
                    index === selectedIndex ? styles.selected : ''
                  }`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <h3 className={styles.resultTitle}>{result.title}</h3>
                  <p className={styles.resultExcerpt}>{result.excerpt}</p>
                  
                  <div className={styles.resultMeta}>
                    {result.metadata?.tags && result.metadata.tags.length > 0 && (
                      <div className={styles.tags}>
                        {result.metadata.tags.map(tag => (
                          <span key={tag} className={styles.tag}>#{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    {result.metadata?.category && (
                      <span className={styles.category}>{result.metadata.category}</span>
                    )}
                    
                    <span className={styles.source}>
                      {result.source === 'official' ? '📊' : 
                       result.source === 'unofficial' ? '📄' : '🔄'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <div className={styles.shortcuts}>
            <span>↑↓ 移動</span>
            <span>Enter 選択</span>
            <span>Esc 閉じる</span>
          </div>
        </div>
      </div>
    </div>
  )
}