/**
 * データソース切り替え方式の検索エンジン
 */

import { SearchIndexer } from './indexer'
import { filterSearchResults, isValidBlogPage } from './search-filter'
import { memoryCache } from './memory-cache'
import { staticSearchIndex } from './static-index'
import type {
  SearchResult,
  SearchOptions,
  SearchQuery,
  SearchResponse,
  SearchStrategy,
  SearchIndexItem
} from './types'

export class SearchEngine {
  private indexer: SearchIndexer
  
  constructor() {
    this.indexer = new SearchIndexer()
  }
  
  /**
   * メイン検索メソッド
   */
  async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now()
    
    try {
      // クエリを解析
      const searchQuery = this.parseQuery(query)
      
      // 検索戦略を決定
      const strategy = this.determineSearchStrategy(searchQuery, options)
      
      // 戦略に基づいて検索を実行
      let results: SearchResult[]
      switch (strategy) {
        case 'metadata':
          results = await this.searchByMetadata(searchQuery, options)
          break
        case 'content':
          results = await this.searchByContent(searchQuery, options)
          break
        case 'hybrid':
        default:
          results = await this.hybridSearch(searchQuery, options)
      }
      
      // システムページをフィルタリング
      results = filterSearchResults(results)
      
      // 結果をソート
      results = this.sortResults(results, options)
      
      // ページネーション適用
      const paginatedResults = this.paginateResults(results, options)
      
      return {
        results: paginatedResults.items,
        total: results.length,
        hasMore: paginatedResults.hasMore,
        nextOffset: paginatedResults.nextOffset,
        query: searchQuery,
        searchTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }
  
  /**
   * クエリを解析
   */
  private parseQuery(query: string): SearchQuery {
    const normalizedQuery = query.trim().toLowerCase()
    
    // 特殊な検索パターンを検出
    const hasDateFilter = /\d{4}[-\/]\d{1,2}/.test(query)
    const hasTagFilter = /#\w+/.test(query)
    const hasCategoryFilter = /category:\w+/i.test(query)
    const hasAuthorFilter = /author:\w+/i.test(query)
    
    // トークン化
    const tokens = this.tokenizeQuery(normalizedQuery)
    
    return {
      query: normalizedQuery,
      type: (hasDateFilter || hasTagFilter || hasCategoryFilter || hasAuthorFilter) 
        ? 'advanced' 
        : 'simple',
      tokens,
      filters: this.extractFilters(query)
    }
  }
  
  /**
   * 検索戦略を決定
   */
  private determineSearchStrategy(
    query: SearchQuery,
    options: SearchOptions
  ): SearchStrategy {
    // 明示的な検索タイプ指定がある場合
    if (options.searchType === 'metadata') return 'metadata'
    if (options.searchType === 'content') return 'content'
    
    // クエリの内容から判断
    if (query.type === 'advanced') {
      // フィルターが含まれる場合はメタデータ検索
      return 'metadata'
    }
    
    // フィルターオプションがある場合
    if (options.filters && Object.keys(options.filters).length > 0) {
      return 'metadata'
    }
    
    // デフォルトはハイブリッド検索
    return 'hybrid'
  }
  
  /**
   * メタデータ検索（公式APIデータを優先）
   */
  private async searchByMetadata(
    query: SearchQuery,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    let index = await this.indexer.loadIndex()
    
    // インデックスが空の場合は静的インデックスを使用
    if (index.length === 0) {
      console.log('Using static index for metadata search')
      index = staticSearchIndex
      memoryCache.setSearchIndex(index)
    }
    
    const results: SearchResult[] = []
    
    for (const item of index) {
      // メタデータフィルタリング
      if (!this.matchesMetadataFilters(item, query, options)) {
        continue
      }
      
      // キーワードマッチング
      const score = this.calculateMetadataScore(item, query)
      if (score > 0) {
        results.push(this.createSearchResult(item, score, 'metadata'))
      }
    }
    
    return results
  }
  
  /**
   * コンテンツ検索（全文検索）
   */
  private async searchByContent(
    query: SearchQuery,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    let index = await this.indexer.loadIndex()
    
    // インデックスが空の場合は静的インデックスを使用
    if (index.length === 0) {
      console.log('Using static index for content search')
      index = staticSearchIndex
      memoryCache.setSearchIndex(index)
    }
    
    const results: SearchResult[] = []
    
    for (const item of index) {
      // コンテンツマッチング
      const score = this.calculateContentScore(item, query)
      if (score > 0) {
        results.push(this.createSearchResult(item, score, 'content'))
      }
    }
    
    return results
  }
  
  /**
   * ハイブリッド検索（両方のデータを統合）
   */
  private async hybridSearch(
    query: SearchQuery,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const [metadataResults, contentResults] = await Promise.all([
      this.searchByMetadata(query, options),
      this.searchByContent(query, options)
    ])
    
    // 結果をマージして重複を排除
    return this.mergeAndDeduplicate(metadataResults, contentResults)
  }
  
  /**
   * メタデータフィルターのマッチング
   */
  private matchesMetadataFilters(
    item: SearchIndexItem,
    query: SearchQuery,
    options: SearchOptions
  ): boolean {
    const filters = { ...query.filters, ...options.filters }
    
    // 日付範囲フィルター
    if (filters?.dateRange) {
      const itemDate = item.metadata.publishedDate || item.metadata.createdTime
      const date = new Date(itemDate)
      
      if (filters.dateRange.start && date < new Date(filters.dateRange.start)) {
        return false
      }
      if (filters.dateRange.end && date > new Date(filters.dateRange.end)) {
        return false
      }
    }
    
    // タグフィルター
    if (filters?.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        item.metadata.tags.includes(tag)
      )
      if (!hasMatchingTag) return false
    }
    
    // カテゴリフィルター
    if (filters?.categories && filters.categories.length > 0) {
      if (!item.metadata.category || 
          !filters.categories.includes(item.metadata.category)) {
        return false
      }
    }
    
    // 著者フィルター
    if (filters?.authors && filters.authors.length > 0) {
      if (!item.metadata.author || 
          !filters.authors.includes(item.metadata.author)) {
        return false
      }
    }
    
    // ステータスフィルター
    if (filters?.status && filters.status.length > 0) {
      if (!item.metadata.status || 
          !filters.status.includes(item.metadata.status)) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * メタデータスコアの計算
   */
  private calculateMetadataScore(
    item: SearchIndexItem,
    query: SearchQuery
  ): number {
    let score = 0
    const queryTokens = query.tokens || []
    
    // タイトルマッチ（高スコア）
    for (const token of queryTokens) {
      if (item.title.toLowerCase().includes(token)) {
        score += item.title.toLowerCase() === token ? 10 : 5
      }
    }
    
    // タグマッチ（中スコア）
    if (item.metadata.tags && item.metadata.tags.length > 0) {
      for (const token of queryTokens) {
        if (item.metadata.tags.some(tag => tag.toLowerCase().includes(token))) {
          score += 3
        }
      }
    }
    
    // カテゴリマッチ
    if (item.metadata.category) {
      for (const token of queryTokens) {
        if (item.metadata.category.toLowerCase().includes(token)) {
          score += 3
        }
      }
    }
    
    // キーワードマッチ
    if (item.keywords && item.keywords.length > 0) {
      for (const token of queryTokens) {
        if (item.keywords.some(keyword => keyword.includes(token))) {
          score += 2
        }
      }
    }
    
    return score
  }
  
  /**
   * コンテンツスコアの計算
   */
  private calculateContentScore(
    item: SearchIndexItem,
    query: SearchQuery
  ): number {
    let score = 0
    const queryTokens = query.tokens || []
    const searchableText = item.searchableText.toLowerCase()
    
    for (const token of queryTokens) {
      // 完全一致
      const exactMatches = (searchableText.match(new RegExp(`\\b${token}\\b`, 'g')) || []).length
      score += exactMatches * 2
      
      // 部分一致
      if (exactMatches === 0 && searchableText.includes(token)) {
        score += 1
      }
    }
    
    // タイトルでのマッチはボーナススコア
    const titleLower = item.title.toLowerCase()
    for (const token of queryTokens) {
      if (titleLower.includes(token)) {
        score += 5
      }
    }
    
    return score
  }
  
  /**
   * 検索結果の作成
   */
  private createSearchResult(
    item: SearchIndexItem,
    score: number,
    source: 'metadata' | 'content'
  ): SearchResult {
    return {
      id: item.id,
      title: item.title,
      content: item.content.slice(0, 200) + '...',
      excerpt: this.generateExcerpt(item.content, 150),
      url: `/${item.pageId}`,
      pageId: item.pageId,
      relevanceScore: score,
      metadata: {
        createdTime: item.metadata.createdTime,
        lastEditedTime: item.metadata.lastEditedTime,
        author: item.metadata.author,
        tags: item.metadata.tags,
        category: item.metadata.category,
        status: item.metadata.status,
        publishedDate: item.metadata.publishedDate
      },
      source: source === 'metadata' ? 'official' : 'unofficial'
    }
  }
  
  /**
   * 結果のマージと重複排除
   */
  private mergeAndDeduplicate(
    results1: SearchResult[],
    results2: SearchResult[]
  ): SearchResult[] {
    const merged = new Map<string, SearchResult>()
    
    // 最初の結果セットを追加
    for (const result of results1) {
      merged.set(result.pageId, result)
    }
    
    // 2番目の結果セットを追加（スコアが高い場合は更新）
    for (const result of results2) {
      const existing = merged.get(result.pageId)
      if (!existing || result.relevanceScore > existing.relevanceScore) {
        merged.set(result.pageId, {
          ...result,
          source: 'hybrid'
        })
      }
    }
    
    return Array.from(merged.values())
  }
  
  /**
   * 結果のソート
   */
  private sortResults(
    results: SearchResult[],
    options: SearchOptions
  ): SearchResult[] {
    const sortBy = options.sortBy || 'relevance'
    const sortOrder = options.sortOrder || 'desc'
    
    return results.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore
          break
        case 'date':
          const dateA = new Date(a.metadata?.lastEditedTime || 0).getTime()
          const dateB = new Date(b.metadata?.lastEditedTime || 0).getTime()
          comparison = dateA - dateB
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }
  
  /**
   * ページネーション
   */
  private paginateResults(
    results: SearchResult[],
    options: SearchOptions
  ): { items: SearchResult[], hasMore: boolean, nextOffset?: number } {
    const limit = options.limit || 20
    const offset = options.offset || 0
    
    const items = results.slice(offset, offset + limit)
    const hasMore = offset + limit < results.length
    
    return {
      items,
      hasMore,
      nextOffset: hasMore ? offset + limit : undefined
    }
  }
  
  /**
   * クエリのトークン化
   */
  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0)
  }
  
  /**
   * フィルターの抽出
   */
  private extractFilters(query: string): SearchOptions['filters'] {
    const filters: SearchOptions['filters'] = {}
    
    // タグの抽出 (#tag)
    const tagMatches = query.match(/#\w+/g)
    if (tagMatches) {
      filters.tags = tagMatches.map(tag => tag.substring(1))
    }
    
    // カテゴリの抽出 (category:value)
    const categoryMatch = query.match(/category:(\w+)/i)
    if (categoryMatch) {
      filters.categories = [categoryMatch[1]]
    }
    
    // 著者の抽出 (author:value)
    const authorMatch = query.match(/author:(\w+)/i)
    if (authorMatch) {
      filters.authors = [authorMatch[1]]
    }
    
    return Object.keys(filters).length > 0 ? filters : undefined
  }
  
  /**
   * 抜粋の生成
   */
  private generateExcerpt(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content
    
    const truncated = content.slice(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...'
  }
  
  /**
   * 検索候補の取得（オートコンプリート用）
   */
  async getSuggestions(partial: string, limit: number = 5): Promise<string[]> {
    const index = await this.indexer.loadIndex()
    const suggestions = new Set<string>()
    const partialLower = partial.toLowerCase()
    
    for (const item of index) {
      // タイトルからの候補
      if (item.title.toLowerCase().startsWith(partialLower)) {
        suggestions.add(item.title)
      }
      
      // タグからの候補
      for (const tag of item.metadata.tags) {
        if (tag.toLowerCase().startsWith(partialLower)) {
          suggestions.add(`#${tag}`)
        }
      }
      
      if (suggestions.size >= limit) break
    }
    
    return Array.from(suggestions).slice(0, limit)
  }
  
  /**
   * インデックスの再構築
   */
  async reindexAll(): Promise<void> {
    await this.indexer.buildFullIndex()
  }