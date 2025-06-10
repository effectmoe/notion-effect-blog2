import { NotionAPI } from 'notion-client'
import { NotionAPIWithRetry } from './notion-api-with-retry'
import { NotionAPINoCollection } from './notion-api-no-collection'
import { NotionAPISafe } from './notion-api-safe'
import { NotionAPIEnhanced } from './notion-api-enhanced'

// 認証情報のログ出力（実際の値は表示されません）
console.log('Notion API設定状況:');
console.log('- NOTION_API_BASE_URL:', process.env.NOTION_API_BASE_URL ? '設定済み' : '未設定（デフォルト使用）');
console.log('- NOTION_API_SECRET:', process.env.NOTION_API_SECRET ? '設定済み' : '未設定（警告: 認証なしで検索が制限される可能性あり）');
console.log('- DISABLE_COLLECTION_DATA:', process.env.DISABLE_COLLECTION_DATA === 'true' ? '有効' : '無効');

// 拡張されたNotionAPIを使用
export const notion = new NotionAPIEnhanced({
  apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
  authToken: process.env.NOTION_API_SECRET,
  activeUser: process.env.NOTION_ACTIVE_USER || undefined,
  userTimeZone: 'Asia/Tokyo'
})
