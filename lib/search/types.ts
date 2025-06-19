/**
 * 検索機能に関する型定義
 */

import type { ExtendedRecordMap, PageMap } from 'notion-types'

// 検索結果の型定義
export interface SearchResult {
  id: string
  title: string
  content?: string
  excerpt?: string
  url: string
  pageId: string
  relevanceScore: number
  // 公式APIからのメタデータ
  metadata?: {
    createdTime?: string
    lastEditedTime?: string
    author?: string
    tags?: string[]
    category?: string
    status?: string
    publishedDate?: string
  }
  // データソース情報
  source: 'official' | 'unofficial' | 'hybrid'
}

// 検索オプションの型定義
export interface SearchOptions {
  limit?: number
  offset?: number
  searchType?: 'content' | 'metadata' | 'all'
  filters?: {
    dateRange?: {
      start?: string
      end?: string
    }
    tags?: string[]
    categories?: string[]
    authors?: string[]
    status?: string[]
  }
  sortBy?: 'relevance' | 'date' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// 検索インデックスアイテムの型定義
export interface SearchIndexItem {
  id: string
  pageId: string
  title: string
  content: string
  searchableText: string
  metadata: {
    createdTime: string
    lastEditedTime: string
    author?: string
    tags: string[]
    category?: string
    status?: string
    publishedDate?: string
    properties?: Record<string, any>
  }
  keywords: string[]
  lastIndexed: string
}

// ハイブリッドAPIデータの型定義
export interface HybridPageData {
  // 非公式APIからのデータ
  recordMap?: ExtendedRecordMap
  title: string
  content: string
  
  // 公式APIからのデータ
  properties?: Record<string, any>
  lastEditedTime?: string
  createdTime?: string
  tags?: string[]
  category?: string
  author?: string
  status?: string
  publishedDate?: string
  
  // 統合データ
  searchableText: string
  keywords: string[]
}

// 検索クエリの型定義
export interface SearchQuery {
  query: string
  type: 'simple' | 'advanced'
  tokens?: string[]
  filters?: SearchOptions['filters']
}

// 検索レスポンスの型定義
export interface SearchResponse {
  results: SearchResult[]
  total: number
  hasMore: boolean
  nextOffset?: number
  query: SearchQuery
  searchTime: number
}

// 検索戦略の型定義
export type SearchStrategy = 'content' | 'metadata' | 'hybrid'

// インデックス統計の型定義
export interface IndexStats {
  totalPages: number
  lastUpdated: string
  officialApiPages: number
  unofficialApiPages: number
  hybridPages: number
}