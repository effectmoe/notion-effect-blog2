// すべてのグループ化されたリストビューを修正
(function() {
  console.log('🔧 Fixing all grouped list views...');
  
  function fixGroupedLists() {
    // 都道府県データベースの構造を分析
    const prefectureDB = document.querySelector('.notion-block-20fb802cb0c68027945beabe5f521e5a');
    if (prefectureDB) {
      console.log('✅ Found prefecture database (working correctly)');
      
      // 動作している構造を確認
      const workingGroups = prefectureDB.querySelectorAll('.notion-collection-group');
      console.log(`Prefecture DB has ${workingGroups.length} groups`);
    }
    
    // すべてのコレクションを取得
    const allCollections = document.querySelectorAll('.notion-collection');
    
    allCollections.forEach((collection, index) => {
      // リストビューを含むか確認
      const listView = collection.querySelector('.notion-list-view');
      if (!listView) return;
      
      console.log(`\nChecking collection ${index + 1}...`);
      
      // グループを探す（両方のパターン）
      let groups = collection.querySelectorAll('.notion-collection-group');
      if (groups.length === 0) {
        groups = collection.querySelectorAll('.notion-list-view-group');
      }
      
      if (groups.length > 0) {
        console.log(`Found ${groups.length} groups`);
        
        // 各グループを強制表示
        groups.forEach((group, gIndex) => {
          // グループ全体を表示
          group.style.display = 'block';
          group.style.visibility = 'visible';
          group.style.opacity = '1';
          group.style.position = 'relative';
          group.style.zIndex = '1';
          
          // グループタイトルを表示
          const title = group.querySelector('.notion-collection-group-title, .notion-list-view-group-header');
          if (title) {
            title.style.display = 'block';
            title.style.visibility = 'visible';
            title.style.opacity = '1';
            title.style.padding = '12px 0';
            title.style.fontWeight = '600';
            title.style.fontSize = '1.1em';
          }
          
          // グループ内のアイテムを表示
          const items = group.querySelectorAll('.notion-list-item');
          items.forEach(item => {
            item.style.display = 'flex';
            item.style.visibility = 'visible';
            item.style.opacity = '1';
          });
          
          console.log(`  Group ${gIndex + 1}: ${title?.textContent || 'No title'} - ${items.length} items`);
        });
        
        // リストビュー自体も確実に表示
        listView.style.display = 'block';
        listView.style.visibility = 'visible';
        listView.style.opacity = '1';
        listView.style.minHeight = '100px';
      } else {
        // グループが見つからない場合、隠れている可能性をチェック
        const allChildren = collection.querySelectorAll('*');
        let hiddenGroupFound = false;
        
        allChildren.forEach(child => {
          const className = child.className || '';
          if (className.includes('group') && className.includes('notion')) {
            const style = window.getComputedStyle(child);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              console.log(`Found hidden group element: ${className}`);
              child.style.display = 'block';
              child.style.visibility = 'visible';
              child.style.opacity = '1';
              hiddenGroupFound = true;
            }
          }
        });
        
        if (!hiddenGroupFound) {
          console.log('No groups found in this collection');
        }
      }
    });
  }
  
  // 実行タイミング
  function runFixes() {
    fixGroupedLists();
    
    // 複数回実行して確実に適用
    setTimeout(fixGroupedLists, 500);
    setTimeout(fixGroupedLists, 1000);
    setTimeout(fixGroupedLists, 2000);
    setTimeout(fixGroupedLists, 3000);
  }
  
  // DOMの準備を待つ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runFixes);
  } else {
    runFixes();
  }
  
  // 動的変更を監視
  const observer = new MutationObserver((mutations) => {
    const hasCollectionChange = mutations.some(m => 
      m.target.className?.includes('notion-collection') ||
      m.target.querySelector?.('.notion-collection')
    );
    
    if (hasCollectionChange) {
      setTimeout(fixGroupedLists, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  // デバッグ用
  window.debugGroupedLists = fixGroupedLists;
})();