// グループ化されたデータベースを強制的にリストビューで表示
(function() {
  console.log('🔄 Forcing list view for grouped databases...');
  
  function forceListView() {
    // FAQマスターなど、グループ化されているがギャラリービューになっているDBを修正
    const collections = document.querySelectorAll('.notion-collection');
    
    collections.forEach(collection => {
      // ギャラリービューを持つコレクションを探す
      const galleryView = collection.querySelector('.notion-gallery-view');
      const listView = collection.querySelector('.notion-list-view');
      
      if (galleryView && !listView) {
        console.log('Found gallery view that should be list view');
        
        // コレクションのヘッダーからタイトルを取得
        const title = collection.querySelector('.notion-collection-header-title')?.textContent || '';
        
        // FAQまたは特定のDBの場合
        if (title.includes('FAQ') || title.includes('マスター')) {
          console.log(`Converting ${title} to list view...`);
          
          // ビュータブを探す
          const viewTabs = collection.querySelectorAll('.notion-collection-view-tabs-content-item');
          
          viewTabs.forEach(tab => {
            const tabText = tab.textContent || '';
            // リストビューのタブを探す
            if (tabText.includes('リスト') || tabText.includes('List') || 
                tabText.includes('一覧') || tab.querySelector('[class*="list"]')) {
              console.log('Found list view tab, clicking...');
              tab.click();
              
              // クリック後の確認
              setTimeout(() => {
                const newListView = collection.querySelector('.notion-list-view');
                if (newListView) {
                  console.log('✅ Successfully switched to list view');
                  
                  // グループが表示されているか確認
                  const groups = newListView.querySelectorAll('.notion-collection-group, .notion-list-view-group');
                  if (groups.length > 0) {
                    console.log(`✅ ${groups.length} groups are now visible`);
                  }
                }
              }, 500);
            }
          });
        }
      }
    });
  }
  
  // 実行タイミング
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(forceListView, 1000);
    });
  } else {
    setTimeout(forceListView, 1000);
  }
  
  // 追加の実行
  setTimeout(forceListView, 2000);
  setTimeout(forceListView, 3000);
  
  // ページ遷移時の対応
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(forceListView, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
  
  // デバッグ用
  window.forceListView = forceListView;
})();