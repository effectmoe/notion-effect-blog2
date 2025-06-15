import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 単一ページを取得してスペースIDを確認
    const rootPageId = '1ceb802cb0c680f29369dba86095fb38'
    const rootPage = await notion.getPage(rootPageId)
    
    // スペースIDを抽出（ExtendedRecordMapから）
    const spaceId = rootPage.block[rootPageId]?.value?.space_id || null
    
    // ページ一覧を取得する別の方法
    const searchParams = {
      query: '',
      limit: 100,
      filters: {
        isNavigableOnly: false,
        excludeTemplates: false,
        isDeletedOnly: false,
        navigableBlockContentOnly: false,
        requireEditPermissions: false
      },
      sort: {
        field: 'lastEdited',
        direction: 'desc'
      }
    }
    
    let allPages = []
    
    // バッチページ取得を使用してページを取得
    try {
      const { getAllPageIds } = await import('@/lib/search/batch-page-fetcher')
      const pageIds = await getAllPageIds(rootPageId)
      allPages = pageIds.map(id => ({
        id,
        object: 'page',
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString()
      }))
    } catch (searchError) {
      console.error('Page discovery failed:', searchError)
    }
    
    // 結果を整形
    const pageInfo = {
      rootPageId,
      spaceId,
      totalPages: allPages.length,
      pages: allPages.slice(0, 10).map(page => ({
        id: page.id,
        title: 'Page ' + page.id.slice(0, 8),  // 簡略化
        type: page.object,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time
      }))
    }
    
    res.status(200).json(pageInfo)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}