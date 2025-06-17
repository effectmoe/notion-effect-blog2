// リンクされたデータベースのグループ表示を修正
(function() {
  console.log('🔧 Fixing linked database groups...');
  
  function fixLinkedDatabaseGroups() {
    if (!window.recordMap) {
      setTimeout(fixLinkedDatabaseGroups, 500);
      return;
    }
    
    const blocks = window.recordMap.block || {};
    const collectionViews = window.recordMap.collection_view || {};
    const collections = window.recordMap.collection || {};
    
    // すべてのcollection_viewブロックをチェック
    Object.entries(blocks).forEach(([blockId, blockData]) => {
      const block = blockData?.value;
      if (!block || block.type !== 'collection_view') return;
      
      // コレクションIDを取得（直接またはビューから）
      let collectionId = block.collection_id;
      
      if (!collectionId && block.view_ids?.length > 0) {
        // リンクされたデータベースの場合、ビューからcollection_idを取得
        for (const viewId of block.view_ids) {
          const view = collectionViews[viewId]?.value;
          if (view?.format?.collection_pointer?.id) {
            collectionId = view.format.collection_pointer.id;
            console.log(`Found linked database collection ID: ${collectionId}`);
            break;
          }
        }
      }
      
      if (!collectionId) return;
      
      // コレクション名を取得
      const collection = collections[collectionId]?.value;
      const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
      
      // グループ化されているかチェック
      let hasGrouping = false;
      if (block.view_ids) {
        for (const viewId of block.view_ids) {
          const view = collectionViews[viewId]?.value;
          if (view?.query2?.group_by || view?.query?.group_by) {
            hasGrouping = true;
            console.log(`${collectionName} has grouping:`, view.query2?.group_by || view.query?.group_by);
            break;
          }
        }
      }
      
      if (hasGrouping) {
        // DOM要素を探す
        const domBlock = document.querySelector(`.notion-block-${blockId}`);
        if (!domBlock) return;
        
        // コレクションを探す
        const notionCollection = domBlock.querySelector('.notion-collection');
        if (!notionCollection) return;
        
        // リストビューがあるか確認
        let listView = notionCollection.querySelector('.notion-list-view');
        
        // ギャラリービューしかない場合は、リストビューに切り替え
        if (!listView) {
          const viewTabs = notionCollection.querySelectorAll('.notion-collection-view-tabs-content-item');
          viewTabs.forEach(tab => {
            if (tab.textContent?.includes('リスト') || tab.textContent?.includes('List')) {
              console.log('Switching to list view...');
              tab.click();
            }
          });
          
          // 少し待ってから再確認
          setTimeout(() => {
            listView = notionCollection.querySelector('.notion-list-view');
            if (listView) {
              ensureGroupsVisible(listView, collectionName);
            }
          }, 500);
        } else {
          ensureGroupsVisible(listView, collectionName);
        }
      }
    });
  }
  
  function ensureGroupsVisible(listView, collectionName) {
    console.log(`Ensuring groups visible for ${collectionName}`);
    
    // グループを探す
    const groups = listView.querySelectorAll('.notion-collection-group, .notion-list-view-group');
    
    if (groups.length > 0) {
      console.log(`Found ${groups.length} groups`);
      groups.forEach(group => {
        group.style.display = 'block';
        group.style.visibility = 'visible';
        group.style.opacity = '1';
      });
    } else {
      console.log('No groups found, they might be hidden or not rendered');
      
      // 隠れているグループを探して表示
      const allElements = listView.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.className?.includes('group')) {
          el.style.display = 'block';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        }
      });
    }
  }
  
  // 実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(fixLinkedDatabaseGroups, 1000);
    });
  } else {
    setTimeout(fixLinkedDatabaseGroups, 1000);
  }
  
  // 複数回実行
  setTimeout(fixLinkedDatabaseGroups, 2000);
  setTimeout(fixLinkedDatabaseGroups, 3000);
  setTimeout(fixLinkedDatabaseGroups, 5000);
  
  window.fixLinkedDatabaseGroups = fixLinkedDatabaseGroups;
})();