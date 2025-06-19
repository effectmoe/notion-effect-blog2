import { NotionAPI } from 'notion-client';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const notion = new NotionAPI({
  authToken: process.env.NOTION_API_SECRET,
  activeUser: process.env.NOTION_ACTIVE_USER,
  userTimeZone: 'Asia/Tokyo'
});

async function analyzeFAQStructure() {
  try {
    const cafeKinesiPageId = '1ceb802cb0c680f29369dba86095fb38';
    const faqCollectionId = '212b802c-b0c6-8046-b4ee-000b2833619c';
    const linkedViewBlockId = '213b802cb0c680ea91c9e30f610943da';
    
    console.log('📋 Analyzing FAQ Structure in CafeKinesi Page\n');
    console.log('Page ID:', cafeKinesiPageId);
    console.log('FAQ Collection ID:', faqCollectionId);
    console.log('Linked View Block ID:', linkedViewBlockId);
    console.log('\n==========================================\n');
    
    // Fetch the page with all options
    const recordMap = await notion.getPage(cafeKinesiPageId, {
      fetchMissingBlocks: true,
      fetchCollections: true,
      signFileUrls: false,
      chunkLimit: 500,
      gotOptions: {
        timeout: 30000
      }
    });
    
    const faqAnalysis = {
      pageId: cafeKinesiPageId,
      timestamp: new Date().toISOString(),
      faqRelatedBlocks: [],
      collections: {},
      collectionViews: {},
      summary: {}
    };
    
    // 1. Find all FAQ-related blocks
    console.log('1️⃣ Searching for FAQ-related blocks...\n');
    
    Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
      const block = blockData.value;
      if (!block) return;
      
      const blockInfo = {
        id: blockId,
        type: block.type,
        properties: {},
        faqRelated: false,
        reasons: []
      };
      
      // Check various FAQ indicators
      if (blockId === linkedViewBlockId) {
        blockInfo.faqRelated = true;
        blockInfo.reasons.push('Linked database view block ID');
      }
      
      if (block.collection_id === faqCollectionId) {
        blockInfo.faqRelated = true;
        blockInfo.reasons.push('References FAQ collection');
        blockInfo.properties.collection_id = block.collection_id;
      }
      
      if (block.type === 'collection_view' || block.type === 'collection_view_page') {
        blockInfo.properties.collection_id = block.collection_id;
        blockInfo.properties.view_ids = block.view_ids;
        
        // Check collection name
        const collection = recordMap.collection?.[block.collection_id]?.value;
        if (collection) {
          const collectionName = collection.name?.[0]?.[0] || '';
          blockInfo.properties.collection_name = collectionName;
          
          if (collectionName.includes('FAQ') || collectionName.includes('よくある')) {
            blockInfo.faqRelated = true;
            blockInfo.reasons.push(`Collection name contains FAQ: "${collectionName}"`);
          }
        }
      }
      
      // Check format.collection_pointer
      if (block.format?.collection_pointer?.id === faqCollectionId) {
        blockInfo.faqRelated = true;
        blockInfo.reasons.push('format.collection_pointer points to FAQ collection');
        blockInfo.properties.format_collection_pointer = block.format.collection_pointer;
      }
      
      // Check if block title contains FAQ
      if (block.properties?.title) {
        const title = block.properties.title[0]?.[0] || '';
        if (title.includes('FAQ') || title.includes('よくある')) {
          blockInfo.faqRelated = true;
          blockInfo.reasons.push(`Title contains FAQ: "${title}"`);
          blockInfo.properties.title = title;
        }
      }
      
      if (blockInfo.faqRelated) {
        blockInfo.properties.parent_id = block.parent_id;
        blockInfo.properties.parent_table = block.parent_table;
        faqAnalysis.faqRelatedBlocks.push(blockInfo);
      }
    });
    
    console.log(`Found ${faqAnalysis.faqRelatedBlocks.length} FAQ-related blocks\n`);
    
    // 2. Analyze FAQ collection
    console.log('2️⃣ Analyzing FAQ Collection...\n');
    
    const faqCollection = recordMap.collection?.[faqCollectionId];
    if (faqCollection?.value) {
      faqAnalysis.collections[faqCollectionId] = {
        name: faqCollection.value.name?.[0]?.[0] || 'Untitled',
        parent_id: faqCollection.value.parent_id,
        schema: Object.entries(faqCollection.value.schema || {}).map(([id, prop]) => ({
          id,
          name: prop.name,
          type: prop.type
        }))
      };
      console.log(`✅ Found FAQ collection: ${faqAnalysis.collections[faqCollectionId].name}`);
    } else {
      console.log('❌ FAQ collection not found in recordMap');
    }
    
    // 3. Analyze collection views
    console.log('\n3️⃣ Analyzing Collection Views...\n');
    
    Object.entries(recordMap.collection_view || {}).forEach(([viewId, viewData]) => {
      const view = viewData.value;
      if (!view || view.collection_id !== faqCollectionId) return;
      
      faqAnalysis.collectionViews[viewId] = {
        type: view.type,
        name: view.name || 'Untitled',
        parent_id: view.parent_id,
        hasFilter: !!(view.format?.filter),
        filter: view.format?.filter || null
      };
      
      console.log(`✅ Found FAQ view: ${viewId} (${view.type})`);
    });
    
    // 4. Check for linked database view block
    console.log('\n4️⃣ Checking for linked database view block...\n');
    
    const linkedBlock = recordMap.block[linkedViewBlockId];
    if (linkedBlock?.value) {
      console.log('✅ Linked database view block EXISTS in recordMap!');
      console.log('Properties:', JSON.stringify(linkedBlock.value, null, 2));
    } else {
      console.log('❌ Linked database view block NOT found in recordMap');
      
      // Check if it's referenced anywhere
      let foundReference = false;
      Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
        const block = blockData.value;
        if (block?.content && Array.isArray(block.content)) {
          if (block.content.includes(linkedViewBlockId)) {
            console.log(`Found reference in block ${blockId} (${block.type})`);
            foundReference = true;
          }
        }
      });
      
      if (!foundReference) {
        console.log('No references to linked view block found');
      }
    }
    
    // 5. Summary
    faqAnalysis.summary = {
      totalBlocks: Object.keys(recordMap.block || {}).length,
      faqRelatedBlocks: faqAnalysis.faqRelatedBlocks.length,
      hasCollection: !!faqCollection?.value,
      collectionViews: Object.keys(faqAnalysis.collectionViews).length,
      hasLinkedViewBlock: !!linkedBlock?.value,
      collectionQueryHasResults: !!(recordMap.collection_query?.[faqCollectionId]?.collection_group_results?.blockIds?.length)
    };
    
    console.log('\n\n📊 Summary:');
    console.log(JSON.stringify(faqAnalysis.summary, null, 2));
    
    // Save detailed analysis
    fs.writeFileSync(
      'faq-structure-analysis.json',
      JSON.stringify(faqAnalysis, null, 2)
    );
    
    console.log('\n\n✅ Detailed analysis saved to faq-structure-analysis.json');
    
    // Print FAQ-related blocks details
    console.log('\n\n📦 FAQ-Related Blocks Details:');
    faqAnalysis.faqRelatedBlocks.forEach((block, index) => {
      console.log(`\n${index + 1}. Block ${block.id}`);
      console.log(`   Type: ${block.type}`);
      console.log(`   Reasons: ${block.reasons.join(', ')}`);
      console.log(`   Properties:`, JSON.stringify(block.properties, null, 2));
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the analysis
analyzeFAQStructure();