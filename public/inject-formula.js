// 数式プロパティを自動的に挿入するスクリプト
(function() {
  // APIから数式プロパティを取得してキャッシュ
  const formulaCache = new Map();
  
  // ページIDから数式プロパティを取得
  async function fetchFormulaValue(pageId) {
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
  
  // データベースアイテムに数式プロパティを挿入
  async function injectFormulaProperties() {
    // すべてのコレクションアイテムを探す
    const items = document.querySelectorAll('.notion-collection-item, .notion-list-item, .notion-table-row, .notion-gallery-card');
    
    for (const item of items) {
      // ページリンクからIDを抽出
      const link = item.querySelector('a[href*="/"]');
      if (!link) continue;
      
      const href = link.getAttribute('href');
      const pageId = href.split('/').pop().replace(/-/g, '');
      
      if (!pageId || pageId.length < 32) continue;
      
      // すでに追加済みかチェック
      if (item.querySelector('.formula-injected')) continue;
      
      // 数式プロパティを取得
      const formulaValue = await fetchFormulaValue(pageId);
      if (!formulaValue) continue;
      
      // 表示位置を探す（最終更新日の後ろ）
      const properties = item.querySelectorAll('.notion-list-item-property');
      const targetProperty = Array.from(properties).find(p => 
        p.textContent.includes('ago') || 
        p.textContent.includes('前') ||
        p.textContent.includes('Last')
      );
      
      if (targetProperty) {
        // 既存のLast Edited Timeを数式プロパティで置き換え
        const formulaSpan = document.createElement('span');
        formulaSpan.className = 'notion-property notion-property-formula formula-injected';
        formulaSpan.style.cssText = 'color: var(--fg-color-3); font-size: 14px;';
        formulaSpan.textContent = formulaValue;
        
        targetProperty.innerHTML = '';
        targetProperty.appendChild(formulaSpan);
      }
    }
  }
  
  // ページ読み込み時とDOM変更時に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFormulaProperties);
  } else {
    setTimeout(injectFormulaProperties, 1000);
  }
  
  // SPAのナビゲーションに対応
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(injectFormulaProperties, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();