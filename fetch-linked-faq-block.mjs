import { NotionAPI } from 'notion-client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const notion = new NotionAPI({
  authToken: process.env.NOTION_API_SECRET,
  activeUser: process.env.NOTION_ACTIVE_USER,
  userTimeZone: 'Asia/Tokyo'
});

async function fetchLinkedFAQBlock() {
  try {
    // The linked database view block ID
    const linkedBlockId = '213b802cb0c680ea91c9e30f610943da';
    
    console.log('🔍 Fetching linked FAQ database view block directly...\n');
    
    // Try to fetch the block directly
    console.log('Attempting to fetch block:', linkedBlockId);
    const recordMap = await notion.getPage(linkedBlockId, {
      fetchMissingBlocks: true,
      fetchCollections: true,
      signFileUrls: false
    });
    
    // Check if the block exists
    const block = recordMap.block[linkedBlockId];
    if (block && block.value) {
      console.log('\n✅ Found linked database view block!');
      console.log('\nBlock Details:');
      console.log('- ID:', block.value.id);
      console.log('- Type:', block.value.type);
      console.log('- Collection ID:', block.value.collection_id);
      console.log('- View IDs:', block.value.view_ids);
      console.log('- Parent ID:', block.value.parent_id);
      console.log('- Parent Table:', block.value.parent_table);
      console.log('- Space ID:', block.value.space_id);
      
      if (block.value.format) {
        console.log('\nFormat:');
        console.log(JSON.stringify(block.value.format, null, 2));
      }
      
      // Check if this block exists in the CafeKinesi page
      console.log('\n\n🔍 Checking if this block is in CafeKinesi page...');
      const cafeKinesiPageId = '1ceb802cb0c680f29369dba86095fb38';
      const cafeKinesiRecordMap = await notion.getPage(cafeKinesiPageId, {
        fetchMissingBlocks: true,
        fetchCollections: true,
        signFileUrls: false,
        chunkLimit: 500
      });
      
      // Search for the linked block in CafeKinesi page
      const linkedBlockInCafeKinesi = cafeKinesiRecordMap.block[linkedBlockId];
      if (linkedBlockInCafeKinesi) {
        console.log('✅ Block IS present in CafeKinesi page recordMap!');
      } else {
        console.log('❌ Block is NOT in CafeKinesi page recordMap');
        
        // Check if it's referenced in any other blocks
        console.log('\n🔍 Searching for references to this block...');
        let foundReferences = false;
        
        Object.entries(cafeKinesiRecordMap.block || {}).forEach(([blockId, blockData]) => {
          const b = blockData.value;
          if (!b) return;
          
          // Check content for references
          if (b.content && Array.isArray(b.content)) {
            if (b.content.includes(linkedBlockId)) {
              console.log(`\n✅ Found reference in block ${blockId}`);
              console.log(`   Type: ${b.type}`);
              console.log(`   Parent: ${b.parent_id}`);
              foundReferences = true;
            }
          }
        });
        
        if (!foundReferences) {
          console.log('No references found to this block in CafeKinesi page');
        }
      }
      
      // Get the collection info
      if (block.value.collection_id) {
        const collection = recordMap.collection?.[block.value.collection_id]?.value;
        if (collection) {
          console.log('\n\n📊 Collection Info:');
          console.log('- Collection ID:', block.value.collection_id);
          console.log('- Collection Name:', collection.name?.[0]?.[0] || 'Untitled');
          console.log('- Collection Parent:', collection.parent_id);
        }
      }
      
    } else {
      console.log('❌ Could not fetch the linked database view block');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the fetch
fetchLinkedFAQBlock();