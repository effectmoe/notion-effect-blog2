/**
 * カフェキネシコンテンツのIDを特定するスクリプト
 */
(function() {
  console.log('🔍 Searching for カフェキネシコンテンツ database ID...');
  
  if (!window.recordMap) {
    console.log('recordMap not ready, retrying in 1s...');
    setTimeout(arguments.callee, 1000);
    return;
  }
  
  const found = [];
  
  // すべてのコレクションをチェック
  if (window.recordMap.collection) {
    Object.entries(window.recordMap.collection).forEach(([collectionId, collectionData]) => {
      const collection = collectionData?.value;
      if (collection?.name) {
        const name = collection.name[0]?.[0] || '';
        if (name.includes('カフェキネシ')) {
          found.push({
            collectionId,
            name,
            type: 'collection'
          });
        }
      }
    });
  }
  
  // すべてのブロックをチェック
  if (window.recordMap.block) {
    Object.entries(window.recordMap.block).forEach(([blockId, blockData]) => {
      const block = blockData?.value;
      if (block?.type === 'collection_view') {
        // ブロックのテキストコンテンツをチェック
        const domElement = document.querySelector(`.notion-block-${blockId}`);
        if (domElement && domElement.textContent?.includes('カフェキネシ')) {
          found.push({
            blockId,
            collectionId: block.collection_id,
            viewIds: block.view_ids,
            type: 'collection_view_block'
          });
        }
      }
    });
  }
  
  // 結果を表示
  if (found.length > 0) {
    console.log('✅ Found カフェキネシ related items:');
    found.forEach(item => {
      console.log('\n' + JSON.stringify(item, null, 2));
      
      // ビューの詳細情報も表示
      if (item.viewIds && window.recordMap.collection_view) {
        item.viewIds.forEach(viewId => {
          const view = window.recordMap.collection_view[viewId]?.value;
          if (view) {
            console.log(`  View ${viewId}:`, {
              type: view.type,
              name: view.name,
              query2: view.query2,
              format: view.format
            });
          }
        });
      }
    });
  } else {
    console.log('❌ No カフェキネシ items found');
  }
  
  // DOMからも検索
  console.log('\n🔍 Searching in DOM...');
  const collections = document.querySelectorAll('.notion-collection');
  collections.forEach((col, index) => {
    if (col.textContent?.includes('カフェキネシ')) {
      const blockElement = col.closest('[class*="notion-block-"]');
      if (blockElement) {
        const classes = Array.from(blockElement.classList);
        const blockClass = classes.find(c => c.startsWith('notion-block-'));
        if (blockClass) {
          const blockId = blockClass.replace('notion-block-', '');
          console.log(`\nDOM Collection ${index + 1}:`);
          console.log(`  Block ID: ${blockId}`);
          console.log(`  Has list view: ${!!col.querySelector('.notion-list-view')}`);
          console.log(`  Has groups: ${col.querySelectorAll('.notion-collection-group').length}`);
        }
      }
    }
  });
  
})();