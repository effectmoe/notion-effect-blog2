// ページ内のすべてのコレクションを調査するスクリプト
import { NotionAPI } from 'notion-client';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function debugPageCollections() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // CafeKinesiページのID
    const pageId = '1ceb802cb0c680f29369dba86095fb38';
    
    console.log('📋 Fetching CafeKinesi page:', pageId);
    console.log('==========================================\n');
    
    const recordMap = await notion.getPage(pageId);
    
    // ページの基本情報
    const page = recordMap.block[pageId]?.value;
    if (page) {
      console.log('Page Info:');
      console.log('- Title:', page.properties?.title?.[0]?.[0] || 'Untitled');
      console.log('- Type:', page.type);
      console.log('- Created:', new Date(page.created_time).toLocaleString());
      console.log('- Last Edited:', new Date(page.last_edited_time).toLocaleString());
    }
    
    // すべてのコレクションを確認
    console.log('\n\n📊 Collections in recordMap:');
    const collections = Object.entries(recordMap.collection || {});
    console.log('Total collections:', collections.length);
    
    collections.forEach(([collectionId, collectionData]) => {
      const collection = collectionData.value;
      const name = collection?.name?.[0]?.[0] || 'Untitled';
      
      console.log(`\n\nCollection: ${name}`);
      console.log('- ID:', collectionId);
      console.log('- Parent ID:', collection?.parent_id);
      console.log('- Schema properties:', Object.keys(collection?.schema || {}).length);
      
      // スキーマの詳細
      if (collection?.schema) {
        console.log('\nSchema:');
        Object.entries(collection.schema).forEach(([propId, prop]) => {
          console.log(`  - ${prop.name} (${prop.type})`);
        });
      }
    });
    
    // すべてのコレクションビューを確認
    console.log('\n\n👁️  Collection Views:');
    const collectionViews = Object.entries(recordMap.collection_view || {});
    console.log('Total views:', collectionViews.length);
    
    collectionViews.forEach(([viewId, viewData]) => {
      const view = viewData.value;
      console.log(`\n\nView: ${viewId}`);
      console.log('- Type:', view?.type);
      console.log('- Name:', view?.name);
      console.log('- Collection ID:', view?.collection_id);
      console.log('- Parent ID:', view?.parent_id);
      
      // コレクション名を取得
      if (view?.collection_id) {
        const collection = recordMap.collection?.[view.collection_id]?.value;
        const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
        console.log('- Collection Name:', collectionName);
      }
    });
    
    // ページ内のブロックを確認（リンクドデータベースを探す）
    console.log('\n\n🔗 Checking for linked databases in page blocks:');
    const pageBlocks = Object.entries(recordMap.block || {});
    let linkedDatabaseCount = 0;
    
    pageBlocks.forEach(([blockId, blockData]) => {
      const block = blockData.value;
      
      // collection_viewタイプのブロックを探す
      if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
        linkedDatabaseCount++;
        console.log(`\n\nLinked Database Block ${linkedDatabaseCount}:`);
        console.log('- Block ID:', blockId);
        console.log('- Type:', block.type);
        console.log('- Collection ID:', block.collection_id);
        console.log('- View IDs:', block.view_ids);
        
        // コレクションの詳細を取得
        if (block.collection_id) {
          const collection = recordMap.collection?.[block.collection_id]?.value;
          const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
          console.log('- Collection Name:', collectionName);
          
          // FAQデータベースの特定
          if (collectionName.includes('FAQ') || collectionName.includes('よくある')) {
            console.log('  ⭐ This is the FAQ database!');
            console.log('  - Master Database ID:', block.collection_id);
            console.log('  - Linked View IDs:', block.view_ids);
          }
        }
      }
    });
    
    // FAQマスターデータベースのIDを探す
    console.log('\n\n🔍 Searching for FAQ Master Database ID:');
    const faqMasterDatabaseId = '212b802cb0c680eab7edef4459f38819';
    
    // コレクション内を検索
    const faqInCollections = collections.find(([id]) => id === faqMasterDatabaseId);
    if (faqInCollections) {
      console.log('✅ FAQ Master found in collections!');
      const collection = faqInCollections[1].value;
      console.log('- Name:', collection?.name?.[0]?.[0]);
    } else {
      console.log('❌ FAQ Master NOT found in collections');
    }
    
    // 結果を保存
    fs.writeFileSync(
      'page-collections-debug.json',
      JSON.stringify({
        pageId,
        collections: collections.map(([id, data]) => ({
          id,
          name: data.value?.name?.[0]?.[0],
          parentId: data.value?.parent_id
        })),
        collectionViews: collectionViews.map(([id, data]) => ({
          id,
          type: data.value?.type,
          collectionId: data.value?.collection_id
        })),
        linkedDatabases: pageBlocks.filter(([_, block]) => 
          block.value?.type === 'collection_view' || 
          block.value?.type === 'collection_view_page'
        ).map(([id, block]) => ({
          blockId: id,
          collectionId: block.value?.collection_id,
          viewIds: block.value?.view_ids
        }))
      }, null, 2)
    );
    
    console.log('\n\n✅ Debug data saved to page-collections-debug.json');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// 実行
console.log('CafeKinesiページ内のコレクション調査');
console.log('==========================================\n');
debugPageCollections();