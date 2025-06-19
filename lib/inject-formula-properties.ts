// 数式プロパティをNotionの表示設定に従って挿入する

export function injectFormulaProperties() {
  if (typeof window === 'undefined') return;

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

  // コレクションビューから表示設定を取得
  function getVisibleProperties(collectionView: Element) {
    const headers = collectionView.querySelectorAll('.notion-table-th, .notion-list-view-header-cell');
    const visibleProps = new Set<string>();
    
    headers.forEach(header => {
      const text = header.textContent?.trim();
      if (text) visibleProps.add(text);
    });
    
    // リストビューの場合、表示されているプロパティを確認
    const propertyElements = collectionView.querySelectorAll('.notion-collection-property');
    propertyElements.forEach(el => {
      const propertyName = el.getAttribute('data-property-name') || 
                          el.querySelector('.notion-property-name')?.textContent?.trim();
      if (propertyName) visibleProps.add(propertyName);
    });
    
    return visibleProps;
  }

  async function processCollectionItems() {
    // すべてのコレクションビューを探す
    const collections = document.querySelectorAll('.notion-collection-view');
    
    for (const collection of collections) {
      const visibleProps = getVisibleProperties(collection);
      
      // 「最終更新日」が表示設定されているかチェック
      const shouldShowFormula = visibleProps.has('最終更新日') || 
                               visibleProps.has('Last Updated') ||
                               visibleProps.size === 0; // プロパティが検出できない場合は表示
      
      if (!shouldShowFormula) continue;
      
      // コレクション内のアイテムを処理
      const items = collection.querySelectorAll(
        '.notion-collection-item, .notion-list-item, .notion-table-row, .notion-gallery-card'
      );
      
      for (const item of items) {
        // すでに処理済みかチェック
        if (item.querySelector('.formula-property-injected')) continue;
        
        // ページリンクからIDを抽出
        const link = item.querySelector('a[href*="/"]');
        if (!link) continue;
        
        const href = link.getAttribute('href');
        if (!href) continue;
        
        const pageId = href.split('/').pop()?.replace(/-/g, '');
        if (!pageId || pageId.length < 32) continue;
        
        // 数式プロパティを取得
        const formulaValue = await fetchFormulaValue(pageId);
        if (!formulaValue) continue;
        
        // 適切な位置に挿入
        insertFormulaProperty(item, formulaValue);
      }
    }
  }

  function insertFormulaProperty(item: Element, value: string) {
    const isListView = item.classList.contains('notion-list-item');
    const isTableRow = item.classList.contains('notion-table-row');
    const isGalleryCard = item.classList.contains('notion-gallery-card');
    
    if (isListView) {
      // リストビューの場合
      const propertiesContainer = item.querySelector('.notion-list-item-body') || item;
      const formulaDiv = document.createElement('div');
      formulaDiv.className = 'notion-list-item-property formula-property-injected';
      formulaDiv.innerHTML = `
        <span class="notion-property notion-property-formula">
          <span class="notion-property-formula-value">${value}</span>
        </span>
      `;
      propertiesContainer.appendChild(formulaDiv);
      
    } else if (isTableRow) {
      // テーブルビューの場合
      const cells = item.querySelectorAll('.notion-table-cell');
      const lastCell = cells[cells.length - 1];
      if (lastCell) {
        const formulaCell = document.createElement('div');
        formulaCell.className = 'notion-table-cell formula-property-injected';
        formulaCell.innerHTML = `<span class="notion-property-formula">${value}</span>`;
        lastCell.after(formulaCell);
      }
      
    } else if (isGalleryCard) {
      // ギャラリービューの場合
      const propertiesContainer = item.querySelector('.notion-gallery-card-properties') || 
                                 item.querySelector('.notion-gallery-card-content');
      if (propertiesContainer) {
        const formulaDiv = document.createElement('div');
        formulaDiv.className = 'notion-gallery-card-property formula-property-injected';
        formulaDiv.innerHTML = `<span class="notion-property-formula">${value}</span>`;
        propertiesContainer.appendChild(formulaDiv);
      }
    }
  }

  // 実行
  const run = () => {
    setTimeout(processCollectionItems, 1500);
  };

  // 初回実行
  run();

  // SPAナビゲーションに対応
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      run();
    }
  });
  
  observer.observe(document, { subtree: true, childList: true });
}