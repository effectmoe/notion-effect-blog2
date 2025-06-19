// グループ化されたデータベースのレンダリング問題を修正
(function() {
  console.log('🔧 Fixing grouped database rendering issues...');
  
  function fixGroupedDatabases() {
    // recordMapを確認
    if (!window.recordMap) {
      console.log('Waiting for recordMap...');
      setTimeout(fixGroupedDatabases, 500);
      return;
    }
    
    const blocks = window.recordMap.block || {};
    const collectionViews = window.recordMap.collection_view || {};
    
    // すべてのcollection_viewブロックを確認
    Object.entries(blocks).forEach(([blockId, blockData]) => {
      const block = blockData?.value;
      if (!block || block.type !== 'collection_view') return;
      
      // ビューの詳細を確認
      if (block.view_ids && block.view_ids.length > 0) {
        block.view_ids.forEach(viewId => {
          const view = collectionViews[viewId]?.value;
          if (view && view.type === 'list' && view.query2?.group_by) {
            console.log(`Found grouped list view: ${viewId}`);
            console.log('Group by:', view.query2.group_by);
            
            // DOM要素を探す
            const domBlock = document.querySelector(`.notion-block-${blockId}`);
            if (domBlock) {
              console.log(`Processing block ${blockId}...`);
              
              // コレクションビューを探す
              const collectionView = domBlock.querySelector('.notion-collection-view');
              if (collectionView) {
                // 非表示を解除
                collectionView.style.display = 'block';
                collectionView.style.visibility = 'visible';
                collectionView.style.opacity = '1';
                
                // リストビューを探す/作成
                let listView = collectionView.querySelector('.notion-list-view');
                if (!listView) {
                  // リストビューが存在しない場合、ギャラリービューをリストビューに変換
                  const galleryView = collectionView.querySelector('.notion-gallery-view');
                  if (galleryView) {
                    console.log('Converting gallery view to list view...');
                    galleryView.className = galleryView.className.replace('gallery', 'list');
                    listView = galleryView;
                  }
                }
                
                if (listView) {
                  listView.style.display = 'block';
                  listView.style.visibility = 'visible';
                  listView.style.opacity = '1';
                  
                  // グループ構造を作成（必要な場合）
                  if (!listView.querySelector('.notion-collection-group')) {
                    console.log('Creating group structure...');
                    // ここで本来はグループ構造を動的に生成する必要があるが、
                    // 一旦表示を確保することを優先
                  }
                }
              }
              
              // コレクション全体を表示
              const collection = domBlock.querySelector('.notion-collection');
              if (collection) {
                collection.style.display = 'block';
                collection.style.visibility = 'visible';
                collection.style.opacity = '1';
              }
            }
          }
        });
      }
    });
    
    // 都道府県データベースのような静的レンダリングされたグループも処理
    const allGroups = document.querySelectorAll('.notion-collection-group');
    allGroups.forEach(group => {
      group.style.display = 'block';
      group.style.visibility = 'visible';
      group.style.opacity = '1';
    });
  }
  
  // 実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(fixGroupedDatabases, 1000);
    });
  } else {
    setTimeout(fixGroupedDatabases, 1000);
  }
  
  // 複数回実行
  setTimeout(fixGroupedDatabases, 2000);
  setTimeout(fixGroupedDatabases, 3000);
  setTimeout(fixGroupedDatabases, 5000);
  
  // デバッグ用
  window.fixGroupedDatabases = fixGroupedDatabases;
  console.log('💡 Use window.fixGroupedDatabases() to manually fix');
})();