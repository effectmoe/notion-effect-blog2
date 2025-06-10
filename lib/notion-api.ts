import { NotionAPI } from 'notion-client'
import { NotionAPIWithRetry } from './notion-api-with-retry'
import { NotionAPINoCollection } from './notion-api-no-collection'

// 認証情報のログ出力（実際の値は表示されません）
console.log('Notion API設定状況:');
console.log('- NOTION_API_BASE_URL:', process.env.NOTION_API_BASE_URL ? '設定済み' : '未設定（デフォルト使用）');
console.log('- NOTION_API_SECRET:', process.env.NOTION_API_SECRET ? '設定済み' : '未設定（警告: 認証なしで検索が制限される可能性あり）');
console.log('- DISABLE_COLLECTION_DATA:', process.env.DISABLE_COLLECTION_DATA === 'true' ? '有効' : '無効');

// 本番環境ではリトライ機能付きAPIを使用
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
const disableCollection = process.env.DISABLE_COLLECTION_DATA === 'true'

export const notion = disableCollection ?
  new NotionAPINoCollection({
    apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER || undefined,
    userTimeZone: 'Asia/Tokyo'
  }) :
  isProduction ? 
    new NotionAPIWithRetry({
      authToken: process.env.NOTION_API_SECRET,
      activeUser: process.env.NOTION_ACTIVE_USER || undefined,
      userTimeZone: 'Asia/Tokyo',
      maxRetries: 3,
      retryDelay: 2000, // 2秒から開始
      timeout: 30000    // 30秒タイムアウト
    }) :
    new NotionAPI({
      apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
      authToken: process.env.NOTION_API_SECRET,
      activeUser: process.env.NOTION_ACTIVE_USER || undefined,
      userTimeZone: 'Asia/Tokyo'
    })
