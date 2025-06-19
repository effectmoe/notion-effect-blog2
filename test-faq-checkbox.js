// FAQデータベースのチェックボックス値をテストするスクリプト
import { NotionAPI } from 'notion-client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testFAQDatabase() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_TOKEN,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // FAQマスターデータベースのID（実際のIDに置き換えてください）
    const databaseId = process.env.FAQ_DATABASE_ID || 'YOUR_FAQ_DATABASE_ID_HERE';
    
    console.log('Fetching FAQ database:', databaseId);
    console.log('==========================================\n');
    
    const recordMap = await notion.getPage(databaseId);
    
    // コレクションを確認
    const collections = Object.entries(recordMap.collection || {});
    console.log('Collections found:', collections.length);
    
    if (collections.length > 0) {
      const [collectionId, collectionData] = collections[0];
      const collection = collectionData.value;
      
      console.log('\nCollection Details:');
      console.log('- ID:', collectionId);
      console.log('- Name:', collection?.name?.[0]?.[0]);
      
      // スキーマを確認
      const schema = collection?.schema || {};
      console.log('\nDatabase Schema:');
      console.log('==========================================');
      
      Object.entries(schema).forEach(([propId, prop]) => {
        console.log(`\nProperty: ${prop.name}`);
        console.log(`- ID: ${propId}`);
        console.log(`- Type: ${prop.type}`);
        
        if (prop.type === 'checkbox') {
          console.log('  ⚠️  This is a CHECKBOX property!');
        }
      });
      
      // コレクションビューを取得
      const collectionViewId = Object.keys(recordMap.collection_view || {})[0];
      
      if (collectionViewId) {
        console.log('\n\nFetching collection data...');
        console.log('==========================================');
        
        const collectionResult = await notion.getCollectionData(
          collectionId,
          collectionViewId,
          {
            limit: 50,
            searchQuery: '',
            userTimeZone: 'Asia/Tokyo'
          }
        );
        
        // アイテムを確認
        if (collectionResult.result?.blockIds) {
          console.log(`\nTotal items found: ${collectionResult.result.blockIds.length}`);
          console.log('\nChecking each item:\n');
          
          let publicCount = 0;
          let privateCount = 0;
          
          collectionResult.result.blockIds.forEach((blockId, index) => {
            const block = collectionResult.recordMap?.block?.[blockId]?.value;
            
            if (block && block.properties) {
              const title = block.properties.title?.[0]?.[0] || 'Untitled';
              
              console.log(`\n${index + 1}. ${title}`);
              console.log(`   ID: ${blockId}`);
              
              // すべてのプロパティを確認
              Object.entries(schema).forEach(([propId, prop]) => {
                const value = block.properties[propId];
                
                if (prop.type === 'checkbox') {
                  const checkboxValue = value?.[0]?.[0];
                  const isChecked = checkboxValue === 'Yes';
                  
                  console.log(`   ${prop.name}: ${isChecked ? '✓ Checked' : '□ Unchecked'} (raw value: ${checkboxValue})`);
                  
                  if (prop.name === '公開') {
                    if (isChecked) {
                      publicCount++;
                    } else {
                      privateCount++;
                    }
                  }
                } else if (value) {
                  console.log(`   ${prop.name}: ${value[0]?.[0] || '(empty)'}`);
                }
              });
            }
          });
          
          console.log('\n==========================================');
          console.log('Summary:');
          console.log(`- Total items: ${collectionResult.result.blockIds.length}`);
          console.log(`- Public items (公開=✓): ${publicCount}`);
          console.log(`- Private items (公開=□): ${privateCount}`);
          console.log('\n⚠️  Note: Only items with 公開=✓ should be displayed on the website');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// テストを実行
console.log('FAQデータベース チェックボックステスト');
console.log('==========================================\n');
testFAQDatabase();
