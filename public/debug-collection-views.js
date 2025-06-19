// コレクションビューのデバッグツール
(function() {
  console.log('🔍 Collection View Debugger Started');
  
  // ビュー切り替えを監視
  function interceptViewChanges() {
    const originalLog = console.log;
    
    // console.logをインターセプト
    console.log = function() {
      const args = Array.from(arguments);
      const message = args[0];
      
      // collection view関連のログを検出
      if (typeof message === 'string' && message.includes('collection view')) {
        console.warn('📌 Collection View Event:', ...args);
        
        // collection viewの詳細を調査
        if (args[1] && typeof args[1] === 'object') {
          const details = args[1];
          console.warn('Collection ID:', details.collectionId);
          console.warn('View ID:', details.collectionViewId);
          console.warn('Has Collection Data:', !!details.collectionData);
          
          // recordMapの内容を確認
          if (window.recordMap) {
            const block = window.recordMap.block[details.blockId || details.collectionId];
            const view = window.recordMap.collection_view[details.collectionViewId];
            const collection = window.recordMap.collection[details.collectionId];
            
            console.warn('Block exists:', !!block);
            console.warn('View exists:', !!view);
            console.warn('Collection exists:', !!collection);
            
            if (view?.value) {
              console.warn('View type:', view.value.type);
              console.warn('View name:', view.value.name);
            }
          }
        }
      }
      
      // 元のconsole.logを呼び出す
      originalLog.apply(console, args);
    };
  }
  
  // ビューの状態を定期的にチェック
  function checkViewStates() {
    const viewTabs = document.querySelectorAll('.notion-collection-view-tab-button');
    const activeView = document.querySelector('.notion-collection-view-tab-active');
    
    if (viewTabs.length > 0) {
      console.warn('📊 View Tab States:');
      viewTabs.forEach((tab, index) => {
        const isActive = tab.classList.contains('notion-collection-view-tab-active');
        console.warn(`  Tab ${index + 1}: ${tab.textContent} ${isActive ? '(ACTIVE)' : ''}`);
      });
    }
    
    // 現在表示されているビューの内容を確認
    const visibleViews = document.querySelectorAll('.notion-collection-view-body > div');
    console.warn('Visible view containers:', visibleViews.length);
    
    visibleViews.forEach((view, index) => {
      const classList = Array.from(view.classList);
      const isHidden = view.style.display === 'none' || view.hidden;
      console.warn(`  View ${index + 1}: Classes=[${classList.join(', ')}], Hidden=${isHidden}`);
    });
  }
  
  // 初期化
  interceptViewChanges();
  
  // 定期的に状態をチェック
  setInterval(checkViewStates, 5000);
  
  // グローバル関数として公開
  window.debugCollectionView = function(blockId) {
    console.warn('🔍 Debugging block:', blockId);
    
    if (!window.recordMap) {
      console.error('recordMap not found!');
      return;
    }
    
    const block = window.recordMap.block[blockId]?.value;
    if (!block) {
      console.error('Block not found!');
      return;
    }
    
    console.warn('Block type:', block.type);
    console.warn('Collection ID:', block.collection_id);
    console.warn('View IDs:', block.view_ids);
    
    // 各ビューの詳細を表示
    if (block.view_ids) {
      block.view_ids.forEach(viewId => {
        const view = window.recordMap.collection_view[viewId]?.value;
        if (view) {
          console.warn(`\nView ${viewId}:`);
          console.warn('  Type:', view.type);
          console.warn('  Name:', view.name);
          console.warn('  Query:', view.query2 || view.query);
        }
      });
    }
    
    // コレクションの詳細
    if (block.collection_id) {
      const collection = window.recordMap.collection[block.collection_id]?.value;
      if (collection) {
        console.warn('\nCollection:', collection.name);
        console.warn('Schema:', Object.keys(collection.schema || {}));
      }
    }
  };
  
  console.log('💡 Use window.debugCollectionView(blockId) to debug a specific collection');
})();