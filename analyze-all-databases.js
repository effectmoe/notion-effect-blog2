import { NotionAPI } from 'notion-client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function analyzeAllDatabases() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  })
  
  try {
    const pageId = '1ceb802cb0c680f29369dba86095fb38'
    console.log('📋 Fetching page data...')
    
    const recordMap = await notion.getPage(pageId)
    
    const databases = []
    
    // Find all collection view blocks
    for (const [blockId, blockData] of Object.entries(recordMap.block)) {
      const block = blockData?.value
      if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
        console.log(`\n📊 Found database: ${blockId}`)
        
        const dbInfo = {
          blockId,
          type: block.type,
          hasCollectionId: !!block.collection_id,
          collectionId: block.collection_id,
          viewIds: block.view_ids || [],
          views: [],
          defaultView: null
        }
        
        // Analyze views
        if (block.view_ids) {
          for (let i = 0; i < block.view_ids.length; i++) {
            const viewId = block.view_ids[i]
            const view = recordMap.collection_view?.[viewId]?.value
            if (view) {
              const viewInfo = {
                id: viewId,
                type: view.type,
                name: view.name,
                isDefault: i === 0
              }
              dbInfo.views.push(viewInfo)
              if (i === 0) {
                dbInfo.defaultView = view.type
              }
              console.log(`  View ${i + 1}: ${view.type} ${i === 0 ? '(default)' : ''}`)
            }
          }
        }
        
        // Get collection name
        if (block.collection_id) {
          const collection = recordMap.collection?.[block.collection_id]?.value
          if (collection) {
            dbInfo.collectionName = collection.name?.[0]?.[0]
            console.log(`  Collection: ${dbInfo.collectionName}`)
          }
        }
        
        databases.push(dbInfo)
      }
    }
    
    // Summary
    console.log('\n📈 Summary:')
    console.log(`Total databases found: ${databases.length}`)
    
    const viewTypeCounts = {}
    databases.forEach(db => {
      if (db.defaultView) {
        viewTypeCounts[db.defaultView] = (viewTypeCounts[db.defaultView] || 0) + 1
      }
    })
    
    console.log('\nDefault view types:')
    for (const [type, count] of Object.entries(viewTypeCounts)) {
      console.log(`  ${type}: ${count}`)
    }
    
    // Save results
    fs.writeFileSync(
      'all-databases-analysis.json',
      JSON.stringify(databases, null, 2)
    )
    
    console.log('\n✅ Analysis saved to all-databases-analysis.json')
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

analyzeAllDatabases()