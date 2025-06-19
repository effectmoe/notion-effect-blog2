// Node.js script to investigate linked database issues
const { NotionAPI } = require('notion-client');
const fs = require('fs');
const path = require('path');

// Initialize NotionAPI
const notion = new NotionAPI();

// Page ID to investigate - taken from site.config.ts
const pageId = '5e8a4bdb88ce4cedbf59b59bb98df3f1';

// Database IDs to investigate
const databases = {
  'Prefecture (Working)': '20fb802cb0c68027945beabe5f521e5a',
  'FAQ Master (Not Working)': '212b802cb0c680b3b04afec4203ee8d7',
  'Cafe Kinesi Lovers Gallery': '20fb802cb0c68057a57dcaa1e1172c0c',
  'Cafe Kinesi Lovers List': '215b802cb0c6804a8858d72d4df6f128'
};

async function investigateDatabase(name, blockId) {
  console.log(`\n=== Investigating ${name} ===`);
  console.log(`Block ID: ${blockId}`);
  
  try {
    // Fetch the block data
    const recordMap = await notion.getPage(blockId);
    
    // Check if block exists in recordMap
    const block = recordMap.block[blockId]?.value;
    if (!block) {
      console.log('❌ Block not found in recordMap');
      return;
    }
    
    console.log(`✅ Block found in recordMap`);
    console.log(`  Type: ${block.type}`);
    console.log(`  Has collection_id: ${!!block.collection_id}`);
    console.log(`  Has view_ids: ${!!block.view_ids}`);
    
    // For collection_view blocks
    if (block.type === 'collection_view' || block.type === 'collection_view_page') {
      console.log(`  View count: ${block.view_ids?.length || 0}`);
      
      // Check if it's a linked database
      const isLinkedDatabase = !block.collection_id && !!block.view_ids?.length;
      console.log(`  Database type: ${isLinkedDatabase ? 'LINKED DATABASE' : 'REGULAR DATABASE'}`);
      
      // Try to find collection ID
      let collectionId = block.collection_id;
      let collectionSource = 'direct';
      
      if (!collectionId && block.view_ids?.length > 0) {
        // Check views for collection pointer
        for (const viewId of block.view_ids) {
          const view = recordMap.collection_view?.[viewId]?.value;
          if (view?.format?.collection_pointer?.id) {
            collectionId = view.format.collection_pointer.id;
            collectionSource = 'view.format.collection_pointer';
            break;
          }
        }
      }
      
      console.log(`  Resolved collection_id: ${collectionId || 'NOT FOUND'}`);
      console.log(`  Collection source: ${collectionSource}`);
      
      // Check views for grouping
      if (block.view_ids?.length > 0) {
        console.log('\n  Views:');
        for (const viewId of block.view_ids) {
          const view = recordMap.collection_view?.[viewId]?.value;
          if (view) {
            console.log(`    ${viewId}:`);
            console.log(`      Type: ${view.type}`);
            console.log(`      Has query2: ${!!view.query2}`);
            console.log(`      Has group_by: ${!!view.query2?.group_by}`);
            if (view.query2?.group_by) {
              console.log(`      Group by property: ${view.query2.group_by.property}`);
            }
          }
        }
      }
      
      // Check if collection data exists
      if (collectionId) {
        const collection = recordMap.collection?.[collectionId]?.value;
        console.log(`\n  Collection data exists: ${!!collection}`);
        if (collection) {
          console.log(`  Collection name: ${collection.name?.[0]?.[0] || 'Unnamed'}`);
          console.log(`  Schema properties: ${Object.keys(collection.schema || {}).length}`);
        }
      }
    }
    
    // Save raw data for analysis
    const outputDir = path.join(__dirname, 'database-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const filename = path.join(outputDir, `${name.replace(/[^a-z0-9]/gi, '_')}_${blockId}.json`);
    fs.writeFileSync(filename, JSON.stringify({
      name,
      blockId,
      block: recordMap.block[blockId],
      relatedViews: block.view_ids?.map(vid => recordMap.collection_view?.[vid]),
      collection: block.collection_id ? recordMap.collection?.[block.collection_id] : null
    }, null, 2));
    
    console.log(`\n  📁 Data saved to: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Error investigating ${name}:`, error.message);
  }
}

async function investigatePage() {
  console.log(`📄 Fetching page data for: ${pageId}\n`);
  
  try {
    // Fetch the entire page
    const pageRecordMap = await notion.getPage(pageId);
    
    console.log('📊 Page Record Map Summary:');
    console.log(`  Total blocks: ${Object.keys(pageRecordMap.block || {}).length}`);
    console.log(`  Total collections: ${Object.keys(pageRecordMap.collection || {}).length}`);
    console.log(`  Total collection views: ${Object.keys(pageRecordMap.collection_view || {}).length}`);
    
    // Find all collection_view blocks
    const collectionViewBlocks = [];
    Object.entries(pageRecordMap.block || {}).forEach(([blockId, blockData]) => {
      const block = blockData?.value;
      if (block && (block.type === 'collection_view' || block.type === 'collection_view_page')) {
        collectionViewBlocks.push({ blockId, block });
      }
    });
    
    console.log(`\n🗂️ Found ${collectionViewBlocks.length} collection view blocks:\n`);
    
    // Analyze each collection view
    for (const { blockId, block } of collectionViewBlocks) {
      console.log(`Block ID: ${blockId}`);
      
      // Try to get collection name
      let collectionName = 'Unknown';
      const collectionId = block.collection_id;
      if (collectionId && pageRecordMap.collection?.[collectionId]) {
        const collection = pageRecordMap.collection[collectionId].value;
        collectionName = collection.name?.[0]?.[0] || 'Unnamed';
      }
      
      console.log(`  Name: ${collectionName}`);
      console.log(`  Type: ${block.type}`);
      console.log(`  Has direct collection_id: ${!!block.collection_id}`);
      console.log(`  View count: ${block.view_ids?.length || 0}`);
      
      // Check if any of our target databases
      const targetName = Object.entries(databases).find(([name, id]) => id === blockId)?.[0];
      if (targetName) {
        console.log(`  ⭐ This is: ${targetName}`);
      }
      
      console.log('');
    }
    
    // Now investigate specific databases
    console.log('\n' + '='.repeat(50));
    console.log('\n🔍 Detailed Database Investigation:\n');
    
    for (const [name, blockId] of Object.entries(databases)) {
      // Look for the block in the page record map
      const block = pageRecordMap.block[blockId]?.value;
      if (block) {
        console.log(`✅ ${name} found in page recordMap`);
        await investigateDatabase(name, blockId);
      } else {
        console.log(`❌ ${name} NOT found in page recordMap`);
      }
      console.log('\n' + '='.repeat(50));
    }
    
    // Save the page structure for analysis
    const outputDir = path.join(__dirname, 'database-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const pageStructure = {
      pageId,
      totalBlocks: Object.keys(pageRecordMap.block || {}).length,
      collectionViewBlocks: collectionViewBlocks.map(({ blockId, block }) => ({
        blockId,
        type: block.type,
        hasCollectionId: !!block.collection_id,
        viewCount: block.view_ids?.length || 0
      }))
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'page-structure.json'),
      JSON.stringify(pageStructure, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Error fetching page:', error.message);
  }
}

async function main() {
  console.log('🔍 Starting Linked Database Investigation...\n');
  
  // First investigate the page
  await investigatePage();
  
  console.log('\n✅ Investigation complete!');
  console.log('Check the database-analysis folder for detailed JSON files.');
}

// Run the investigation
main().catch(console.error);