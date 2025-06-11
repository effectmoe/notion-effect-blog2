import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const notionApiKey = process.env.NOTION_API_KEY
    if (!notionApiKey) {
      return res.status(400).json({ error: 'NOTION_API_KEY not found' })
    }

    const databaseId = '1ceb802cb0c6814ab43eddb38e80f2e0'
    
    // データベースのスキーマを取得
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).json({ 
        error: 'Failed to fetch database',
        status: response.status,
        statusText: response.statusText,
        details: errorText
      })
    }

    const database = await response.json()
    
    // プロパティ名とタイプを抽出
    const properties = Object.entries(database.properties || {}).map(([name, prop]: [string, any]) => ({
      name,
      type: prop.type,
      id: prop.id
    }))
    
    // チェックボックスプロパティを探す
    const checkboxProperties = properties.filter(p => p.type === 'checkbox')
    
    res.status(200).json({
      success: true,
      databaseId,
      title: database.title?.[0]?.plain_text || 'Unknown',
      properties,
      checkboxProperties,
      totalProperties: properties.length
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}