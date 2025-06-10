import { NotionAPI } from 'notion-client'
import { type ExtendedRecordMap } from 'notion-types'

// シンプルで高速なNotion API（タイムアウト対策）
export class NotionAPISimple extends NotionAPI {
  async getPage(
    pageId: string,
    {
      fetchCollections = false, // デフォルトでコレクションを取得しない
      fetchMissingBlocks = false, // デフォルトでミッシングブロックを取得しない
      signFileUrls = false,
      chunkLimit = 30, // 小さなチャンクサイズ
      chunkNumber = 0,
      ...rest
    }: Parameters<NotionAPI['getPage']>[1] = {}
  ): Promise<ExtendedRecordMap> {
    console.log('[NotionAPISimple] Fast page fetch:', pageId)
    
    try {
      const recordMap = await super.getPage(pageId, {
        fetchCollections,
        fetchMissingBlocks,
        signFileUrls,
        chunkLimit,
        chunkNumber,
        ...rest
      })
      
      console.log('[NotionAPISimple] Page fetched successfully')
      return recordMap
    } catch (error) {
      console.error('[NotionAPISimple] Error fetching page:', error)
      // エラーの場合は最小限のデータを返す
      return {
        block: {},
        collection: {},
        collection_view: {},
        collection_query: {},
        notion_user: {},
        signed_urls: {}
      } as ExtendedRecordMap
    }
  }
}

// シンプルなAPIインスタンス
export const notionSimple = new NotionAPISimple({
  apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
  authToken: process.env.NOTION_API_SECRET,
  activeUser: process.env.NOTION_ACTIVE_USER || undefined,
  userTimeZone: 'Asia/Tokyo'
})