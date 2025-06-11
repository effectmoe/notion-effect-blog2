import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the root page with collection
    const rootPageId = '1ceb802cb0c680f29369dba86095fb38'
    const rootPage = await notion.getPage(rootPageId)
    
    // Find the カフェキネシコンテンツ collection
    const collections = Object.entries(rootPage.collection || {})
    const targetCollection = collections.find(([_, data]) => 
      data.value?.name?.[0]?.[0]?.includes('カフェキネシコンテンツ')
    )
    
    if (!targetCollection) {
      return res.status(404).json({ error: 'Collection not found' })
    }
    
    const [collectionId, collectionData] = targetCollection
    
    // Get the schema to identify checkbox properties
    const schema = collectionData.value?.schema || {}
    const checkboxProperties = Object.entries(schema).filter(([_, prop]: [string, any]) => 
      prop.type === 'checkbox'
    ).map(([id, prop]) => ({
      id,
      name: prop.name,
      type: prop.type
    }))
    
    // Find the first collection view
    const collectionViews = Object.entries(rootPage.collection_view || {})
    const firstView = collectionViews.find(([_, view]) => 
      (view.value as any)?.collection_id === collectionId
    )
    
    if (!firstView) {
      return res.status(404).json({ error: 'Collection view not found' })
    }
    
    const [viewId] = firstView
    
    // Get collection data with items
    const collectionResult = await notion.getCollectionData(
      collectionId,
      viewId,
      { limit: 20 }
    )
    
    // Process items to extract checkbox values
    const items = []
    if (collectionResult.result?.blockIds) {
      for (const blockId of collectionResult.result.blockIds) {
        const block = collectionResult.recordMap?.block?.[blockId]?.value
        if (block) {
          const properties = block.properties || {}
          const item = {
            id: blockId,
            title: properties.title?.[0]?.[0] || 'Untitled',
            checkboxes: {}
          }
          
          // Extract all checkbox values
          checkboxProperties.forEach(({ id, name }) => {
            const value = properties[id]?.[0]?.[0]
            item.checkboxes[name] = {
              propertyId: id,
              value: value,
              isChecked: value === 'Yes' || value === true || value === '✓'
            }
          })
          
          items.push(item)
        }
      }
    }
    
    // Summary statistics
    const stats = {
      totalItems: items.length,
      searchableItems: items.filter(item => item.checkboxes['Searchable']?.isChecked).length,
      publicItems: items.filter(item => item.checkboxes['Public']?.isChecked).length,
      featuredItems: items.filter(item => item.checkboxes['Featured']?.isChecked).length,
      menuItems: items.filter(item => item.checkboxes['Menu']?.isChecked).length
    }
    
    res.status(200).json({
      success: true,
      collectionId,
      collectionName: collectionData.value?.name?.[0]?.[0],
      checkboxProperties,
      stats,
      items: items.slice(0, 10) // Return first 10 items for brevity
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