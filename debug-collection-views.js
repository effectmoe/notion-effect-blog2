import { NotionAPI } from 'notion-client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function debugCollectionViews() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  })
  
  try {
    const pageId = '1ceb802cb0c680f29369dba86095fb38'
    console.log('📋 Fetching page data...')
    
    const recordMap = await notion.getPage(pageId)
    
    // Test blocks
    const testBlocks = [
      { id: '212b802c-b0c6-80be-aa3a-e91428cbde58', name: 'FAQ Master (No collection_id)' },
      { id: '20db802c-b0c6-80e2-93d4-fc46bf2dd823', name: 'カフェキネシコンテンツ (Has collection_id)' }
    ]
    
    const results = []
    
    for (const testBlock of testBlocks) {
      const block = recordMap.block[testBlock.id]?.value
      if (!block) {
        console.log(`❌ Block ${testBlock.id} not found`)
        continue
      }
      
      console.log(`\n📊 Analyzing ${testBlock.name}:`)
      console.log('Block type:', block.type)
      console.log('Has collection_id:', !!block.collection_id)
      console.log('View IDs:', block.view_ids)
      
      const result = {
        blockId: testBlock.id,
        name: testBlock.name,
        hasCollectionId: !!block.collection_id,
        collectionId: block.collection_id,
        viewIds: block.view_ids,
        views: []
      }
      
      // Check views
      if (block.view_ids) {
        for (const viewId of block.view_ids) {
          const view = recordMap.collection_view?.[viewId]?.value
          if (view) {
            console.log(`  View ${viewId}: type=${view.type}, name=${view.name}`)
            result.views.push({
              id: viewId,
              type: view.type,
              name: view.name,
              hasCollectionPointer: !!view.format?.collection_pointer
            })
          }
        }
      }
      
      // Check if collection exists
      if (block.collection_id) {
        const collection = recordMap.collection?.[block.collection_id]?.value
        if (collection) {
          console.log(`  Collection found: ${collection.name?.[0]?.[0]}`)
          result.collectionName = collection.name?.[0]?.[0]
        }
      }
      
      results.push(result)
    }
    
    // Save results
    fs.writeFileSync(
      'debug-collection-views.json',
      JSON.stringify(results, null, 2)
    )
    
    console.log('\n✅ Debug data saved to debug-collection-views.json')
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

debugCollectionViews()