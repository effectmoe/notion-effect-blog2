// テストデータベースの詳細を調査するスクリプト
import { NotionAPI } from 'notion-client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debugTestDatabase() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // テストデータベースの情報
    const testDatabaseBlockId = '212b802c-b0c6-80b3-b04a-fec4203ee8d7';
    const testCollectionId = '212b802c-b0c6-8014-9263-000b71bd252e';
    const testViewId = '212b802c-b0c6-8030-bef5-000c8449757e';
    
    console.log('🧪 テストデータベースの調査');
    console.log('==========================================\n');
    console.log('Block ID:', testDatabaseBlockId);
    console.log('Collection ID:', testCollectionId);
    console.log('View ID:', testViewId);
    console.log('\n');
    
    // コレクションビューの内容を取得
    console.log('📊 Fetching collection view content...');
    const collectionData = await notion.getCollectionData(
      testCollectionId,
      testViewId,
      {
        type: 'gallery',
        limit: 100
      }
    );
    
    console.log('\n📝 Collection Info:');
    console.log('- Total items:', collectionData?.result?.total || 0);
    console.log('- Fetched items:', collectionData?.recordMap?.block ? Object.keys(collectionData.recordMap.block).length : 0);
    
    // コレクションのスキーマを確認
    const collection = collectionData?.recordMap?.collection?.[testCollectionId]?.value;
    if (collection) {
      console.log('\n📋 Collection Schema:');
      Object.entries(collection.schema || {}).forEach(([propId, prop]) => {
        console.log(`  - ${prop.name} (${prop.type})`);
      });
    }
    
    // データベース内のアイテムを表示
    console.log('\n📄 Database Items:');
    const blocks = collectionData?.recordMap?.block || {};
    let itemCount = 0;
    
    Object.entries(blocks).forEach(([blockId, blockData]) => {
      const block = blockData.value;
      if (block && block.type === 'page' && block.parent_id === testCollectionId) {
        itemCount++;
        const title = block.properties?.title?.[0]?.[0] || 'Untitled';
        console.log(`\nItem ${itemCount}:`);
        console.log('- ID:', blockId);
        console.log('- Title:', title);
        console.log('- Created:', new Date(block.created_time).toLocaleString());
        console.log('- Last Edited:', new Date(block.last_edited_time).toLocaleString());
        
        // その他のプロパティを表示
        if (block.properties) {
          console.log('- Properties:', Object.keys(block.properties).join(', '));
        }
      }
    });
    
    if (itemCount === 0) {
      console.log('\n❌ No items found in the test database');
    } else {
      console.log(`\n✅ Found ${itemCount} test items in the database`);
    }
    
    // ビューの設定を確認
    const viewData = collectionData?.recordMap?.collection_view?.[testViewId]?.value;
    if (viewData) {
      console.log('\n👁️ View Settings:');
      console.log('- Type:', viewData.type);
      console.log('- Name:', viewData.name || 'Unnamed');
      if (viewData.query2) {
        console.log('- Has filters:', !!viewData.query2.filter);
        console.log('- Has sorts:', !!viewData.query2.sort);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// 実行
debugTestDatabase();