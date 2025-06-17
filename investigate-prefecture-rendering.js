// 都道府県DBと他のDBの違いを分析
(function() {
  console.log('\n🔍 データベースの違いを分析...\n');
  
  // recordMapから詳細情報を取得
  if (!window.recordMap) {
    console.log('❌ recordMapが見つかりません');
    return;
  }
  
  // 都道府県DBのブロックID
  const prefectureBlockId = '20fb802cb0c68027945beabe5f521e5a';
  
  // ブロック情報を取得
  const blocks = window.recordMap.block || {};
  const collections = window.recordMap.collection || {};
  const collectionViews = window.recordMap.collection_view || {};
  
  console.log('=== 都道府県データベース（動作する） ===');
  const prefBlock = blocks[prefectureBlockId]?.value;
  if (prefBlock) {
    console.log('Block type:', prefBlock.type);
    console.log('Collection ID:', prefBlock.collection_id);
    console.log('View IDs:', prefBlock.view_ids);
    
    // ビューの詳細を確認
    if (prefBlock.view_ids && prefBlock.view_ids[0]) {
      const viewId = prefBlock.view_ids[0];
      const view = collectionViews[viewId]?.value;
      if (view) {
        console.log('\nView詳細:');
        console.log('  Type:', view.type);
        console.log('  Name:', view.name);
        console.log('  Query2:', JSON.stringify(view.query2, null, 2));
        console.log('  Format:', view.format ? Object.keys(view.format) : 'なし');
      }
    }
    
    // コレクションの詳細
    if (prefBlock.collection_id) {
      const collection = collections[prefBlock.collection_id]?.value;
      if (collection) {
        console.log('\nCollection詳細:');
        console.log('  Name:', collection.name?.[0]?.[0]);
        console.log('  Schema properties:', Object.keys(collection.schema || {}));
      }
    }
  }
  
  console.log('\n\n=== 他のデータベース（動作しない） ===');
  
  // すべてのcollection_viewブロックを確認
  Object.entries(blocks).forEach(([blockId, blockData]) => {
    const block = blockData?.value;
    if (block?.type === 'collection_view' && blockId !== prefectureBlockId) {
      
      // コレクション名を取得
      let collectionName = 'Unknown';
      if (block.collection_id) {
        const collection = collections[block.collection_id]?.value;
        collectionName = collection?.name?.[0]?.[0] || 'Unknown';
      }
      
      // FAQまたはカフェキネシ関連のみ表示
      if (collectionName.includes('FAQ') || collectionName.includes('カフェキネシ')) {
        console.log(`\n${collectionName} (${blockId}):`);
        console.log('  Block type:', block.type);
        console.log('  Collection ID:', block.collection_id);
        console.log('  View IDs:', block.view_ids);
        
        // 最初のビューの詳細
        if (block.view_ids && block.view_ids[0]) {
          const viewId = block.view_ids[0];
          const view = collectionViews[viewId]?.value;
          if (view) {
            console.log('  View type:', view.type);
            console.log('  Has query2.group_by:', !!view.query2?.group_by);
            if (view.query2?.group_by) {
              console.log('  Group by:', JSON.stringify(view.query2.group_by));
            }
          }
        }
      }
    }
  });
  
  // DOM要素も確認
  console.log('\n\n=== DOM要素の確認 ===');
  const prefectureDOM = document.querySelector('.notion-block-' + prefectureBlockId);
  if (prefectureDOM) {
    console.log('都道府県DB DOM:');
    console.log('  子要素数:', prefectureDOM.children.length);
    console.log('  クラス:', Array.from(prefectureDOM.classList));
    const listView = prefectureDOM.querySelector('.notion-list-view');
    console.log('  リストビューあり:', !!listView);
    if (listView) {
      console.log('  リストビューのdisplay:', window.getComputedStyle(listView).display);
    }
  }
  
  return '分析完了';
})();