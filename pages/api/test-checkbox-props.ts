import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get a specific page with collection data
    const pageId = '1ceb802cb0c680f29369dba86095fb38'
    const pageData = await notion.getPage(pageId)
    
    // Extract collection information
    const collections = Object.entries(pageData.collection || {})
    const collectionViews = Object.entries(pageData.collection_view || {})
    
    // Get the first collection
    const firstCollection = collections[0]
    const firstView = collectionViews[0]
    
    let checkboxData = null
    
    if (firstCollection && firstView) {
      const [collectionId, collectionData] = firstCollection
      const [viewId, viewData] = firstView
      
      // Get collection data with items
      const collectionResult = await notion.getCollectionData(
        collectionId,
        viewId,
        { limit: 10 }
      )
      
      // Check for checkbox properties in the schema
      const schema = collectionData.value?.schema || {}
      const checkboxProps = Object.entries(schema).filter(([_, prop]: [string, any]) => 
        prop.type === 'checkbox'
      )
      
      // Get sample items with checkbox values
      const items = []
      if (collectionResult.result?.blockIds) {
        for (const blockId of collectionResult.result.blockIds.slice(0, 5)) {
          const block = collectionResult.recordMap?.block?.[blockId]?.value
          if (block) {
            const item = {
              id: blockId,
              title: block.properties?.title?.[0]?.[0] || 'Untitled',
              checkboxProperties: {}
            }
            
            // Extract checkbox property values
            for (const [propId, propSchema] of checkboxProps) {
              const propValue = block.properties?.[propId]
              item.checkboxProperties[propSchema.name || propId] = {
                id: propId,
                value: propValue?.[0]?.[0],
                rawValue: propValue
              }
            }
            
            items.push(item)
          }
        }
      }
      
      checkboxData = {
        collectionId,
        collectionName: collectionData.value?.name?.[0]?.[0] || 'Unnamed',
        checkboxProperties: checkboxProps.map(([id, schema]) => ({
          id,
          name: schema.name,
          type: schema.type
        })),
        sampleItems: items
      }
    }
    
    res.status(200).json({
      success: true,
      pageId,
      collectionsFound: collections.length,
      viewsFound: collectionViews.length,
      checkboxData
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}