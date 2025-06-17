// データベースビュー修正スクリプト
(function() {
  console.log('🔧 Database View Fix Script Started');
  
  // ビューを修正する関数
  function fixDatabaseViews() {
    // すべてのコレクションビューを探す
    const collections = document.querySelectorAll('.notion-collection');
    
    collections.forEach((collection) => {
      // ビューのドロップダウンを探す
      const viewDropdown = collection.querySelector('.notion-collection-view-dropdown');
      if (!viewDropdown) return;
      
      // リストビューのタブを探す
      const viewTabs = collection.querySelectorAll('.notion-collection-view-tab-button');
      let listViewTab = null;
      
      viewTabs.forEach((tab) => {
        const text = tab.textContent || '';
        if (text.includes('リスト') || text.includes('List') || text.includes('list')) {
          listViewTab = tab;
        }
      });
      
      // リストビューが見つかり、まだアクティブでない場合はクリック
      if (listViewTab && !listViewTab.classList.contains('notion-collection-view-tab-active')) {
        console.log('📋 Switching to list view');
        listViewTab.click();
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
  
  // 初回実行
  setTimeout(fixDatabaseViews, 1000);
  setTimeout(fixDatabaseViews, 2000);
  setTimeout(fixDatabaseViews, 3000);
  
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