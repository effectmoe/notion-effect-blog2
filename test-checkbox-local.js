// Test script to check checkbox properties locally
import { NotionAPI } from 'notion-client'

async function testCheckboxProperties() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_TOKEN
  })
  
  try {
    // Get the main page
    const pageId = '1ceb802cb0c680f29369dba86095fb38'
    console.log('Fetching page:', pageId)
    
    const pageData = await notion.getPage(pageId)
    
    // Check for collections
    const collections = Object.entries(pageData.collection || {})
    console.log('\nCollections found:', collections.length)
    
    // Examine the first collection
    if (collections.length > 0) {
      const [collectionId, collectionData] = collections[0]
      console.log('\nFirst collection ID:', collectionId)
      console.log('Collection name:', collectionData.value?.name?.[0]?.[0])
      
      // Check schema for checkbox properties
      const schema = collectionData.value?.schema || {}
      console.log('\nSchema properties:')
      
      Object.entries(schema).forEach(([propId, prop]) => {
        if (prop.type === 'checkbox') {
          console.log(`- Checkbox property: ${prop.name} (ID: ${propId})`)
        }
      })
      
      // Look for the xaH> property specifically
      if (schema['xaH>']) {
        console.log('\nFound xaH> property:', {
          name: schema['xaH>'].name,
          type: schema['xaH>'].type
        })
      }
    }
    
    // Check collection views
    const collectionViews = Object.entries(pageData.collection_view || {})
    console.log('\nCollection views found:', collectionViews.length)
    
    if (collectionViews.length > 0 && collections.length > 0) {
      const [viewId] = collectionViews[0]
      const [collectionId] = collections[0]
      
      console.log('\nFetching collection data...')
      const collectionResult = await notion.getCollectionData(
        collectionId,
        viewId,
        { limit: 5 }
      )
      
      // Check items for checkbox values
      if (collectionResult.result?.blockIds) {
        console.log('\nItems with checkbox values:')
        
        collectionResult.result.blockIds.forEach((blockId, index) => {
          const block = collectionResult.recordMap?.block?.[blockId]?.value
          if (block) {
            const title = block.properties?.title?.[0]?.[0] || 'Untitled'
            const checkboxValue = block.properties?.['xaH>']?.[0]?.[0]
            
            console.log(`${index + 1}. ${title}`)
            console.log(`   Checkbox value (xaH>): ${checkboxValue}`)
            console.log(`   Is searchable: ${checkboxValue === 'Yes' || checkboxValue === true}`)
          }
        })
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message)
    console.error(error.stack)
  }
}

// Run the test
testCheckboxProperties()