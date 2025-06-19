import { NotionAPI } from 'notion-client';

const notion = new NotionAPI({
  authToken: process.env.NOTION_API_SECRET || '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',
  activeUser: process.env.NOTION_ACTIVE_USER || '91b6494e-7ede-45b2-99f9-402ae7d7fcee',
  userTimeZone: 'Asia/Tokyo'
});

async function debugFAQView() {
  try {
    // 新しいFAQリンクドデータベースビューのブロックID
    const newFaqBlockId = '213b802cb0c680ea91c9e30f610943da';
    
    console.log('新しいFAQリンクドデータベースビューを取得中...');
    
    // ページを取得
    const recordMap = await notion.getPage(newFaqBlockId);
    
    // ブロック情報を確認
    const block = recordMap.block[newFaqBlockId];
    if (block && block.value) {
      console.log('\nブロック情報:');
      console.log('- ID:', block.value.id);
      console.log('- Type:', block.value.type);
      console.log('- Collection ID:', block.value.collection_id);
      console.log('- View IDs:', block.value.view_ids);
      
      // コレクション情報を確認
      const collectionId = block.value.collection_id;
      if (collectionId && recordMap.collection && recordMap.collection[collectionId]) {
        const collection = recordMap.collection[collectionId].value;
        console.log('\nコレクション情報:');
        console.log('- Name:', collection.name);
        console.log('- Parent ID:', collection.parent_id);
      }
      
      // ビュー情報を確認
      const viewIds = block.value.view_ids || [];
      console.log('\nビュー情報:');
      viewIds.forEach(viewId => {
        if (recordMap.collection_view && recordMap.collection_view[viewId]) {
          const view = recordMap.collection_view[viewId].value;
          console.log(`\nView ${viewId}:`);
          console.log('- Type:', view.type);
          console.log('- Name:', view.name);
          console.log('- Has filter:', !!(view.format && view.format.filter));
          if (view.format && view.format.filter) {
            console.log('- Filter:', JSON.stringify(view.format.filter, null, 2));
          }
        }
      });
      
      // コレクションクエリの結果を確認
      if (recordMap.collection_query && recordMap.collection_query[collectionId]) {
        const query = recordMap.collection_query[collectionId];
        console.log('\nコレクションクエリ結果:');
        console.log('- Has results:', !!(query.collection_group_results?.blockIds));
        console.log('- Item count:', query.collection_group_results?.blockIds?.length || 0);
      } else {
        console.log('\nコレクションクエリ結果: なし');
      }
    } else {
      console.log('ブロックが見つかりません');
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行
debugFAQView();