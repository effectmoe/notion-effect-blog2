import { NotionAPI } from 'notion-client'
import { NotionAPIWithRetry } from './notion-api-with-retry'
import { NotionAPINoCollection } from './notion-api-no-collection'
import { NotionAPISafe } from './notion-api-safe'
import { NotionAPIEnhanced } from './notion-api-enhanced'
import { NotionAPICollectionFix } from './notion-api-collection-fix'

// 認証情報のログ出力（実際の値は表示されません）
console.log('Notion API設定状況:');
console.log('- NOTION_API_BASE_URL:', process.env.NOTION_API_BASE_URL ? '設定済み' : '未設定（デフォルト使用）');
console.log('- NOTION_API_SECRET:', process.env.NOTION_API_SECRET ? '設定済み' : '未設定（警告: 認証なしで検索が制限される可能性あり）');
console.log('- DISABLE_COLLECTION_DATA:', process.env.DISABLE_COLLECTION_DATA === 'true' ? '有効' : '無効');

// 環境に応じて適切なAPIを選択
let notionInstance: NotionAPI;

if (process.env.USE_SIMPLE_API === 'true') {
  // タイムアウト対策のシンプルAPI
  const { notionSimple } = require('./notion-simple');
  notionInstance = notionSimple;
} else if (process.env.DISABLE_COLLECTION_FIX === 'true') {
  // 通常のNotionAPI
  notionInstance = new NotionAPI({
    apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER || undefined,
    userTimeZone: 'Asia/Tokyo'
  });
} else {
  // コレクション修正版のNotionAPI（デフォルト）
  notionInstance = new NotionAPICollectionFix({
    apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER || undefined,
    userTimeZone: 'Asia/Tokyo'
  });
}

export const notion = notionInstance;
