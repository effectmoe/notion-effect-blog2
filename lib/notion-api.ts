import { NotionAPI } from 'notion-client'
import { getNotionAPIWithRetry } from './notion-api-with-retry'

// 認証情報のログ出力（実際の値は表示されません）
console.log('Notion API設定状況:');
console.log('- NOTION_API_BASE_URL:', process.env.NOTION_API_BASE_URL ? '設定済み' : '未設定（デフォルト使用）');
console.log('- NOTION_API_SECRET:', process.env.NOTION_API_SECRET ? '設定済み' : '未設定（警告: 認証なしで検索が制限される可能性あり）');
console.log('- Using enhanced API with retry and rate limiting');

// Use the enhanced API with retry and rate limiting
export const notion = getNotionAPIWithRetry({
  apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
  authToken: process.env.NOTION_API_SECRET,  // 認証トークンを追加
  activeUser: process.env.NOTION_ACTIVE_USER || undefined,
  userTimeZone: 'Asia/Tokyo' // タイムゾーンを設定
})
