// 既存の空の数式プロパティ要素に値を入れる

export function fillFormulaProperties() {
  if (typeof window === 'undefined') return;
  
  // グローバルに公開
  (window as any).fillFormulaProperties = fillFormulaProperties;

  const formulaCache = new Map<string, any>();

  // ページIDから数式プロパティを取得
  async function fetchFormulaValue(pageId: string) {
    if (formulaCache.has(pageId)) {
      return formulaCache.get(pageId);
    }

    try {
      const response = await fetch(`/api/test-formula?pageId=${pageId}`);
      const data = await response.json();
      if (data.success && data.formulaValue) {
        formulaCache.set(pageId, data.formulaValue);
        return data.formulaValue;
      }
    } catch (error) {
      console.error('Failed to fetch formula:', error);
    }
    return null;
  }

  async function fillEmptyFormulas() {
    // すべての数式プロパティ要素を探す
    const formulaElements = document.querySelectorAll('.notion-property-formula');
    console.log('[Formula] 見つかった数式要素:', formulaElements.length);
    
    for (const element of formulaElements) {
      // すでに値がある場合はスキップ
      if (element.textContent && element.textContent.trim()) continue;
      
      // 親要素からページIDを探す
      let pageId: string | null = null;
      let currentElement: Element | null = element;
      
      // 親要素を辿ってページリンクを探す
      while (currentElement && !pageId) {
        const parentRow = currentElement.closest('.notion-collection-item, .notion-list-item, .notion-table-row, .notion-gallery-card');
        if (parentRow) {
          const link = parentRow.querySelector('a[href*="/"]');
          if (link) {
            const href = link.getAttribute('href');
            if (href) {
              const id = href.split('/').pop()?.replace(/-/g, '');
              if (id && id.length >= 32) {
                pageId = id;
              }
            }
          }
          break;
        }
        currentElement = currentElement.parentElement;
      }
      
      if (!pageId) {
        console.log('[Formula] ページIDが見つかりません:', element);
        continue;
      }
      
      console.log('[Formula] ページID取得:', pageId);
      
      // 数式プロパティの値を取得して設定
      const value = await fetchFormulaValue(pageId);
      console.log('[Formula] 取得した値:', value);
      
      if (value) {
        element.textContent = value;
        element.classList.add('formula-filled');
        console.log('[Formula] 値を設定しました:', element);
      } else {
        console.log('[Formula] 値が取得できませんでした');
      }
    }
  }

  // 実行
  const run = () => {
    // 少し遅延させて、DOMが完全に構築されるのを待つ
    setTimeout(fillEmptyFormulas, 1000);
  };

  // 初回実行
  run();

  // DOM変更を監視
  const observer = new MutationObserver((mutations) => {
    // 新しい数式プロパティ要素が追加されたかチェック
    let hasNewFormulas = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        if (addedNodes.some(node => 
          node instanceof Element && 
          (node.classList?.contains('notion-property-formula') || 
           node.querySelector?.('.notion-property-formula'))
        )) {
          hasNewFormulas = true;
          break;
        }
      }
    }
    
    if (hasNewFormulas) {
      run();
    }
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}