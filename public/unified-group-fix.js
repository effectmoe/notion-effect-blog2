/**
 * 統合グループ表示修正スクリプト
 * 都道府県データベースの成功要因を全てのグループ化されたデータベースに適用
 */

(function() {
  'use strict';
  
  console.log('🔧 Unified Group Fix: Starting...');
  
  // グループ化されたデータベースを修正する統合関数
  function fixAllGroupedDatabases() {
    // 1. 全てのコレクションビューを検索
    const collectionViews = document.querySelectorAll('.notion-collection-view');
    
    collectionViews.forEach(view => {
      const blockElement = view.closest('[class*="notion-block-"]');
      if (!blockElement) return;
      
      // ブロックIDを抽出
      const blockId = blockElement.className.match(/notion-block-([a-f0-9]+)/)?.[1];
      if (!blockId) return;
      
      console.log(`📊 Processing collection: ${blockId}`);
      
      // 2. 両方のグループクラスをチェック
      const hasOldGroups = view.querySelectorAll('.notion-list-view-group').length > 0;
      const hasNewGroups = view.querySelectorAll('.notion-collection-group').length > 0;
      
      if (hasOldGroups || hasNewGroups) {
        console.log(`  ✓ Found groups (old: ${hasOldGroups}, new: ${hasNewGroups})`);
        
        // 3. 古いクラスを新しいクラスに統一
        if (hasOldGroups) {
          const oldGroups = view.querySelectorAll('.notion-list-view-group');
          oldGroups.forEach(group => {
            group.classList.add('notion-collection-group');
            console.log('  → Converted old group class to new');
          });
          
          const oldTitles = view.querySelectorAll('.notion-list-view-group-title');
          oldTitles.forEach(title => {
            title.classList.add('notion-collection-group-title');
          });
        }
        
        // 4. グループの表示を強制
        const allGroups = view.querySelectorAll('.notion-collection-group');
        allGroups.forEach(group => {
          group.style.display = 'block';
          group.style.visibility = 'visible';
          group.style.opacity = '1';
          
          // グループタイトルも表示
          const title = group.querySelector('.notion-collection-group-title');
          if (title) {
            title.style.display = 'list-item';
            title.style.visibility = 'visible';
            title.style.opacity = '1';
          }
        });
        
        // 5. ビュータイプをリストに設定（FAQマスター対策）
        const listView = view.querySelector('.notion-list-view');
        if (!listView && view.querySelector('.notion-gallery-view')) {
          console.log('  → Converting gallery to list view for grouping');
          const galleryView = view.querySelector('.notion-gallery-view');
          galleryView.classList.remove('notion-gallery-view');
          galleryView.classList.add('notion-list-view');
        }
      }
      

      // 6. FAQマスターとカフェキネシコンテンツの特別処理
      const normalizedBlockId = blockId.replace(/-/g, '');
      const targetDatabases = {
        '215b802cb0c6804a8858d72d4df6f128': 'FAQマスター',
        '216b802cb0c6808fac1ddbf03d973fec': 'カフェキネシコンテンツ２'
      };
      
      if (targetDatabases[normalizedBlockId]) {
        console.log(`  🎯 ${targetDatabases[normalizedBlockId]} detected, applying special handling`);

        
        // ビューが空の場合、recordMapからデータを再構築
        if (!view.querySelector('.notion-list-item') && window.recordMap) {
          reconstructDatabase(view, blockId, targetDatabases[normalizedBlockId]);
        }
      }
    });
  }
  
  // データベースを再構築
  function reconstructDatabase(viewElement, blockId, dbName) {
    if (!window.recordMap) return;
    
    const cleanBlockId = blockId.replace(/-/g, '');
    const block = window.recordMap.block[blockId]?.value || 
                 window.recordMap.block[cleanBlockId]?.value;
    
    if (!block || !block.collection_id) return;
    
    console.log(`  🔨 Reconstructing ${dbName} from recordMap`);
    
    // コレクションデータを探す
    const collection = window.recordMap.collection[block.collection_id]?.value;
    if (!collection) return;
    
    // ページブロックを収集
    const pages = [];
    Object.entries(window.recordMap.block).forEach(([id, data]) => {
      const pageBlock = data?.value;
      if (pageBlock?.parent_id === block.collection_id && 
          pageBlock?.parent_table === 'collection') {
        pages.push(pageBlock);
      }
    });
    
    if (pages.length === 0) return;
    
    console.log(`  📝 Found ${pages.length} FAQ items`);
    
    // グループ化プロパティを決定
    let groupPropertyId = 'oa:|'; // FAQマスターのデフォルト
    let groupPropertyName = 'カテゴリ';
    
    if (dbName === 'カフェキネシコンテンツ２') {
      groupPropertyId = 'status';
      groupPropertyName = 'Status';
    }
    
    // プロパティでグループ化
    const groups = {};
    pages.forEach(page => {
      const properties = page.properties || {};
      let groupValue = 'その他';
      
      // グループ化プロパティを探す
      for (const [propId, propValue] of Object.entries(properties)) {
        if (propValue?.[0]?.[0] === groupPropertyName || propId === groupPropertyId) {
          groupValue = propValue?.[0]?.[0] || 'その他';
          break;
        }
      }
      
      if (!groups[groupValue]) groups[groupValue] = [];
      groups[groupValue].push(page);
    });
    
    // DOMを構築
    const container = document.createElement('div');
    container.className = 'notion-list-view';
    
    Object.entries(groups).forEach(([category, items]) => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'notion-collection-group';
      groupDiv.style.display = 'block';
      
      const groupTitle = document.createElement('summary');
      groupTitle.className = 'notion-collection-group-title';
      groupTitle.style.display = 'list-item';
      groupTitle.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5em;">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M6.02734 8.80274C6.27148 8.80274 6.47168 8.71484 6.66211 8.51465L10.2803 4.82324C10.4268 4.67676 10.5 4.49609 10.5 4.28125C10.5 3.85156 10.1484 3.5 9.72363 3.5C9.50879 3.5 9.30859 3.58789 9.15234 3.74902L6.03223 6.9668L2.90722 3.74902C2.74609 3.58789 2.55078 3.5 2.33105 3.5C1.90137 3.5 1.55469 3.85156 1.55469 4.28125C1.55469 4.49609 1.62793 4.67676 1.77441 4.82324L5.39258 8.51465C5.58789 8.71484 5.78808 8.80274 6.02734 8.80274Z" fill="currentColor"></path>
          </svg>
          <span>${category}</span>
          <span style="opacity: 0.5; font-size: 0.9em;">(${items.length})</span>
        </div>
      `;
      
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'notion-list-collection';
      
      items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'notion-list-item';
        
        // タイトルを取得
        let title = 'Untitled';
        const titleProp = item.properties?.title || item.properties?.['title'];
        if (titleProp?.[0]?.[0]) {
          title = titleProp[0][0];
        }
        
        itemDiv.innerHTML = `
          <div class="notion-list-item-title">
            <span>${title}</span>
          </div>
        `;
        
        itemsContainer.appendChild(itemDiv);
      });
      
      groupDiv.appendChild(groupTitle);
      groupDiv.appendChild(itemsContainer);
      container.appendChild(groupDiv);
    });
    
    // 既存のコンテンツを置き換え
    viewElement.innerHTML = '';
    viewElement.appendChild(container);
    
    console.log(`  ✅ ${dbName} reconstructed successfully`);
  }
  
  // 実行タイミングの最適化
  function runWithRetries() {
    fixAllGroupedDatabases();
    
    // 複数回実行して、遅延読み込みされるコンテンツもキャッチ
    // 100msを追加してより早い段階でも実行
    const timings = [100, 500, 1000, 2000, 3000];
    timings.forEach(delay => {
      setTimeout(fixAllGroupedDatabases, delay);
    });
  }
  
  // DOMの変更を監視
  const observer = new MutationObserver(function(mutations) {
    const hasRelevantChanges = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        return node.nodeType === 1 && (
          node.classList?.contains('notion-collection-view') ||
          node.querySelector?.('.notion-collection-view')
        );
      });
    });
    
    if (hasRelevantChanges) {
      console.log('🔧 Unified Group Fix: Detected new content');
      setTimeout(fixAllGroupedDatabases, 100);
    }
  });
  
  // 開始
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runWithRetries);
  } else {
    runWithRetries();
  }
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('🔧 Unified Group Fix: Initialized');
})();