import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // テスト用：いくつかのページIDでプロパティを確認
    const testPageIds = [
      '1d3b802cb0c680519714ffd510528bc0', // カフェキネシ公認インストラクター
      '1d3b802cb0c680569ac6e94e37eebfbf', // ブログ
      '1d3b802cb0c680e48557cffb5e357161', // カフェキネシラバーズ
    ]
    
    const results = []
    
    for (const pageId of testPageIds) {
      try {
        const page = await notion.getPage(pageId)
        const block = page.block[pageId]?.value
        const properties = block?.properties || {}
        
        // すべてのプロパティを列挙
        const propertyInfo = {}
        for (const [key, value] of Object.entries(properties)) {
          propertyInfo[key] = {
            value: value,
            // 最初の値を簡単に取得
            firstValue: value?.[0]?.[0]
          }
        }
        
        results.push({
          pageId,
          title: properties.title?.[0]?.[0] || 'Untitled',
          properties: propertyInfo,
          // 検索対象と思われるプロパティを探す
          possibleSearchableProps: Object.entries(properties)
            .filter(([key, value]) => {
              const firstVal = value?.[0]?.[0]
              return firstVal === 'Yes' || firstVal === true || firstVal === 'true'
            })
            .map(([key, value]) => ({ key, value: value?.[0]?.[0] }))
        })
      } catch (error) {
        results.push({
          pageId,
          error: error.message
        })
      }
    }
    
    res.status(200).json({
      message: 'Page properties check',
      pages: results
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}