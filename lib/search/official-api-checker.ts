/**
 * Notion公式APIを使用して検索対象ページを取得
 * @notionhq/client を使用（現在はコメントアウトされているため、一時的に手動実装）
 */

// 公式APIが有効になるまでの暫定実装
export async function getSearchablePagesFromOfficialAPI(propertyName: string = 'Searchable'): Promise<string[]> {
  try {
    // 環境変数チェック - 利用可能なAPIキーを使用
    const notionApiKey = process.env.NOTION_SEARCH_API_SECRET || process.env.NOTION_API_SECRET || process.env.NOTION_API_KEY
    if (!notionApiKey) {
      console.log('No Notion API key found in environment variables')
      return []
    }

    // データベースID（カフェキネシコンテンツ）
    const databaseId = '1ceb802cb0c6814ab43eddb38e80f2e0'
    
    console.log('Querying Notion database with ID:', databaseId)
    console.log('Using property name:', propertyName)
    
    // 公式APIを使用してデータベースをクエリ
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: propertyName,  // 'Searchable' または '検索対象'
          checkbox: {
            equals: true
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to query Notion database:', response.status, response.statusText)
      console.error('Error details:', errorText)
      return []
    }

    const data = await response.json()
    
    // ページIDを抽出
    const pageIds = data.results
      .filter(page => page.object === 'page')
      .map(page => page.id.replace(/-/g, ''))  // ハイフンを除去
    
    console.log(`Found ${pageIds.length} searchable pages from official API`)
    return pageIds
    
  } catch (error) {
    console.error('Error querying official API:', error)
    return []
  }
}

/**
 * ページのプロパティを公式APIで取得
 */
export async function getPagePropertiesFromOfficialAPI(pageId: string): Promise<any> {
  try {
    const notionApiKey = process.env.NOTION_SEARCH_API_SECRET || process.env.NOTION_API_SECRET || process.env.NOTION_API_KEY
    if (!notionApiKey) {
      console.log('No Notion API key found in environment variables')
      return null
    }

    // ハイフン付きのページIDに変換
    const formattedPageId = pageId.replace(
      /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
      '$1-$2-$3-$4-$5'
    )

    const response = await fetch(`https://api.notion.com/v1/pages/${formattedPageId}`, {
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28'
      }
    })

    if (!response.ok) {
      console.error('Failed to get page properties:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.properties
    
  } catch (error) {
    console.error('Error getting page properties:', error)
    return null
  }
}