import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const apiKey = process.env.NOTION_API_SECRET || process.env.NOTION_SEARCH_API_SECRET
    
    if (!apiKey) {
      return res.status(400).json({ error: 'No Notion API key found' })
    }

    // Search for all databases
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database'
        }
      })
    })

    const searchData = await searchResponse.json()
    
    // Test specific database IDs
    const databaseIdsToTest = [
      '1ceb802cb0c6814ab43eddb38e80f2e0',  // From code (no hyphens)
      '1ceb802c-b0c6-814a-b43e-ddb38e80f2e0',  // With hyphens
    ]

    const testResults = []
    
    for (const dbId of databaseIdsToTest) {
      try {
        const response = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Notion-Version': '2022-06-28'
          }
        })

        const data = await response.json()
        
        testResults.push({
          id: dbId,
          found: response.ok,
          title: data.title?.[0]?.plain_text || 'Untitled',
          error: data.error || null
        })
      } catch (error) {
        testResults.push({
          id: dbId,
          found: false,
          error: error.message
        })
      }
    }

    res.status(200).json({
      apiKeyFound: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      databases: searchData.results?.map(db => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
        url: db.url
      })) || [],
      totalDatabases: searchData.results?.length || 0,
      testResults,
      searchError: searchData.error || null
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}