// データベースビュー修正スクリプト
(function() {
  console.log('[TOOL] Database View Fix Script Started');
  
  // ビューを修正する関数
  function fixDatabaseViews() {
    // すべてのコレクションビューを探す
    const collections = document.querySelectorAll('.notion-collection');
    console.log(`Found ${collections.length} collections`);
    
    // コレクションが見つからない場合は早期リターン
    if (collections.length === 0) {
      return;
    }
    
    collections.forEach((collection, index) => {
      // コレクションが正しくレンダリングされているか確認
      if (!collection.offsetHeight) {
        console.log(`Collection ${index}: Not yet rendered, skipping`);
        return;
      }
      
      // ビューのドロップダウンを探す（オプショナル）
      const viewDropdown = collection.querySelector('.notion-collection-view-dropdown');
      if (!viewDropdown) {
        console.log(`Collection ${index}: No dropdown found (might be single view)`);
        // ドロップダウンがない場合でも続行
      }
      
      // リストビューのタブを探す
      const viewTabs = collection.querySelectorAll('.notion-collection-view-tabs-content-item');
      
      // タブが見つからない場合はスキップ
      if (viewTabs.length === 0) {
        console.log(`Collection ${index}: No view tabs found`);
        return;
      }
      
      console.log(`Collection ${index}: Found ${viewTabs.length} view tabs`);
      
      let listViewTab = null;
      let firstTab = viewTabs[0]; // 最初のタブを記録
      
      viewTabs.forEach((tab, tabIndex) => {
        const text = tab.textContent || '';
        console.log(`  Tab ${tabIndex}: "${text}"`);
        
        // より幅広いパターンでリストビューを検出
        if (text.includes('リスト') || 
            text.includes('List') || 
            text.includes('list') ||
            text.includes('一覧') ||
            text === '[LIST]' || // リストアイコンの場合
            (tabIndex === 0 && viewTabs.length > 1)) { // 最初のタブをデフォルトとする
          listViewTab = tab;
          console.log(`  -> Identified as list view`);
        }
      });
      
      // リストビューが見つからない場合は最初のタブを使用
      if (!listViewTab && firstTab) {
        listViewTab = firstTab;
        console.log(`  Using first tab as default`);
      }
      
      // リストビューが見つかり、まだアクティブでない場合はクリック
      if (listViewTab && !listViewTab.classList.contains('notion-collection-view-tabs-content-item-active')) {
        console.log(`[LIST] Switching to list view for collection ${index}`);
        
        try {
          listViewTab.click();
          
          // クリック後の確認
          setTimeout(() => {
            if (listViewTab.classList.contains('notion-collection-view-tabs-content-item-active')) {
              console.log(`[SUCCESS] Successfully switched to list view`);
            } else {
              console.log(`[WARNING] Failed to switch view`);
            }
          }, 500);
        } catch (error) {
          console.error(`[ERROR] Failed to click tab: ${error.message}`);
        }
      } else if (listViewTab && listViewTab.classList.contains('notion-collection-view-tabs-content-item-active')) {
        console.log(`[SUCCESS] List view already active for collection ${index}`);
      }
      
      // エラーメッセージを隠す
      const errorMessages = collection.querySelectorAll('.notion-error');
      errorMessages.forEach(error => {
        error.style.display = 'none';
      });
    });
  }
  
  // MutationObserverで動的な変更を監視
  const observer = new MutationObserver((mutations) => {
    let shouldFix = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node;
            if (element.classList && 
                (element.classList.contains('notion-collection') ||
                 element.querySelector && element.querySelector('.notion-collection'))) {
              shouldFix = true;
            }
          }
        });
      }
    });
    
    if (shouldFix) {
      setTimeout(fixDatabaseViews, 100);
    }
  });
  
  // 監視を開始
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // 初回実行（遅延を増やしてデータベースのレンダリングを待つ）
  setTimeout(fixDatabaseViews, 3000);
  setTimeout(fixDatabaseViews, 5000);
  setTimeout(fixDatabaseViews, 8000);
  
  // ページナビゲーション時の対応
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(fixDatabaseViews, 500);
    }
  }).observe(document, { subtree: true, childList: true });
  
})();