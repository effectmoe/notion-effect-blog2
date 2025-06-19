/**
 * グループ化されたデータベースをリストビューで表示するための修正
 * react-notion-xはグループ化されたリストビューをサポートしていないため、
 * ビュータイプを強制的にリストビューに切り替える
 */
(function() {
  'use strict';
  
  console.log('🔄 [ListViewForGroups] Ensuring list view for grouped databases...');
  
  function forceListViewForGroupedDatabases() {
    // recordMapからグループ化されたデータベースを検出
    if (!window.recordMap || !window.recordMap.collection_view) {
      console.log('[ListViewForGroups] recordMap not ready yet');
      return;
    }
    
    const groupedDatabases = [];
    
    // グループ化されたビューを持つデータベースを検出
    Object.entries(window.recordMap.collection_view).forEach(([viewId, viewData]) => {
      const view = viewData?.value;
      if (view?.query2?.group_by || view?.query?.group_by) {
        // ビューに対応するブロックIDを探す
        Object.entries(window.recordMap.block).forEach(([blockId, blockData]) => {
          const block = blockData?.value;
          if (block?.view_ids?.includes(viewId)) {
            groupedDatabases.push({
              blockId,
              viewId,
              viewType: view.type,
              groupBy: view.query2?.group_by || view.query?.group_by
            });
          }
        });
      }
    });
    
    console.log(`[ListViewForGroups] Found ${groupedDatabases.length} grouped databases`);
    
    // 各グループ化されたデータベースに対して処理
    groupedDatabases.forEach(({ blockId, viewId, viewType, groupBy }) => {
      console.log(`[ListViewForGroups] Processing block ${blockId}, view ${viewId}, type ${viewType}`);
      
      const blockElement = document.querySelector(`.notion-block-${blockId}`);
      if (!blockElement) {
        console.log(`[ListViewForGroups] Block element not found for ${blockId}`);
        return;
      }
      
      // ビュータブを探してリストビューをクリック
      const tabs = blockElement.querySelectorAll('.notion-collection-view-tab');
      let listViewFound = false;
      
      tabs.forEach((tab, index) => {
        const tabText = tab.textContent?.toLowerCase() || '';
        if (tabText.includes('list') || tabText.includes('リスト') || index === 0) {
          console.log(`[ListViewForGroups] Clicking list view tab for ${blockId}`);
          tab.click();
          listViewFound = true;
          
          // クリック後、グループの表示を確認
          setTimeout(() => {
            const groups = blockElement.querySelectorAll('.notion-collection-group, .notion-list-view-group');
            if (groups.length > 0) {
              console.log(`[ListViewForGroups] Found ${groups.length} groups, ensuring visibility`);
              groups.forEach(group => {
                group.style.display = 'block';
                group.style.visibility = 'visible';
                group.style.opacity = '1';
              });
            }
          }, 300);
        }
      });
      
      if (!listViewFound && tabs.length > 0) {
        // リストビュータブが見つからない場合は最初のタブをクリック
        console.log(`[ListViewForGroups] No list view tab found, clicking first tab`);
        tabs[0].click();
      }
    });
  }
  
  // 実行タイミング
  let retryCount = 0;
  const maxRetries = 10;
  
  function tryForceListView() {
    retryCount++;
    console.log(`[ListViewForGroups] Attempt ${retryCount}/${maxRetries}`);
    
    forceListViewForGroupedDatabases();
    
    if (retryCount < maxRetries) {
      setTimeout(tryForceListView, 1000);
    }
  }
  
  // 初回実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryForceListView);
  } else {
    setTimeout(tryForceListView, 100);
  }
  
})();