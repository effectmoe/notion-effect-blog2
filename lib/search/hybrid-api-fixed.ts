/**
 * Notion公式APIと非公式APIを統合したハイブリッドAPI層
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
    
    // 公式APIの初期化は非同期で行う
    this.initOfficialAPI()
  }
  
  /**
   * 公式APIを非同期で初期化
   */
  private async initOfficialAPI() {
    try {
      const apiKey = process.env.NOTION_SEARCH_API_SECRET || process.env.NOTION_API_SECRET
      if (apiKey) {
        // 動的インポートを使用
        const notionModule = await import('@notionhq/client')
        const Client = notionModule.Client || notionModule.default?.Client || notionModule.default
        if (Client) {
          this.officialAPI = new Client({
            auth: apiKey
          })
        } else {
          console.error('Could not find Client in @notionhq/client module')
        }
      }
    } catch (error) {
      console.error('Failed to initialize Notion official API:', error)
    }
  }
  
  /**
   * ページIDから両APIのデータを取得して統合
   */
  async getEnrichedPageData(pageId: string): Promise<HybridPageData> {
    try {
      // 公式APIの初期化を待つ
      if (!this.officialAPI) {
        await this.initOfficialAPI()
      }
      
      // 並行してデータを取得
      const [unofficialData, officialData] = await Promise.all([
        this.getUnofficialPageData(pageId),
        this.getOfficialPageData(pageId)
      ])
      
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
   * 公式APIからページデータを取得
   */
  private async getOfficialPageData(pageId: string): Promise<Partial<HybridPageData>> {
    if (!this.officialAPI) {
      return {}
    }
    
    try {
      // ハイフン付きのページIDに変換
      const formattedPageId = this.formatPageId(pageId)
      
      // ページ情報を取得
      const page = await this.officialAPI.pages.retrieve({ 
        page_id: formattedPageId 
      })
      
      if (page.object !== 'page' || !('properties' in page)) {
        return {}
      }
      
      // プロパティを抽出
      const properties = page.properties
      const metadata = this.extractMetadata(properties)
      
      return {
        properties,
        lastEditedTime: page.last_edited_time,
        createdTime: page.created_time,
        ...metadata
      }
    } catch (error) {
      console.error(`Error getting official page data for ${pageId}:`, error)
      return {}
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
      
      // 公式APIのデータ
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
   * プロパティからメタデータを抽出
   */
  private extractMetadata(properties: any): Partial<HybridPageData> {
    const metadata: Partial<HybridPageData> = {}
    
    // タグの抽出
    if (properties.Tags?.multi_select) {
      metadata.tags = properties.Tags.multi_select.map((tag: any) => tag.name)
    }
    
    // カテゴリの抽出
    if (properties.Category?.select) {
      metadata.category = properties.Category.select.name
    }
    
    // 著者の抽出
    if (properties.Author?.people?.[0]) {
      metadata.author = properties.Author.people[0].name
    }
    
    // ステータスの抽出
    if (properties.Status?.status) {
      metadata.status = properties.Status.status.name
    }
    
    // 公開日の抽出
    if (properties.PublishedDate?.date) {
      metadata.publishedDate = properties.PublishedDate.date.start
    }
    
    return metadata
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