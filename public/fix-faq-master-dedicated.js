/**
 * FAQマスター専用の修正スクリプト
 * 都道府県データベースの成功パターンを基に作成
 */
(function() {
  'use strict';
  
  console.log('🔧 [FAQMasterFix] Starting dedicated FAQ Master fix...');
  
  // FAQマスターのブロックID
  const FAQ_MASTER_BLOCK_ID = '212b802cb0c680b3b04afec4203ee8d7';
  const FAQ_MASTER_COLLECTION_ID = '212b802c-b0c6-8014-9263-000b71bd252e';
  
  function ensureFAQMasterDisplay() {
    const faqBlock = document.querySelector(`.notion-block-${FAQ_MASTER_BLOCK_ID}`);
    
    if (!faqBlock) {
      console.log('[FAQMasterFix] FAQ Master block not found yet, retrying...');
      return false;
    }
    
    console.log('[FAQMasterFix] Found FAQ Master block');
    
    // 1. ビュータイプをリストビューに強制変換
    const viewTypes = faqBlock.querySelectorAll('.notion-collection-view-tabs-content > div');
    let listView = faqBlock.querySelector('.notion-list-view');
    
    if (!listView && viewTypes.length > 0) {
      console.log('[FAQMasterFix] No list view found, trying to switch view type...');
      
      // タブをクリックしてリストビューを探す
      const tabs = faqBlock.querySelectorAll('.notion-collection-view-tab');
      for (let i = 0; i < tabs.length; i++) {
        tabs[i].click();
        // 少し待つ
        setTimeout(() => {
          listView = faqBlock.querySelector('.notion-list-view');
          if (listView) {
            console.log('[FAQMasterFix] Found list view after clicking tab');
          }
        }, 100);
      }
    }
    
    // 2. recordMapからデータを取得して再構築
    if (window.recordMap && window.recordMap.block) {
      const block = window.recordMap.block[FAQ_MASTER_BLOCK_ID]?.value;
      const collectionId = block?.collection_id || FAQ_MASTER_COLLECTION_ID;
      
      if (collectionId && window.recordMap.collection) {
        const collection = window.recordMap.collection[collectionId]?.value;
        
        if (collection) {
          console.log('[FAQMasterFix] Found collection data:', collection.name);
          
          // コレクションのアイテムを収集
          const items = [];
          Object.entries(window.recordMap.block).forEach(([blockId, blockData]) => {
            const block = blockData?.value;
            if (block?.parent_id === collectionId && block?.properties) {
              items.push(block);
            }
          });
          
          console.log(`[FAQMasterFix] Found ${items.length} FAQ items`);
          
          if (items.length > 0) {
            // グループ化してHTMLを生成
            const groups = {};
            items.forEach(item => {
              const category = item.properties?.['カテゴリ']?.select?.name || 
                             item.properties?.['oa:|']?.select?.name || 
                             'その他';
              if (!groups[category]) {
                groups[category] = [];
              }
              groups[category].push(item);
            });
            
            // HTMLを生成
            let html = '<div class="notion-list-view"><div class="notion-list-collection">';
            
            Object.entries(groups).forEach(([groupName, groupItems]) => {
              html += `
                <div class="notion-collection-group" style="display: block !important; visibility: visible !important;">
                  <summary class="notion-collection-group-title" style="display: list-item !important; cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 0.5em;">
                      <svg width="12" height="12" viewBox="0 0 12 12" style="transform: rotate(90deg); transition: transform 200ms;">
                        <path d="M6.02734 8.80274C6.27148 8.80274 6.47168 8.71484 6.66211 8.51465L10.2803 4.82324C10.4268 4.67676 10.5 4.49609 10.5 4.28125C10.5 3.85156 10.1484 3.5 9.72363 3.5C9.50879 3.5 9.30859 3.58789 9.15234 3.74902L6.03223 6.9668L2.90722 3.74902C2.74609 3.58789 2.55078 3.5 2.33105 3.5C1.90137 3.5 1.55469 3.85156 1.55469 4.28125C1.55469 4.49609 1.62793 4.67676 1.77441 4.82324L5.39258 8.51465C5.58789 8.71484 5.78808 8.80274 6.02734 8.80274Z" fill="currentColor"></path>
                      </svg>
                      <span style="font-weight: 600;">${groupName}</span>
                      <span style="opacity: 0.5; font-size: 0.9em;">(${groupItems.length})</span>
                    </div>
                  </summary>
                  <div class="notion-list-collection" style="display: block !important;">
              `;
              
              groupItems.forEach(item => {
                const title = item.properties?.title?.title?.[0]?.text?.content || 
                            item.properties?.['タイトル']?.title?.[0]?.text?.content || 
                            'Untitled';
                const pageId = item.id;
                
                html += `
                  <div class="notion-list-item" style="display: block !important;">
                    <div class="notion-list-item-title">
                      <a href="/${pageId.replace(/-/g, '')}" style="display: block; padding: 8px 0; text-decoration: none; color: inherit;">
                        <span>${title}</span>
                      </a>
                    </div>
                  </div>
                `;
              });
              
              html += '</div></div>';
            });
            
            html += '</div></div>';
            
            // 既存のコンテンツを置き換え
            const existingContent = faqBlock.querySelector('.notion-collection-view-type');
            if (existingContent) {
              console.log('[FAQMasterFix] Replacing existing content with grouped list');
              existingContent.innerHTML = html;
              
              // トグル機能を追加
              const groupTitles = existingContent.querySelectorAll('.notion-collection-group-title');
              groupTitles.forEach(title => {
                title.addEventListener('click', function() {
                  const group = this.parentElement;
                  const content = group.querySelector('.notion-list-collection');
                  const arrow = this.querySelector('svg');
                  
                  if (content.style.display === 'none') {
                    content.style.display = 'block';
                    arrow.style.transform = 'rotate(90deg)';
                  } else {
                    content.style.display = 'none';
                    arrow.style.transform = 'rotate(0deg)';
                  }
                });
              });
              
              return true;
            }
          }
        }
      }
    }
    
    // 3. 既存のグループ要素を強制表示（フォールバック）
    const groups = faqBlock.querySelectorAll('.notion-collection-group, .notion-list-view-group');
    if (groups.length > 0) {
      console.log(`[FAQMasterFix] Found ${groups.length} existing groups, making them visible`);
      groups.forEach(group => {
        group.style.display = 'block';
        group.style.visibility = 'visible';
        group.style.opacity = '1';
      });
      return true;
    }
    
    return false;
  }
  
  // 実行タイミングを調整
  let attempts = 0;
  const maxAttempts = 20;
  
  function tryFix() {
    attempts++;
    console.log(`[FAQMasterFix] Attempt ${attempts}/${maxAttempts}`);
    
    if (ensureFAQMasterDisplay()) {
      console.log('[FAQMasterFix] ✅ FAQ Master fix applied successfully');
      return;
    }
    
    if (attempts < maxAttempts) {
      setTimeout(tryFix, 500);
    } else {
      console.log('[FAQMasterFix] ❌ Max attempts reached');
    }
  }
  
  // 初回実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryFix);
  } else {
    tryFix();
  }
  
  // MutationObserverでの監視も追加
  const observer = new MutationObserver((mutations) => {
    const faqBlock = document.querySelector(`.notion-block-${FAQ_MASTER_BLOCK_ID}`);
    if (faqBlock && !faqBlock.dataset.faqFixed) {
      console.log('[FAQMasterFix] FAQ Master detected via MutationObserver');
      faqBlock.dataset.faqFixed = 'true';
      ensureFAQMasterDisplay();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})();