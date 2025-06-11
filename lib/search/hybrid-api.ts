/**
 * Notion公式APIと非公式APIを統合したハイブリッドAPI層
 * ビルドエラー回避のため一時的に簡略化版
 */

import { NotionAPI } from 'notion-client'
import type { ExtendedRecordMap } from 'notion-types'
import { getTextContent, getPageProperty } from 'notion-utils'
import type { HybridPageData, SearchIndexItem } from './types'

export class HybridNotionAPI {
  private unofficialAPI: NotionAPI
  private officialAPI: any | null = null
  
  constructor() {
    // 非公式API（react-notion-x）の初期化
    this.unofficialAPI = new NotionAPI({
      activeUser: process.env.NOTION_ACTIVE_USER,
      authToken: process.env.NOTION_TOKEN_V2
    })
    
    // 公式APIは後で初期化
    console.log('HybridNotionAPI initialized. Official API will be loaded on demand.')
  }
  
  /**
   * ページIDから両APIのデータを取得して統合
   */
  async getEnrichedPageData(pageId: string): Promise<HybridPageData> {
    try {
      // 現時点では非公式APIのデータのみ使用
      const unofficialData = await this.getUnofficialPageData(pageId)
      
      // TODO: 公式APIのデータも統合する（ビルド問題解決後）
      const officialData = {}
      
      // データを統合
      return this.mergePageData(unofficialData, officialData)
    } catch (error) {
      console.error(`Error getting enriched page data for ${pageId}:`, error)
      throw error
    }
  }
  
  /**
   * 非公式APIからページデータを取得
   */
  private async getUnofficialPageData(pageId: string): Promise<Partial<HybridPageData>> {
    try {
      const recordMap = await this.unofficialAPI.getPage(pageId)
      const title = this.extractTitle(recordMap, pageId)
      const content = this.extractContent(recordMap, pageId)
      
      return {
        recordMap,
        title,
        content,
        searchableText: `${title} ${content}`.toLowerCase()
      }
    } catch (error) {
      console.error(`Error getting unofficial page data for ${pageId}:`, error)
      return {
        title: '',
        content: '',
        searchableText: ''
      }
    }
  }
  
  /**
   * 両APIのデータをマージ
   */
  private mergePageData(
    unofficialData: Partial<HybridPageData>,
    officialData: Partial<HybridPageData>
  ): HybridPageData {
    // キーワード抽出
    const keywords = this.extractKeywords({
      ...unofficialData,
      ...officialData
    })
    
    // 検索可能テキストの構築
    const searchableText = this.buildSearchableText({
      ...unofficialData,
      ...officialData
    })
    
    return {
      // 非公式APIのデータ
      recordMap: unofficialData.recordMap,
      title: unofficialData.title || '',
      content: unofficialData.content || '',
      
      // 公式APIのデータ（現時点では空）
      properties: officialData.properties,
      lastEditedTime: officialData.lastEditedTime,
      createdTime: officialData.createdTime,
      tags: officialData.tags,
      category: officialData.category,
      author: officialData.author,
      status: officialData.status,
      publishedDate: officialData.publishedDate,
      
      // 統合データ
      searchableText,
      keywords
    }
  }
  
  /**
   * recordMapからタイトルを抽出
   */
  private extractTitle(recordMap: ExtendedRecordMap, pageId: string): string {
    const block = recordMap.block[pageId]?.value
    if (!block) return ''
    
    return getTextContent(block.properties?.title) || ''
  }
  
  /**
   * recordMapからコンテンツを抽出
   */
  private extractContent(recordMap: ExtendedRecordMap, pageId: string): string {
    const blocks = Object.values(recordMap.block)
    const textContents: string[] = []
    
    for (const blockData of blocks) {
      const block = blockData.value
      if (!block || block.type === 'page') continue
      
      // テキストコンテンツを抽出
      if (block.properties?.title) {
        const text = getTextContent(block.properties.title)
        if (text) textContents.push(text)
      }
    }
    
    return textContents.join(' ')
  }
  
  /**
   * キーワードを抽出
   */
  private extractKeywords(data: Partial<HybridPageData>): string[] {
    const keywords: string[] = []
    
    // タイトルからキーワード抽出
    if (data.title) {
      keywords.push(...this.tokenize(data.title))
    }
    
    // タグをキーワードに追加
    if (data.tags) {
      keywords.push(...data.tags)
    }
    
    // カテゴリをキーワードに追加
    if (data.category) {
      keywords.push(data.category)
    }
    
    // 重複を除去
    return [...new Set(keywords)]
  }
  
  /**
   * 検索可能なテキストを構築
   */
  private buildSearchableText(data: Partial<HybridPageData>): string {
    const parts: string[] = []
    
    if (data.title) parts.push(data.title)
    if (data.content) parts.push(data.content)
    if (data.tags) parts.push(...data.tags)
    if (data.category) parts.push(data.category)
    if (data.author) parts.push(data.author)
    
    return parts.join(' ').toLowerCase()
  }
  
  /**
   * テキストをトークンに分割
   */
  private tokenize(text: string): string[] {
    // 日本語と英語の両方に対応したトークン化
    const tokens = text
      .toLowerCase()
      .replace(/[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1)
    
    return tokens
  }
  
  /**
   * ページIDをハイフン付きのフォーマットに変換
   */
  private formatPageId(pageId: string): string {
    const cleaned = pageId.replace(/-/g, '')
    if (cleaned.length !== 32) return pageId
    
    return [
      cleaned.slice(0, 8),
      cleaned.slice(8, 12),
      cleaned.slice(12, 16),
      cleaned.slice(16, 20),
      cleaned.slice(20, 32)
    ].join('-')
  }
  
  /**
   * 検索用のインデックスアイテムを生成
   */
  async buildSearchIndexItem(pageId: string): Promise<SearchIndexItem> {
    const pageData = await this.getEnrichedPageData(pageId)
    
    return {
      id: pageId,
      pageId,
      title: pageData.title,
      content: pageData.content,
      searchableText: pageData.searchableText,
      metadata: {
        createdTime: pageData.createdTime || new Date().toISOString(),
        lastEditedTime: pageData.lastEditedTime || new Date().toISOString(),
        author: pageData.author,
        tags: pageData.tags || [],
        category: pageData.category,
        status: pageData.status,
        publishedDate: pageData.publishedDate,
        properties: pageData.properties
      },
      keywords: pageData.keywords,
      lastIndexed: new Date().toISOString()
    }
  }
}