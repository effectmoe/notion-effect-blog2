// 数式、リレーション、ロールアップなどの高度なプロパティを入力する

export function fillAdvancedProperties() {
  if (typeof window === 'undefined') return;

  const propertyCache = new Map<string, any>();

  // ページIDから全プロパティを取得
  async function fetchPageProperties(pageId: string) {
    const cacheKey = `props_${pageId}`;
    if (propertyCache.has(cacheKey)) {
      return propertyCache.get(cacheKey);
    }

    try {
      const response = await fetch(`/api/test-formula?pageId=${pageId}`);
      const data = await response.json();
      if (data.success) {
        propertyCache.set(cacheKey, data);
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
    return null;
  }

  // プロパティタイプに応じて値をフォーマット
  function formatPropertyValue(property: any): string {
    if (!property) return '';

    switch (property.type) {
      case 'formula':
        // 数式の結果を返す
        const formula = property.formula;
        if (formula?.type === 'string') return formula.string || '';
        if (formula?.type === 'number') return formula.number?.toString() || '';
        if (formula?.type === 'boolean') return formula.boolean ? '✓' : '';
        if (formula?.type === 'date' && formula.date?.start) {
          const date = new Date(formula.date.start);
          return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        }
        break;

      case 'relation':
        // リレーションのタイトルを取得
        if (property.relation && Array.isArray(property.relation)) {
          return property.relation
            .map((rel: any) => rel.title || rel.id)
            .join(', ');
        }
        break;

      case 'rollup':
        // ロールアップの結果を返す
        const rollup = property.rollup;
        if (rollup?.type === 'number') return rollup.number?.toString() || '';
        if (rollup?.type === 'array' && rollup.array?.length > 0) {
          return `${rollup.array.length} items`;
        }
        break;
    }

    return '';
  }

  async function fillEmptyProperties() {
    // すべての高度なプロパティ要素を探す
    const selectors = [
      '.notion-property-formula',
      '.notion-property-relation',
      '.notion-property-rollup'
    ];
    
    const propertyElements = document.querySelectorAll(selectors.join(', '));
    
    for (const element of propertyElements) {
      // すでに値がある場合はスキップ
      if (element.textContent && element.textContent.trim()) continue;
      
      // 親要素からページIDを探す
      let pageId: string | null = null;
      const parentRow = element.closest('.notion-collection-item, .notion-list-item, .notion-table-row, .notion-gallery-card');
      
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
      }
      
      if (!pageId) continue;
      
      // プロパティを取得
      const pageData = await fetchPageProperties(pageId);
      if (!pageData || !pageData.allProperties) continue;
      
      // プロパティタイプを判定
      let propertyType = '';
      if (element.classList.contains('notion-property-formula')) propertyType = 'formula';
      else if (element.classList.contains('notion-property-relation')) propertyType = 'relation';
      else if (element.classList.contains('notion-property-rollup')) propertyType = 'rollup';
      
      // 該当するプロパティの値を設定
      // TODO: プロパティ名との対応付けが必要
      // 現在は最初に見つかった該当タイプのプロパティを使用
      if (propertyType && pageData.properties) {
        for (const prop of Object.values(pageData.properties)) {
          if ((prop as any).type === propertyType) {
            const value = formatPropertyValue(prop);
            if (value) {
              element.textContent = value;
              element.classList.add(`${propertyType}-filled`);
              break;
            }
          }
        }
      }
    }
  }

  // 実行とDOM監視のロジックは同じ
  const run = () => {
    setTimeout(fillEmptyProperties, 1000);
  };

  run();

  const observer = new MutationObserver((mutations) => {
    let hasNewProperties = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        if (addedNodes.some(node => 
          node instanceof Element && 
          (node.classList?.contains('notion-property-formula') || 
           node.classList?.contains('notion-property-relation') ||
           node.classList?.contains('notion-property-rollup') ||
           node.querySelector?.('.notion-property-formula, .notion-property-relation, .notion-property-rollup'))
        )) {
          hasNewProperties = true;
          break;
        }
      }
    }
    
    if (hasNewProperties) {
      run();
    }
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}