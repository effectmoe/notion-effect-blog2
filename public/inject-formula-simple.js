// シンプルな数式プロパティ挿入スクリプト
(function() {
  console.log('[Formula Script] Loading...');
  
  async function fillFormulas() {
    const elements = document.querySelectorAll('.notion-property-formula');
    console.log('[Formula Script] Found formula elements:', elements.length);
    
    const listItems = document.querySelectorAll('.notion-list-item');
    console.log('[Formula Script] Found list items:', listItems.length);
    
    if (elements.length === 0 && listItems.length === 0) {
      console.log('[Formula Script] No elements found to process');
      return;
    }
    
    // recordMapから情報を取得
    let recordMap = null;
    if (window.__NEXT_DATA__?.props?.pageProps?.recordMap) {
      recordMap = window.__NEXT_DATA__.props.pageProps.recordMap;
    }
    
    if (!recordMap) {
      console.log('[Formula Script] No recordMap found');
      return;
    }
    
    // タイトルでページを検索する関数
    function findPageByTitle(title) {
      for (const [blockId, blockData] of Object.entries(recordMap.block)) {
        const block = blockData?.value;
        if (block?.type === 'page' && block?.properties?.title) {
          const blockTitle = block.properties.title[0]?.[0];
          if (blockTitle === title) {
            return blockId;
          }
        }
      }
      return null;
    }
    
    // 各リストアイテムを処理
    listItems.forEach(async (item, index) => {
      // CustomPageLinkコンポーネントでdivに変更したため、両方を探す
      const link = item.querySelector('a') || item.querySelector('[role="link"]') || item.querySelector('.notion-page-link');
      // タイトルを取得（リストアイテム内のタイトル要素から）
      const titleEl = item.querySelector('.notion-list-item-title') || link;
      const title = titleEl?.textContent?.trim();
      const formulaEl = item.querySelector('.notion-property-formula');
      
      // デバッグ情報
      if (index === 0) {
        console.log('[Formula Script] First item debug:', {
          item: item,
          link: link,
          titleEl: titleEl,
          title: title,
          formulaEl: formulaEl,
          innerHTML: item.innerHTML.substring(0, 200)
        });
      }
      
      if (title && formulaEl && !formulaEl.textContent.trim()) {
        // タイトルでページを検索
        const pageId = findPageByTitle(title);
        
        if (pageId) {
          try {
            const response = await fetch(`/api/test-formula?pageId=${pageId.replace(/-/g, '')}`);
            const data = await response.json();
            
            if (data.success && data.formulaValue) {
              formulaEl.textContent = data.formulaValue;
              formulaEl.classList.add('formula-filled');
              console.log('[Formula Script] Set value:', data.formulaValue);
            }
          } catch (err) {
            console.error('[Formula Script] Error:', err);
          }
        }
      }
    });
  }
  
  // ページ読み込み完了後に実行 - ハイドレーション後まで待つ
  // Increased delay to ensure hydration is complete
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // React hydrationが完了するまで待つ
      setTimeout(fillFormulas, 5000);
    });
  } else {
    // 既にロード済みの場合も、hydrationを考慮して待つ
    setTimeout(fillFormulas, 5000);
  }
  
  // ページ遷移を監視
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(fillFormulas, 5000);
    }
  }).observe(document.body, { subtree: true, childList: true });
  
  // グローバルに公開
  window.fillFormulas = fillFormulas;
})();