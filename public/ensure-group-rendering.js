/**
 * グループ化レンダリングを確実に実行するスクリプト
 * unified-group-fix.jsの後に実行
 */
(function() {
  'use strict';
  
  function ensureGroupRendering() {
    console.log('[EnsureGroupRendering] Starting ensure group rendering...');
    
    // FAQマスターとカフェキネシコンテンツを特定
    const targetDatabases = [
      {
        blockId: '215b802c-b0c6-804a-8858-d72d4df6f128',
        collectionId: '212b802c-b0c6-8014-9263-000b71bd252e',
        name: 'FAQマスター',
        groupByProperty: 'oa:|'
      },
      {
        blockId: '216b802c-b0c6-808f-ac1d-dbf03d973fec',
        collectionId: '216b802c-b0c6-81c0-a940-000b2f6a23b3',
        name: 'カフェキネシコンテンツ２',
        groupByProperty: 'status'
      }
    ];
    
    targetDatabases.forEach(db => {
      const normalizedBlockId = db.blockId.replace(/-/g, '');
      
      // 要素を探す
      const element = document.querySelector(`[data-block-id="${db.blockId}"]`) ||
                     document.querySelector(`.notion-block-${normalizedBlockId}`);
      
      if (element) {
        console.log(`[EnsureGroupRendering] Found element for ${db.name}`);
        
        // グループ要素が存在するか確認
        const groupElements = element.querySelectorAll('.notion-collection-group');
        if (groupElements.length === 0) {
          console.warn(`[EnsureGroupRendering] No group elements found for ${db.name}, applying fallback`);
          applyFallbackRendering(element, db);
        } else {
          console.log(`[EnsureGroupRendering] ${db.name} has ${groupElements.length} groups`);
          
          // グループが空かどうか確認
          let emptyGroups = 0;
          groupElements.forEach(group => {
            const items = group.querySelectorAll('.notion-list-item, .notion-collection-item');
            if (items.length === 0) {
              emptyGroups++;
            }
          });
          
          if (emptyGroups > 0) {
            console.warn(`[EnsureGroupRendering] ${db.name} has ${emptyGroups} empty groups, applying content fix`);
            fixEmptyGroups(element, db);
          }
        }
      } else {
        console.warn(`[EnsureGroupRendering] Element not found for ${db.name}`);
      }
    });
  }
  
  // フォールバックレンダリング
  function applyFallbackRendering(element, dbInfo) {
    console.log(`[EnsureGroupRendering] Applying fallback rendering for ${dbInfo.name}`);
    
    // recordMapからデータを取得
    if (!window.recordMap) {
      console.error('[EnsureGroupRendering] No recordMap available');
      return;
    }
    
    const collectionQuery = window.recordMap.collection_query?.[dbInfo.collectionId];
    if (!collectionQuery) {
      console.error(`[EnsureGroupRendering] No collection_query for ${dbInfo.name}`);
      return;
    }
    
    // ビューIDを見つける
    const viewId = Object.keys(collectionQuery)[0];
    const queryData = collectionQuery[viewId];
    
    if (!queryData) {
      console.error(`[EnsureGroupRendering] No query data for view ${viewId}`);
      return;
    }
    
    // グループデータを抽出
    const groups = {};
    Object.keys(queryData).forEach(key => {
      if (key.startsWith('results:select:')) {
        const groupName = key.replace('results:select:', '');
        groups[groupName] = queryData[key];
      }
    });
    
    console.log(`[EnsureGroupRendering] Found ${Object.keys(groups).length} groups`);
    
    // HTMLを生成
    const container = element.querySelector('.notion-collection-view-type-list') || element;
    let html = '';
    
    Object.entries(groups).forEach(([groupName, groupData]) => {
      html += `
        <div class="notion-collection-group">
          <summary class="notion-collection-group-title" style="cursor: pointer; padding: 8px 0;">
            <div style="display: flex; align-items: center; gap: 0.5em;">
              <svg width="12" height="12" viewBox="0 0 12 12" style="transition: transform 0.2s;">
                <path d="M6.02734 8.80274C6.27148 8.80274 6.47168 8.71484 6.66211 8.51465L10.2803 4.82324C10.4268 4.67676 10.5 4.49609 10.5 4.28125C10.5 3.85156 10.1484 3.5 9.72363 3.5C9.50879 3.5 9.30859 3.58789 9.15234 3.74902L6.03223 6.9668L2.90722 3.74902C2.74609 3.58789 2.55078 3.5 2.33105 3.5C1.90137 3.5 1.55469 3.85156 1.55469 4.28125C1.55469 4.49609 1.62793 4.67676 1.77441 4.82324L5.39258 8.51465C5.58789 8.71484 5.78808 8.80274 6.02734 8.80274Z" fill="currentColor"></path>
              </svg>
              <span style="font-weight: 500;">${groupName}</span>
              <span style="opacity: 0.5; font-size: 0.9em;">(${groupData.blockIds?.length || 0})</span>
            </div>
          </summary>
          <div class="notion-list-collection" style="padding-left: 20px;">
      `;
      
      // アイテムを追加
      if (groupData.blockIds && Array.isArray(groupData.blockIds)) {
        groupData.blockIds.forEach(blockId => {
          const block = window.recordMap.block[blockId]?.value;
          if (block && block.properties) {
            const title = getBlockTitle(block);
            html += `
              <div class="notion-list-item" style="padding: 4px 0;">
                <div class="notion-list-item-title">
                  <span>${title}</span>
                </div>
              </div>
            `;
          }
        });
      }
      
      html += `
          </div>
        </div>
      `;
    });
    
    if (html) {
      container.innerHTML = html;
      console.log(`[EnsureGroupRendering] Fallback rendering applied for ${dbInfo.name}`);
      
      // クリックイベントを追加
      addGroupToggleEvents(container);
    }
  }
  
  // 空のグループを修正
  function fixEmptyGroups(element, dbInfo) {
    console.log(`[EnsureGroupRendering] Fixing empty groups for ${dbInfo.name}`);
    
    const collectionQuery = window.recordMap?.collection_query?.[dbInfo.collectionId];
    if (!collectionQuery) return;
    
    const viewId = Object.keys(collectionQuery)[0];
    const queryData = collectionQuery[viewId];
    
    const groupElements = element.querySelectorAll('.notion-collection-group');
    groupElements.forEach(groupEl => {
      const titleEl = groupEl.querySelector('.notion-collection-group-title');
      if (!titleEl) return;
      
      const titleText = titleEl.textContent.trim();
      const groupName = titleText.split('(')[0].trim();
      
      // このグループのデータを探す
      const groupKey = `results:select:${groupName}`;
      const groupData = queryData?.[groupKey];
      
      if (groupData && groupData.blockIds && groupData.blockIds.length > 0) {
        const itemsContainer = groupEl.querySelector('.notion-list-collection');
        if (itemsContainer && itemsContainer.children.length === 0) {
          console.log(`[EnsureGroupRendering] Adding ${groupData.blockIds.length} items to group ${groupName}`);
          
          let itemsHtml = '';
          groupData.blockIds.forEach(blockId => {
            const block = window.recordMap.block[blockId]?.value;
            if (block && block.properties) {
              const title = getBlockTitle(block);
              itemsHtml += `
                <div class="notion-list-item" style="padding: 4px 0;">
                  <div class="notion-list-item-title">
                    <span>${title}</span>
                  </div>
                </div>
              `;
            }
          });
          
          itemsContainer.innerHTML = itemsHtml;
        }
      }
    });
  }
  
  // ブロックのタイトルを取得
  function getBlockTitle(block) {
    if (!block.properties) return 'Untitled';
    
    // タイトルプロパティを探す
    const titleProperty = block.properties.title || 
                         block.properties['Name'] || 
                         block.properties['名前'] ||
                         Object.values(block.properties)[0];
    
    if (titleProperty && Array.isArray(titleProperty)) {
      return titleProperty[0]?.[0] || 'Untitled';
    }
    
    return 'Untitled';
  }
  
  // グループの展開/折りたたみイベントを追加
  function addGroupToggleEvents(container) {
    const summaries = container.querySelectorAll('.notion-collection-group-title');
    summaries.forEach(summary => {
      summary.addEventListener('click', function() {
        const group = this.parentElement;
        const content = group.querySelector('.notion-list-collection');
        const arrow = this.querySelector('svg');
        
        if (content.style.display === 'none') {
          content.style.display = 'block';
          arrow.style.transform = 'rotate(0deg)';
        } else {
          content.style.display = 'none';
          arrow.style.transform = 'rotate(-90deg)';
        }
      });
    });
  }
  
  // 実行タイミング
  const timings = [100, 500, 1000, 2000, 3000, 4000];
  timings.forEach(delay => {
    setTimeout(ensureGroupRendering, delay);
  });
  
  // DOMContentLoadedでも実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureGroupRendering);
  }
  
  // ページ遷移検知
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(ensureGroupRendering, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();