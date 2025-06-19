import { NotionAPI } from 'notion-client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const notion = new NotionAPI({
  authToken: process.env.NOTION_API_SECRET,
  activeUser: process.env.NOTION_ACTIVE_USER,
  userTimeZone: 'Asia/Tokyo'
});

async function searchFAQBlocks() {
  try {
    // CafeKinesiページのID
    const pageId = '1ceb802cb0c680f29369dba86095fb38';
    
    console.log('🔍 Searching for FAQ-related blocks in CafeKinesi page...\n');
    
    const recordMap = await notion.getPage(pageId, {
      fetchMissingBlocks: true,
      fetchCollections: true,
      signFileUrls: false,
      chunkLimit: 500
    });
    
    // Known FAQ-related IDs
    const knownFAQIds = {
      collection: '212b802c-b0c6-8046-b4ee-000b2833619c',
      linkedDatabaseView: '213b802cb0c680ea91c9e30f610943da',
      masterBlock: '212b802c-b0c6-80be-aa3a-e91428cbde58'
    };
    
    console.log('Known FAQ IDs:');
    console.log('- FAQ Collection ID:', knownFAQIds.collection);
    console.log('- Linked Database View ID:', knownFAQIds.linkedDatabaseView);
    console.log('- Master Block ID:', knownFAQIds.masterBlock);
    console.log('\n========================================\n');
    
    // Search through all blocks
    const faqRelatedBlocks = [];
    
    console.log('📦 Searching through blocks...\n');
    Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
      const block = blockData.value;
      if (!block) return;
      
      // Check if block is FAQ-related
      let isFAQRelated = false;
      const reasons = [];
      
      // Check if it's one of the known FAQ blocks
      if (Object.values(knownFAQIds).includes(blockId)) {
        isFAQRelated = true;
        reasons.push('Known FAQ block');
      }
      
      // Check if it references the FAQ collection
      if (block.collection_id === knownFAQIds.collection) {
        isFAQRelated = true;
        reasons.push('References FAQ collection');
      }
      
      // Check if it's a collection_view type
      if (block.type === 'collection_view' || block.type === 'collection_view_page') {
        // Get collection info
        const collectionId = block.collection_id;
        const collection = recordMap.collection?.[collectionId]?.value;
        const collectionName = collection?.name?.[0]?.[0] || '';
        
        if (collectionName.includes('FAQ') || collectionName.includes('よくある')) {
          isFAQRelated = true;
          reasons.push(`Collection name contains FAQ: "${collectionName}"`);
        }
      }
      
      // Check format.collection_pointer
      if (block.format?.collection_pointer?.id === knownFAQIds.collection) {
        isFAQRelated = true;
        reasons.push('format.collection_pointer points to FAQ collection');
      }
      
      if (isFAQRelated) {
        faqRelatedBlocks.push({
          blockId,
          type: block.type,
          collection_id: block.collection_id,
          view_ids: block.view_ids,
          format_collection_pointer: block.format?.collection_pointer,
          parent_id: block.parent_id,
          reasons
        });
      }
    });
    
    console.log(`\n✅ Found ${faqRelatedBlocks.length} FAQ-related blocks:\n`);
    
    faqRelatedBlocks.forEach((block, index) => {
      console.log(`\n${index + 1}. Block ID: ${block.blockId}`);
      console.log(`   Type: ${block.type}`);
      console.log(`   Collection ID: ${block.collection_id || 'N/A'}`);
      console.log(`   View IDs: ${block.view_ids ? JSON.stringify(block.view_ids) : 'N/A'}`);
      console.log(`   Parent ID: ${block.parent_id || 'N/A'}`);
      console.log(`   Reasons: ${block.reasons.join(', ')}`);
      
      if (block.format_collection_pointer) {
        console.log(`   Format Collection Pointer: ${JSON.stringify(block.format_collection_pointer)}`);
      }
      
      // Get additional info for collection_view blocks
      if ((block.type === 'collection_view' || block.type === 'collection_view_page') && block.collection_id) {
        const collection = recordMap.collection?.[block.collection_id]?.value;
        if (collection) {
          console.log(`   Collection Name: ${collection.name?.[0]?.[0] || 'Untitled'}`);
          console.log(`   Collection Parent: ${collection.parent_id}`);
        }
      }
    });
    
    // Check for the specific linked database view block
    console.log('\n\n🔎 Checking for linked database view block:', knownFAQIds.linkedDatabaseView);
    const linkedViewBlock = recordMap.block[knownFAQIds.linkedDatabaseView];
    if (linkedViewBlock) {
      console.log('✅ Found linked database view block!');
      console.log('Details:', JSON.stringify(linkedViewBlock.value, null, 2));
    } else {
      console.log('❌ Linked database view block NOT found in recordMap');
    }
    
    // Check collections
    console.log('\n\n📊 FAQ Collections in recordMap:');
    Object.entries(recordMap.collection || {}).forEach(([collectionId, collectionData]) => {
      const collection = collectionData.value;
      if (!collection) return;
      
      const name = collection.name?.[0]?.[0] || '';
      if (name.includes('FAQ') || name.includes('よくある') || collectionId === knownFAQIds.collection) {
        console.log(`\nCollection ID: ${collectionId}`);
        console.log(`Name: ${name}`);
        console.log(`Parent ID: ${collection.parent_id}`);
        console.log(`Schema properties: ${Object.keys(collection.schema || {}).length}`);
      }
    });
    
    // Check collection views
    console.log('\n\n👁️ FAQ Collection Views:');
    Object.entries(recordMap.collection_view || {}).forEach(([viewId, viewData]) => {
      const view = viewData.value;
      if (!view) return;
      
      if (view.collection_id === knownFAQIds.collection) {
        console.log(`\nView ID: ${viewId}`);
        console.log(`Type: ${view.type}`);
        console.log(`Name: ${view.name || 'Untitled'}`);
        console.log(`Has filter: ${!!(view.format?.filter)}`);
        if (view.format?.filter) {
          console.log(`Filter: ${JSON.stringify(view.format.filter, null, 2)}`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the search
searchFAQBlocks();