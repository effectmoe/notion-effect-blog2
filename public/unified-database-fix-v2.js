/**
 * 統合データベース修正スクリプト v2
 * すべてのデータベース修正を順序立てて実行し、競合を防ぐ
 */
(function() {
  'use strict';
  
  console.log('🔧 [UnifiedDatabaseFix v2] Starting unified database fix...');
  
  // グローバル状態管理
  const fixState = {
    isProcessing: false,
    processedBlocks: new Set(),
    recordMapReady: false,
    domReady: false
  };
  
  // 実行待機キュー
  const executionQueue = [];
  
  /**
   * recordMapが完全に読み込まれているか確認
   */
  function checkRecordMapReady() {
    if (!window.recordMap) {
      return false;
    }
    
    // 基本的なプロパティの存在確認
    const hasBlocks = window.recordMap.block && Object.keys(window.recordMap.block).length > 0;
    const hasCollections = window.recordMap.collection || true; // コレクションは必須ではない
    
    return hasBlocks && hasCollections;
  }
  
  /**
   * 修正処理をキューに追加し、順番に実行
   */
  function queueFix(name, fixFunction, priority = 5) {
    executionQueue.push({ name, fixFunction, priority });
    executionQueue.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * キューを処理
   */
  async function processQueue() {
    if (fixState.isProcessing || executionQueue.length === 0) {
      return;
    }
    
    fixState.isProcessing = true;
    
    while (executionQueue.length > 0) {
      const { name, fixFunction } = executionQueue.shift();
      
      try {
        console.log(`[UnifiedDatabaseFix v2] Executing: ${name}`);
        await fixFunction();
        console.log(`[UnifiedDatabaseFix v2] Completed: ${name}`);
      } catch (error) {
        console.error(`[UnifiedDatabaseFix v2] Error in ${name}:`, error);
      }
      
      // 次の処理まで少し待つ（DOMの更新を待つため）
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    fixState.isProcessing = false;
  }
  
  /**
   * 1. 基本的なグループ表示修正
   */
  function fixBasicGroupDisplay() {
    const style = document.createElement('style');
    style.textContent = `
      .notion-collection-group,
      .notion-list-view-group {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      .notion-collection-group-title {
        display: list-item !important;
        cursor: pointer !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * 2. グループ化されたデータベースをリストビューに切り替え
   */
  function switchToListView() {
    if (!fixState.recordMapReady) return;
    
    const groupedDatabases = [];
    
    // グループ化されたビューを検出
    Object.entries(window.recordMap.collection_view || {}).forEach(([viewId, viewData]) => {
      const view = viewData?.value;
      if (view?.query2?.group_by || view?.format?.collection_group_by) {
        Object.entries(window.recordMap.block || {}).forEach(([blockId, blockData]) => {
          const block = blockData?.value;
          if (block?.view_ids?.includes(viewId) && !fixState.processedBlocks.has(blockId)) {
            groupedDatabases.push({ blockId, viewId });
            fixState.processedBlocks.add(blockId);
          }
        });
      }
    });
    
    // リストビューに切り替え
    groupedDatabases.forEach(({ blockId }) => {
      const blockElement = document.querySelector(`.notion-block-${blockId}`);
      if (blockElement) {
        const tabs = blockElement.querySelectorAll('.notion-collection-view-tab');
        tabs.forEach((tab, index) => {
          if (tab.textContent?.toLowerCase().includes('list') || index === 0) {
            tab.click();
          }
        });
      }
    });
  }
  
  /**
   * 3. FAQマスターとカフェキネシコンテンツの修正
   */
  function fixGroupedDatabases() {
    const databases = [
      {
        blockId: '212b802c-b0c6-80ea-b7ed-ef4459f38819',
        collectionId: '212b802c-b0c6-8046-b4ee-000b2833619c',
        name: 'FAQマスター',
        groupByProperty: 'カテゴリ'
      },
      {
        blockId: '216b802c-b0c6-808f-ac1d-dbf03d973fec',
        collectionId: '216b802c-b0c6-81c0-a940-000b2f6a23b3',
        name: 'カフェキネシコンテンツ',
        groupByProperty: 'xaH>' // multi_select property ID
      }
    ];
    
    databases.forEach(db => {
      // ハイフンを削除したIDも試す
      const blockIdNoHyphens = db.blockId.replace(/-/g, '');
      let blockElement = document.querySelector(`.notion-block-${db.blockId}`);
      if (!blockElement) {
        blockElement = document.querySelector(`.notion-block-${blockIdNoHyphens}`);
      }
      
      if (!blockElement) {
        console.log(`[UnifiedDatabaseFix v2] Block element not found for ${db.name} (tried both ${db.blockId} and ${blockIdNoHyphens})`);
        return;
      }
      
      if (!window.recordMap) {
        console.log(`[UnifiedDatabaseFix v2] recordMap not available`);
        return;
      }
      
      const block = window.recordMap.block[db.blockId]?.value;
      if (!block) return;
      
      const collectionId = db.collectionId;
      const collection = window.recordMap.collection?.[collectionId]?.value;
      
      if (!collection) {
        console.log(`[UnifiedDatabaseFix v2] No collection found for ${db.name}`);
        return;
      }
      
      // アイテムを収集
      const items = [];
      Object.entries(window.recordMap.block).forEach(([blockId, blockData]) => {
        const itemBlock = blockData?.value;
        if (itemBlock?.parent_id === collectionId && itemBlock?.properties) {
          items.push(itemBlock);
        }
      });
      
      console.log(`[UnifiedDatabaseFix v2] Found ${items.length} items for ${db.name}`);
      
      if (items.length === 0) return;
      
      // グループ化
      const groups = {};
      items.forEach(item => {
        // カテゴリ値を取得（プロパティ名またはIDで）
        let categoryValues = [];
        
        // プロパティ名で試す
        const propByName = item.properties?.[db.groupByProperty];
        if (propByName?.select?.name) {
          categoryValues = [propByName.select.name];
        } else if (propByName?.multi_select) {
          categoryValues = propByName.multi_select.map(opt => opt.name);
        }
        
        // プロパティIDで試す（主にカフェキネシコンテンツ用）
        if (categoryValues.length === 0 && db.groupByProperty.includes('>')) {
          const propById = item.properties?.[db.groupByProperty];
          if (propById?.select?.name) {
            categoryValues = [propById.select.name];
          } else if (propById?.multi_select) {
            categoryValues = propById.multi_select.map(opt => opt.name);
          }
        }
        
        if (categoryValues.length === 0) {
          categoryValues = ['その他'];
        }
        
        // 各カテゴリに追加
        categoryValues.forEach(category => {
          if (!groups[category]) {
            groups[category] = [];
          }
          groups[category].push(item);
        });
      });
      
      console.log(`[UnifiedDatabaseFix v2] Created ${Object.keys(groups).length} groups for ${db.name}`);
      
      // 既存のコンテンツを確認
      const existingContent = blockElement.querySelector('.notion-collection-view-type');
      console.log(`[UnifiedDatabaseFix v2] ${db.name} - Groups created: ${Object.keys(groups).length}, existingContent found: ${!!existingContent}`);
      
      if (existingContent && Object.keys(groups).length > 0) {
        // DOMを再構築
        let html = '<div class="notion-list-view"><div class="notion-list-collection">';
        
        Object.entries(groups).forEach(([groupName, groupItems]) => {
          html += `
            <div class="notion-collection-group">
              <summary class="notion-collection-group-title">
                <div style="display: flex; align-items: center; gap: 0.5em;">
                  <svg width="12" height="12" viewBox="0 0 12 12" style="transform: rotate(90deg);">
                    <path d="M6.02734 8.80274C6.27148 8.80274 6.47168 8.71484 6.66211 8.51465L10.2803 4.82324C10.4268 4.67676 10.5 4.49609 10.5 4.28125C10.5 3.85156 10.1484 3.5 9.72363 3.5C9.50879 3.5 9.30859 3.58789 9.15234 3.74902L6.03223 6.9668L2.90722 3.74902C2.74609 3.58789 2.55078 3.5 2.33105 3.5C1.90137 3.5 1.55469 3.85156 1.55469 4.28125C1.55469 4.49609 1.62793 4.67676 1.77441 4.82324L5.39258 8.51465C5.58789 8.71484 5.78808 8.80274 6.02734 8.80274Z" fill="currentColor"></path>
                  </svg>
                  <span>${groupName}</span>
                  <span style="opacity: 0.5;">(${groupItems.length})</span>
                </div>
              </summary>
              <div class="notion-list-collection">
          `;
          
          groupItems.forEach(item => {
            const title = item.properties?.title?.title?.[0]?.text?.content || 
                         item.properties?.['タイトル']?.title?.[0]?.text?.content || 
                         'Untitled';
            html += `
              <div class="notion-list-item">
                <a href="/${item.id.replace(/-/g, '')}">
                  ${title}
                </a>
              </div>
            `;
          });
          
          html += '</div></div>';
        });
        
        html += '</div></div>';
        existingContent.innerHTML = html;
        console.log(`[UnifiedDatabaseFix v2] Injected HTML for ${db.name}`);
      }
    });
  }
  
  /**
   * 4. グループの可視性を確保
   */
  function ensureGroupVisibility() {
    const allGroups = document.querySelectorAll('.notion-collection-group, .notion-list-view-group');
    allGroups.forEach(group => {
      group.style.display = 'block';
      group.style.visibility = 'visible';
      group.style.opacity = '1';
    });
  }
  
  /**
   * メイン実行関数
   */
  async function executeFixes() {
    // recordMapの準備を待つ
    fixState.recordMapReady = checkRecordMapReady();
    
    if (!fixState.recordMapReady) {
      console.log('[UnifiedDatabaseFix v2] Waiting for recordMap...');
      setTimeout(executeFixes, 500);
      return;
    }
    
    console.log('[UnifiedDatabaseFix v2] recordMap ready, queuing fixes...');
    
    // 修正をキューに追加（優先度順）
    queueFix('Basic Group Display', fixBasicGroupDisplay, 1);
    queueFix('Switch to List View', switchToListView, 2);
    queueFix('Fix Grouped Databases', fixGroupedDatabases, 3);
    queueFix('Ensure Group Visibility', ensureGroupVisibility, 4);
    
    // キューを処理
    await processQueue();
    
    console.log('[UnifiedDatabaseFix v2] All fixes completed');
  }
  
  /**
   * MutationObserverで動的な変更を監視
   */
  const observer = new MutationObserver((mutations) => {
    // 新しいデータベースが追加された場合
    const hasNewDatabase = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        return node.nodeType === 1 && 
               (node.classList?.contains('notion-collection') ||
                node.querySelector?.('.notion-collection'));
      });
    });
    
    if (hasNewDatabase) {
      console.log('[UnifiedDatabaseFix v2] New database detected');
      setTimeout(() => {
        fixState.processedBlocks.clear(); // 処理済みをリセット
        executeFixes();
      }, 1000);
    }
  });
  
  // 監視開始
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // 初回実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      fixState.domReady = true;
      executeFixes();
    });
  } else {
    fixState.domReady = true;
    executeFixes();
  }
  
})();