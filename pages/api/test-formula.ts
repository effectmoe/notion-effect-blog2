import { NextApiRequest, NextApiResponse } from 'next'
import { notionHybrid } from '@/lib/notion-api-hybrid'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { pageId, propertyName = '最終更新日' } = req.query

  if (!pageId) {
    return res.status(400).json({ error: 'pageId is required' })
  }

  try {
    // ページIDの正規化
    const normalizedPageId = (pageId as string).replace(/-/g, '')
    
    console.log('Testing formula property:', {
      pageId: normalizedPageId,
      propertyName
    })

    // ページプロパティを取得
    const properties = await notionHybrid.getPageProperties(normalizedPageId)
    
    // フォーミュラプロパティの値を取得
    const formulaValue = await notionHybrid.getFormulaPropertyValue(
      normalizedPageId,
      propertyName as string
    )

    res.status(200).json({
      success: true,
      pageId: normalizedPageId,
      propertyName,
      formulaValue,
      allProperties: properties ? Object.keys(properties) : [],
      properties: properties, // 全プロパティデータを返す
      debug: {
        hasOfficialAPI: !!process.env.NOTION_API_SECRET,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Formula test error:', error)
    res.status(500).json({
      error: 'Failed to fetch formula property',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}