import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const envVars = {
    // 既存の環境変数
    NOTION_API_SECRET: process.env.NOTION_API_SECRET ? '設定済み' : '未設定',
    NOTION_AUTH_TOKEN: process.env.NOTION_AUTH_TOKEN ? '設定済み' : '未設定',
    
    // 新しい環境変数名
    NOTION_TOKEN_V2: process.env.NOTION_TOKEN_V2 ? '設定済み' : '未設定',
    NOTION_ACTIVE_USER: process.env.NOTION_ACTIVE_USER ? '設定済み' : '未設定',
    NOTION_USER_ID: process.env.NOTION_USER_ID ? '設定済み' : '未設定',
    NOTION_SEARCH_API_SECRET: process.env.NOTION_SEARCH_API_SECRET ? '設定済み' : '未設定',
    
    // その他
    rootNotionPageId: process.env.NEXT_PUBLIC_ROOT_NOTION_PAGE_ID || '未設定',
    rootNotionSpaceId: process.env.NEXT_PUBLIC_ROOT_NOTION_SPACE_ID || '未設定'
  }
  
  res.status(200).json({
    message: 'Environment variables check',
    env: envVars,
    timestamp: new Date().toISOString()
  })
}