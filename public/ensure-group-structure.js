// グループ化されたリストビューの構造を確保するスクリプト
(function() {
  'use strict';
  
  console.log('🔧 Ensuring group structure for list views');
  
  function ensureGroupStructure() {
    // すべてのリストビューを取得
    const listViews = document.querySelectorAll('.notion-collection-view-type-list');
    
    listViews.forEach(view => {
      // グループが存在するかチェック
      const hasNewGroups = view.querySelector('.notion-collection-group');
      const hasOldGroups = view.querySelector('.notion-list-view-group');
      
      if (!hasNewGroups && !hasOldGroups) {
        // グループがない場合、構造に問題がある可能性
        console.log('⚠️ List view without visible groups found');
        
        // 非表示の要素を強制表示
        const allElements = view.querySelectorAll('*');
        allElements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') {
            el.style.removeProperty('display');
            el.style.removeProperty('visibility');
          }
        });
      }
    });
  }
  
  // 実行タイミング
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureGroupStructure);
  } else {
    ensureGroupStructure();
  }
  
  // 遅延実行
  setTimeout(ensureGroupStructure, 1000);
  setTimeout(ensureGroupStructure, 2000);
  
  // 動的変更の監視
  const observer = new MutationObserver(() => {
    ensureGroupStructure();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();