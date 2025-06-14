// FAQマスターデータベースのデバッグスクリプト
import { NotionAPI } from 'notion-client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function debugFAQDatabase() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_TOKEN,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // FAQマスターを含むページのID（実際のページIDに置き換えてください）
    const pageId = process.env.NOTION_PAGE_ID || 'YOUR_PAGE_ID_HERE';
    
    console.log('Fetching page with FAQ database:', pageId);
    console.log('==========================================\n');
    
    const recordMap = await notion.getPage(pageId);
    
    // すべてのコレクションビューを確認
    const collectionViews = Object.entries(recordMap.collection_view || {});
    console.log('Total collection views found:', collectionViews.length);
    
    // FAQマスターを探す
    let faqCollectionId = null;
    let faqViewId = null;
    
    for (const [viewId, viewData] of collectionViews) {
      const view = viewData.value;
      const collectionId = view?.collection_id;
      
      if (collectionId) {
        const collection = recordMap.collection?.[collectionId]?.value;
        const collectionName = collection?.name?.[0]?.[0] || '';
        
        console.log(`\nView ${viewId}:`);
        console.log('- Collection Name:', collectionName);
        console.log('- View Type:', view.type);
        
        if (collectionName.includes('FAQ') || collectionName.includes('よくある')) {
          console.log('  ⭐ This looks like the FAQ database!');
          faqCollectionId = collectionId;
          faqViewId = viewId;
          
          // ビューの詳細を確認
          console.log('\nView Configuration:');
          console.log('- Format:', view.format);
          
          // フィルター設定を確認
          if (view.query2) {
            console.log('\nView Filters (query2):');
            console.log(JSON.stringify(view.query2, null, 2));
            
            // フィルターの詳細を解析
            if (view.query2.filter) {
              console.log('\nFilter Details:');
              view.query2.filter.filters?.forEach((filter, index) => {
                console.log(`\nFilter ${index + 1}:`);
                console.log('- Property:', filter.property);
                console.log('- Type:', filter.filter?.type);
                console.log('- Operator:', filter.filter?.operator);
                console.log('- Value:', filter.filter?.value);
              });
            }
          }
          
          // スキーマを確認
          const schema = collection?.schema || {};
          console.log('\nDatabase Schema:');
          Object.entries(schema).forEach(([propId, prop]) => {
            if (prop.name === '公開' || prop.type === 'checkbox') {
              console.log(`\n⚠️  ${prop.name} (${propId}):`);
              console.log('- Type:', prop.type);
              console.log('- Options:', prop.options);
            }
          });
          
          // 実際のデータを確認
          console.log('\n\nFetching actual data...');
          const collectionData = await notion.getCollectionData(
            collectionId,
            viewId,
            {
              limit: 20,
              searchQuery: '',
              userTimeZone: 'Asia/Tokyo'
            }
          );
          
          if (collectionData.result?.blockIds) {
            console.log(`\nTotal items in view: ${collectionData.result.blockIds.length}`);
            
            // 最初の5件を詳細確認
            collectionData.result.blockIds.slice(0, 5).forEach((blockId, index) => {
              const block = collectionData.recordMap?.block?.[blockId]?.value;
              if (block) {
                console.log(`\n${index + 1}. Item ${blockId}:`);
                const title = block.properties?.title?.[0]?.[0] || 'Untitled';
                console.log('- Title:', title);
                
                // 公開プロパティを探す
                Object.entries(schema).forEach(([propId, prop]) => {
                  if (prop.name === '公開' && prop.type === 'checkbox') {
                    const value = block.properties?.[propId];
                    console.log(`- ${prop.name}:`, value?.[0]?.[0], '(raw:', value, ')');
                  }
                });
              }
            });
          }
          
          // ビューの結果を保存
          fs.writeFileSync(
            'faq-database-debug.json',
            JSON.stringify({
              viewId,
              collectionId,
              viewConfig: view,
              schema,
              sampleData: collectionData.result?.blockIds?.slice(0, 5).map(id => ({
                id,
                block: collectionData.recordMap?.block?.[id]?.value
              }))
            }, null, 2)
          );
          console.log('\n✅ Debug data saved to faq-database-debug.json');
        }
      }
    }
    
    if (!faqCollectionId) {
      console.log('\n❌ FAQ database not found!');
      console.log('Make sure the FAQ database is on the page.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// デバッグ実行
console.log('FAQデータベース デバッグツール');
console.log('==========================================\n');
debugFAQDatabase();
