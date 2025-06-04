import { NotionAPI } from 'notion-client'
const { Client } = require('@notionhq/client')
import { ExtendedRecordMap } from 'notion-types'

// 公式APIと非公式APIを統合するハイブリッドクライアント
export class NotionHybridAPI {
  private unofficialClient: NotionAPI
  private officialClient: any = null
  private hasOfficialAPI: boolean = false

  constructor() {
    // 非公式APIクライアント（常に初期化）
    this.unofficialClient = new NotionAPI({
      apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
      authToken: process.env.NOTION_API_SECRET,
      activeUser: process.env.NOTION_ACTIVE_USER || undefined,
      userTimeZone: 'Asia/Tokyo'
    })

    // 公式APIクライアント（トークンがある場合のみ初期化）
    if (process.env.NOTION_API_SECRET) {
      console.log('Notion Hybrid API: 公式APIクライアントを初期化中...')
      this.officialClient = new Client({
        auth: process.env.NOTION_API_SECRET,
        timeZone: 'Asia/Tokyo'
      })
      this.hasOfficialAPI = true
    } else {
      console.log('Notion Hybrid API: 公式APIトークンが未設定のため、非公式APIのみ使用')
    }
  }

  // ページデータの取得（非公式APIを使用）
  async getPage(pageId: string): Promise<ExtendedRecordMap> {
    return await this.unofficialClient.getPage(pageId)
  }

  // データベースプロパティの取得（公式APIを優先的に使用）
  async getDatabaseProperties(databaseId: string): Promise<any> {
    if (this.hasOfficialAPI && this.officialClient) {
      try {
        console.log(`公式APIでデータベースプロパティを取得中: ${databaseId}`)
        const response = await this.officialClient.databases.retrieve({
          database_id: databaseId
        })
        return response.properties
      } catch (error) {
        console.error('公式APIエラー:', error)
        console.log('非公式APIにフォールバック...')
      }
    }
    
    // 非公式APIフォールバック
    return null
  }

  // データベースのアイテム取得（公式APIを優先的に使用）
  async getDatabaseItems(databaseId: string, options?: any): Promise<any> {
    if (this.hasOfficialAPI && this.officialClient) {
      try {
        console.log(`公式APIでデータベースアイテムを取得中: ${databaseId}`)
        const response = await this.officialClient.databases.query({
          database_id: databaseId,
          ...options
        })
        return response.results
      } catch (error) {
        console.error('公式APIエラー:', error)
        console.log('非公式APIにフォールバック...')
      }
    }
    
    // 非公式APIフォールバック - 通常のgetPageを使用
    const pageData = await this.unofficialClient.getPage(databaseId)
    return pageData
  }

  // ページプロパティの取得（公式APIを優先的に使用）
  async getPageProperties(pageId: string): Promise<any> {
    if (this.hasOfficialAPI && this.officialClient) {
      try {
        console.log(`公式APIでページプロパティを取得中: ${pageId}`)
        const response = await this.officialClient.pages.retrieve({
          page_id: pageId
        })
        return response.properties
      } catch (error) {
        console.error('公式APIエラー:', error)
        console.log('非公式APIにフォールバック...')
      }
    }
    
    // 非公式APIフォールバック
    const pageData = await this.unofficialClient.getPage(pageId)
    return pageData
  }

  // 検索機能（非公式APIを使用）
  async search(params: any): Promise<any> {
    return await this.unofficialClient.search(params)
  }

  // 署名付きURLの取得（非公式APIを使用）
  async getSignedFileUrls(urls: string[]): Promise<any> {
    // SignedUrlRequest型に変換
    const requests = urls.map(url => ({
      url,
      permissionRecord: {
        table: 'block',
        id: url
      }
    }))
    return await this.unofficialClient.getSignedFileUrls(requests as any)
  }

  // フォーミュラプロパティの値を取得する特別なメソッド
  async getFormulaPropertyValue(pageId: string, propertyName: string): Promise<string | null> {
    if (!this.hasOfficialAPI || !this.officialClient) {
      console.log('公式APIが利用できないため、フォーミュラプロパティを取得できません')
      return null
    }

    try {
      const page = await this.officialClient.pages.retrieve({ page_id: pageId })
      const properties = page.properties as any
      
      // プロパティ名で検索
      for (const [key, prop] of Object.entries(properties)) {
        const property = prop as any
        if (property.type === 'formula' && key === propertyName) {
          const formulaValue = property.formula
          if (formulaValue?.type === 'string') {
            return formulaValue.string
          } else if (formulaValue?.type === 'date' && formulaValue.date) {
            return formulaValue.date.start
          }
        }
      }
    } catch (error) {
      console.error(`フォーミュラプロパティ "${propertyName}" の取得エラー:`, error)
    }
    
    return null
  }
}

// シングルトンインスタンスをエクスポート
export const notionHybrid = new NotionHybridAPI()