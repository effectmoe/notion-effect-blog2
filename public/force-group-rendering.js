/**
 * 強制的にグループ化表示を実装するスクリプト
 * FAQマスターとカフェキネシコンテンツ向け
 */
(function() {
  'use strict';
  
  console.log('🎯 [ForceGroupRendering] Starting force group rendering...');
  
  // ターゲットデータベース設定
  const databases = [
    {
      name: 'FAQマスター',
      blockIds: [
        '215b802c-b0c6-804a-8858-d72d4df6f128',
        '215b802cb0c6804a8858d72d4df6f128'
      ],
      collectionId: '212b802c-b0c6-8014-9263-000b71bd252e',
      groupProperty: 'カテゴリ'
    },
    {
      name: 'カフェキネシコンテンツ',
      blockIds: [
        '216b802c-b0c6-808f-ac1d-dbf03d973fec',
        '216b802cb0c6808fac1ddbf03d973fec'
      ],
      collectionId: '216b802c-b0c6-81c0-a940-000b2f6a23b3',
      groupProperty: 'カテゴリ'
    }
  ];
  
  function forceGroupRendering() {
    if (!window.recordMap) {
      console.log('[ForceGroupRendering] recordMap not ready, retrying...');
      setTimeout(forceGroupRendering, 1000);
      return;
    }
    
    databases.forEach(db => {
      console.log(`[ForceGroupRendering] Processing ${db.name}...`);
      
      // 複数のblockIdを試す
      let blockElement = null;
      for (const blockId of db.blockIds) {
        blockElement = document.querySelector(`.notion-block-${blockId}`);
        if (blockElement) {
          console.log(`[ForceGroupRendering] Found block element for ${db.name} with ID: ${blockId}`);
          break;
        }
      }
      
      if (!blockElement) {
        console.log(`[ForceGroupRendering] Block element not found for ${db.name}`);
        
        // DOMを検索して関連する要素を探す
        const allCollectionViews = document.querySelectorAll('.notion-collection-view');
        console.log(`[ForceGroupRendering] Found ${allCollectionViews.length} collection views`);
        
        allCollectionViews.forEach((view, index) => {
          const parent = view.closest('[class*="notion-block"]');
          if (parent) {
            const classes = Array.from(parent.classList);
            console.log(`[ForceGroupRendering] Collection view ${index} parent classes:`, classes);
          }
        });
        
        return;
      }
      
      // コレクションデータを取得
      const collection = window.recordMap.collection?.[db.collectionId]?.value;
      if (!collection) {
        console.log(`[ForceGroupRendering] No collection data for ${db.name}`);
        return;
      }
      
      // アイテムを収集
      const items = [];
      Object.entries(window.recordMap.block).forEach(([blockId, blockData]) => {
        const block = blockData?.value;
        if (block?.parent_id === db.collectionId && block?.properties) {
          items.push(block);
        }
      });
      
      console.log(`[ForceGroupRendering] Found ${items.length} items for ${db.name}`);
      
      if (items.length === 0) return;
      
      // グループ化
      const groups = {};
      items.forEach(item => {
        let categoryValue = 'その他';
        
        // プロパティから値を取得
        Object.entries(item.properties).forEach(([propKey, propValue]) => {
          // selectプロパティ
          if (propValue?.select?.name) {
            categoryValue = propValue.select.name;
          }
          // multi_selectプロパティ
          else if (propValue?.multi_select && propValue.multi_select.length > 0) {
            categoryValue = propValue.multi_select[0].name;
          }
          // 旧形式のプロパティ
          else if (Array.isArray(propValue) && propValue[0]?.[0]) {
            categoryValue = propValue[0][0];
          }
        });
        
        if (!groups[categoryValue]) {
          groups[categoryValue] = [];
        }
        groups[categoryValue].push(item);
      });
      
      console.log(`[ForceGroupRendering] Created ${Object.keys(groups).length} groups for ${db.name}:`, Object.keys(groups));
      
      // 既存のコンテンツを探す
      const collectionView = blockElement.querySelector('.notion-collection-view') || blockElement;
      const existingContent = collectionView.querySelector('.notion-collection-view-type') || 
                            collectionView.querySelector('.notion-list-view') ||
                            collectionView.querySelector('.notion-table-view');
      
      if (!existingContent) {
        console.log(`[ForceGroupRendering] No existing content found for ${db.name}`);
        return;
      }
      
      // グループ化されたHTMLを生成
      let html = '<div class="notion-list-view force-grouped"><div class="notion-list-collection">';
      
      Object.entries(groups).forEach(([groupName, groupItems]) => {
        html += `
          <div class="notion-collection-group" style="display: block !important; margin-bottom: 1rem;">
            <details open style="margin-bottom: 0.5rem;">
              <summary class="notion-collection-group-title" style="
                display: list-item !important;
                cursor: pointer;
                padding: 0.5rem;
                font-weight: 600;
                background: rgba(0,0,0,0.03);
                border-radius: 4px;
                margin-bottom: 0.5rem;
              ">
                <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                  <svg width="12" height="12" viewBox="0 0 12 12" style="transform: rotate(90deg); transition: transform 0.2s;">
                    <path d="M6.02734 8.80274C6.27148 8.80274 6.47168 8.71484 6.66211 8.51465L10.2803 4.82324C10.4268 4.67676 10.5 4.49609 10.5 4.28125C10.5 3.85156 10.1484 3.5 9.72363 3.5C9.50879 3.5 9.30859 3.58789 9.15234 3.74902L6.03223 6.9668L2.90722 3.74902C2.74609 3.58789 2.55078 3.5 2.33105 3.5C1.90137 3.5 1.55469 3.85156 1.55469 4.28125C1.55469 4.49609 1.62793 4.67676 1.77441 4.82324L5.39258 8.51465C5.58789 8.71484 5.78808 8.80274 6.02734 8.80274Z" fill="currentColor"></path>
                  </svg>
                  <span>${groupName}</span>
                  <span style="opacity: 0.6; font-weight: normal;">(${groupItems.length})</span>
                </span>
              </summary>
              <div class="notion-list-collection" style="padding-left: 1rem;">
        `;
        
        groupItems.forEach(item => {
          // タイトルを取得
          let title = 'Untitled';
          Object.entries(item.properties).forEach(([propKey, propValue]) => {
            if (propKey === 'title' || propKey === 'Title' || propKey === 'タイトル') {
              if (propValue?.title?.[0]?.text?.content) {
                title = propValue.title[0].text.content;
              } else if (Array.isArray(propValue) && propValue[0]?.[0]) {
                title = propValue[0][0];
              }
            }
          });
          
          const itemUrl = `/${item.id.replace(/-/g, '')}`;
          html += `
            <div class="notion-list-item" style="
              padding: 0.5rem 0;
              border-bottom: 1px solid rgba(0,0,0,0.05);
            ">
              <a href="${itemUrl}" style="
                color: inherit;
                text-decoration: none;
                display: block;
                padding: 0.25rem 0;
              ">
                ${title}
              </a>
            </div>
          `;
        });
        
        html += '</div></details></div>';
      });
      
      html += '</div></div>';
      
      // コンテンツを置き換え
      existingContent.innerHTML = html;
      existingContent.classList.add('force-grouped-content');
      
      console.log(`[ForceGroupRendering] Successfully rendered groups for ${db.name}`);
      
      // details要素のイベントを設定
      existingContent.querySelectorAll('details').forEach(details => {
        details.addEventListener('toggle', function() {
          const svg = this.querySelector('svg');
          if (svg) {
            svg.style.transform = this.open ? 'rotate(90deg)' : 'rotate(0deg)';
          }
        });
      });
    });
  }
  
  // 初回実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceGroupRendering);
  } else {
    setTimeout(forceGroupRendering, 1000);
  }
  
  // ページ遷移時にも実行
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(forceGroupRendering, 1000);
    }
  }).observe(document, {subtree: true, childList: true});
  
})();