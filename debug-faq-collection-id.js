// Debug script to investigate FAQ Master collection_id issue
import { NotionAPI } from 'notion-client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function debugFAQCollectionId() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // CafeKinesiページのID
    const pageId = '1ceb802cb0c680f29369dba86095fb38';
    
    console.log('📋 Fetching CafeKinesi page to analyze FAQ Master block');
    console.log('==========================================\n');
    
    const recordMap = await notion.getPage(pageId);
    
    // FAQ Master block ID
    const faqMasterBlockId = '212b802c-b0c6-80be-aa3a-e91428cbde58';
    
    // Get the specific block
    const faqMasterBlock = recordMap.block[faqMasterBlockId]?.value;
    
    if (!faqMasterBlock) {
      console.log('❌ FAQ Master block not found in recordMap!');
      return;
    }
    
    console.log('✅ Found FAQ Master block:');
    console.log('Block structure:', JSON.stringify(faqMasterBlock, null, 2));
    
    // Check for collection_id in different places
    console.log('\n🔍 Checking for collection_id:');
    console.log('1. Direct collection_id:', faqMasterBlock.collection_id);
    console.log('2. format.collection_pointer:', faqMasterBlock.format?.collection_pointer);
    console.log('3. View IDs:', faqMasterBlock.view_ids);
    
    // Check the collection_view
    if (faqMasterBlock.view_ids?.length > 0) {
      const viewId = faqMasterBlock.view_ids[0];
      const collectionView = recordMap.collection_view?.[viewId]?.value;
      
      console.log('\n📊 Collection View analysis:');
      console.log('View ID:', viewId);
      console.log('View exists:', !!collectionView);
      
      if (collectionView) {
        console.log('View structure:', JSON.stringify(collectionView, null, 2));
        console.log('\nView format.collection_pointer:', collectionView.format?.collection_pointer);
      }
    }
    
    // Compare with other collection_view blocks
    console.log('\n\n📊 Comparing with other collection_view blocks:');
    
    // カフェキネシコンテンツ block
    const contentBlockId = '20db802c-b0c6-80e2-93d4-fc46bf2dd823';
    const contentBlock = recordMap.block[contentBlockId]?.value;
    
    if (contentBlock) {
      console.log('\nカフェキネシコンテンツ block:');
      console.log('Block structure:', JSON.stringify(contentBlock, null, 2));
      console.log('Direct collection_id:', contentBlock.collection_id);
      console.log('format.collection_pointer:', contentBlock.format?.collection_pointer);
    }
    
    // Check if FAQ Master collection exists in recordMap
    console.log('\n\n🔍 Searching for FAQ Master collection:');
    const possibleCollectionIds = [
      '212b802c-b0c6-80ea-b7ed-ef4459f38819', // From debug script
      '212b802c-b0c6-80ff-9c41-000cec7d8204', // View ID
    ];
    
    possibleCollectionIds.forEach(id => {
      const collection = recordMap.collection?.[id]?.value;
      if (collection) {
        console.log(`\n✅ Found collection ${id}:`, collection.name?.[0]?.[0]);
      } else {
        console.log(`\n❌ Collection ${id} not found in recordMap`);
      }
    });
    
    // List all collections in recordMap
    console.log('\n\n📋 All collections in recordMap:');
    Object.entries(recordMap.collection || {}).forEach(([id, data]) => {
      const collection = data.value;
      console.log(`- ${id}: ${collection?.name?.[0]?.[0] || 'Untitled'}`);
    });
    
    // Save detailed debug data
    fs.writeFileSync(
      'faq-collection-id-debug.json',
      JSON.stringify({
        faqMasterBlock,
        contentBlock,
        collections: Object.keys(recordMap.collection || {}),
        collectionViews: Object.keys(recordMap.collection_view || {})
      }, null, 2)
    );
    
    console.log('\n\n✅ Debug data saved to faq-collection-id-debug.json');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the debug script
console.log('FAQ Master collection_id 調査');
console.log('==========================================\n');
debugFAQCollectionId();