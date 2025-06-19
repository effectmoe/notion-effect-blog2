/**
 * 汎用Notionグループ化修正スクリプト - 改良版 v2
 * このスクリプト1つで、ほとんどのグループ化されたデータベースに対応可能
 * /public/universal-group-fix-v2.js
 */

(function() {
  'use strict';
  
  console.log('[Universal Group Fix v2] 初期化開始...');
  
  // デバッグ用：スクリプトが読み込まれたことを確認
  if (typeof window !== 'undefined') {
    window.__universalGroupFixV2Loaded = true;
  }
  
  // グローバル設定
  const CONFIG = {
    maxAttempts: 30,
    retryDelay: 500,
    debugMode: true,
    
    // 特殊なデータベースの設定（必要な場合のみ）
    specialCases: {
      // FAQマスターのような特殊なケース
      '212b802c-b0c6-8014-9263-000b71bd252e': {
        groupByProperty: 'カテゴリ',
        customRenderer: null // カスタムレンダリング関数
      }
    }
  };
  
  let attempts = 0;
  let processedDatabases = new Set();
  
  /**
   * メイン処理関数
   */
  function universalGroupFix() {
    attempts++;
    
    if (CONFIG.debugMode) {
      console.log(`[Universal Group Fix v2] 試行 ${attempts}/${CONFIG.maxAttempts}`);
    }
    
    // recordMapの確認
    if (!window.recordMap || !window.recordMap.collection) {
      if (attempts < CONFIG.maxAttempts) {
        setTimeout(universalGroupFix, CONFIG.retryDelay);
      }
      return;
    }
    
    // すべてのコレクションを検査
    let foundGroupedCollections = false;
    
    Object.entries(window.recordMap.collection).forEach(([collectionId, collectionData]) => {
      const collection = collectionData?.value;
      if (!collection || processedDatabases.has(collectionId)) {
        return;
      }
      
      // グループ化されたビューを検索
      const groupedViews = findGroupedViews(collection);
      
      if (groupedViews.length > 0) {
        foundGroupedCollections = true;
        console.log(`[Universal Group Fix v2] グループ化されたコレクション発見: ${collection.name?.[0]?.[0] || collectionId}`);
        
        groupedViews.forEach(view => {
          processGroupedView(collectionId, collection, view);
        });
        
        processedDatabases.add(collectionId);
      }
    });
    
    // DOM要素の直接チェック（フォールバック）
    if (!foundGroupedCollections) {
      checkAndFixDOMElements();
    }
    
    // MutationObserverの設定（動的コンテンツ対応）
    if (attempts === 1) {
      setupMutationObserver();
    }
    
    // リトライ
    if (attempts < CONFIG.maxAttempts && !foundGroupedCollections) {
      setTimeout(universalGroupFix, CONFIG.retryDelay);
    }
  }
  
  /**
   * グループ化されたビューを検索
   */
  function findGroupedViews(collection) {
    const views = collection.view_ids || [];
    const groupedViews = [];
    
    views.forEach(viewId => {
      const viewData = window.recordMap.collection_view?.[viewId];
      const view = viewData?.value;
      
      if (view) {
        // グループ化の検出（複数のパターンに対応）
        const isGrouped = 
          view.query2?.group_by ||
          view.query?.group_by ||
          view.format?.collection_groups ||
          view.type === 'list' && view.format?.list_properties?.some(p => p.group_by);
        
        if (isGrouped) {
          groupedViews.push(view);
        }
      }
    });
    
    return groupedViews;
  }
  
  /**
   * グループ化されたビューを処理
   */
  function processGroupedView(collectionId, collection, view) {
    console.log(`[Universal Group Fix v2] ビューを処理中: ${view.name || view.id}`);
    
    // グループ化プロパティの特定
    const groupByProperty = detectGroupByProperty(view, collection);
    
    if (!groupByProperty) {
      console.warn('[Universal Group Fix v2] グループ化プロパティを特定できません');
      return;
    }
    
    // データの収集
    const items = collectItems(collectionId);
    
    if (items.length === 0) {
      console.warn('[Universal Group Fix v2] アイテムが見つかりません');
      return;
    }
    
    // グループ化
    const groups = groupItems(items, groupByProperty, collection);
    
    // DOM更新
    updateDOM(collectionId, groups, collection, groupByProperty);
  }
  
  /**
   * グループ化プロパティを検出
   */
  function detectGroupByProperty(view, collection) {
    // 複数の場所から検出を試みる
    const candidates = [
      view.query2?.group_by,
      view.query?.group_by,
      view.format?.collection_groups?.[0]?.property,
      view.format?.list_properties?.find(p => p.group_by)?.property
    ];
    
    for (const candidate of candidates) {
      if (candidate) {
        // プロパティ名の解決
        const propertyName = resolvePropertyName(candidate, collection);
        if (propertyName) {
          return propertyName;
        }
      }
    }
    
    return null;
  }
  
  /**
   * プロパティ名を解決
   */
  function resolvePropertyName(propertyId, collection) {
    // プロパティIDから実際の名前を取得
    const schema = collection.schema;
    
    if (!schema) return propertyId;
    
    for (const [key, value] of Object.entries(schema)) {
      if (key === propertyId || value.name === propertyId) {
        return value.name;
      }
    }
    
    return propertyId;
  }
  
  /**
   * アイテムを収集
   */
  function collectItems(collectionId) {
    const items = [];
    
    Object.entries(window.recordMap.block).forEach(([blockId, blockData]) => {
      const block = blockData?.value;
      
      if (block && block.parent_id === collectionId && block.properties) {
        items.push(block);
      }
    });
    
    return items;
  }
  
  /**
   * アイテムをグループ化
   */
  function groupItems(items, groupByProperty, collection) {
    const groups = {};
    
    items.forEach(item => {
      const groupValue = extractPropertyValue(item, groupByProperty, collection);
      const groupName = groupValue || 'その他';
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      
      groups[groupName].push(item);
    });
    
    // グループをソート
    const sortedGroups = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
  }
  
  /**
   * プロパティ値を抽出（改良版）
   */
  function extractPropertyValue(item, propertyName, collection) {
    const props = item.properties;
    const schema = collection.schema;
    
    // スキーマからプロパティIDを取得
    let propertyId = null;
    for (const [key, value] of Object.entries(schema || {})) {
      if (value.name === propertyName) {
        propertyId = key;
        break;
      }
    }
    
    // プロパティ値の取得を試みる
    const propertyData = props?.[propertyId] || props?.[propertyName];
    
    if (!propertyData) {
      // フォールバック: すべてのプロパティをチェック
      for (const [key, value] of Object.entries(props || {})) {
        if (key.includes(propertyName) || (value?.[0] === propertyName)) {
          return extractValueFromProperty(value);
        }
      }
      return null;
    }
    
    return extractValueFromProperty(propertyData);
  }
  
  /**
   * プロパティデータから値を抽出
   */
  function extractValueFromProperty(propertyData) {
    if (!propertyData || !Array.isArray(propertyData)) return null;
    
    const [type, data] = propertyData;
    
    switch (type) {
      case 'select':
        return data;
      case 'multi_select':
        return data?.[0] || null;
      case 'text':
        return data?.[0]?.[0] || null;
      case 'title':
        return data?.[0]?.[0] || null;
      default:
        return data;
    }
  }
  
  /**
   * DOMを更新
   */
  function updateDOM(collectionId, groups, collection, groupByProperty) {
    // 対象となるDOM要素を検索
    const containers = findContainers(collectionId);
    
    if (containers.length === 0) {
      console.warn('[Universal Group Fix v2] 対象となるコンテナが見つかりません');
      return;
    }
    
    containers.forEach(container => {
      // 既存のコンテンツをバックアップ
      const originalContent = container.innerHTML;
      
      try {
        // グループ化されたHTMLを生成
        const groupedHTML = generateGroupedHTML(groups, collection);
        
        // コンテナを更新
        container.innerHTML = groupedHTML;
        
        // インタラクティブ機能を追加
        addInteractivity(container);
        
        console.log('[Universal Group Fix v2] DOM更新完了');
      } catch (error) {
        console.error('[Universal Group Fix v2] DOM更新エラー:', error);
        container.innerHTML = originalContent; // ロールバック
      }
    });
  }
  
  /**
   * コンテナ要素を検索
   */
  function findContainers(collectionId) {
    const containers = [];
    
    // 複数のセレクタパターンを試す
    const selectors = [
      `[data-collection-id="${collectionId}"]`,
      `.notion-collection-view[data-block-id*="${collectionId.substring(0, 8)}"]`,
      `.notion-collection-view`
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // このコレクションに属しているか確認
        if (isRelatedToCollection(el, collectionId)) {
          containers.push(el);
        }
      });
    }
    
    return [...new Set(containers)]; // 重複を除去
  }
  
  /**
   * 要素がコレクションに関連しているか確認
   */
  function isRelatedToCollection(element, collectionId) {
    // データ属性をチェック
    if (element.dataset.collectionId === collectionId) return true;
    
    // ブロックIDをチェック
    const blockId = element.dataset.blockId;
    if (blockId && blockId.includes(collectionId.substring(0, 8))) return true;
    
    // 親要素をチェック
    const parent = element.closest('[data-collection-id]');
    if (parent && parent.dataset.collectionId === collectionId) return true;
    
    // URL内のIDをチェック
    const links = element.querySelectorAll('a[href*="' + collectionId.substring(0, 8) + '"]');
    if (links.length > 0) return true;
    
    return false;
  }
  
  /**
   * グループ化されたHTMLを生成
   */
  function generateGroupedHTML(groups, collection) {
    let html = '<div class="notion-list-collection notion-collection-grouped">';
    
    Object.entries(groups).forEach(([groupName, items], index) => {
      const isExpanded = index === 0; // 最初のグループは展開
      
      html += `
        <div class="notion-collection-group" data-group-name="${escapeHtml(groupName)}">
          <summary class="notion-collection-group-title" style="
            cursor: pointer;
            padding: 0.75em 0;
            display: flex;
            align-items: center;
            gap: 0.5em;
            user-select: none;
            -webkit-user-select: none;
          ">
            <svg 
              class="notion-collection-group-toggle" 
              width="12" 
              height="12" 
              style="
                transition: transform 200ms ease;
                transform: rotate(${isExpanded ? '90deg' : '0'});
                flex-shrink: 0;
              "
              viewBox="0 0 12 12"
            >
              <path 
                d="M6.02 3.5L9.52 7L6.02 10.5L4.96 9.44L6.90 7.5H2V6H6.90L4.96 4.06L6.02 3.5Z" 
                fill="currentColor"
              />
            </svg>
            <span style="font-weight: 600; font-size: 0.975em;">
              ${escapeHtml(groupName)}
            </span>
            <span style="
              color: var(--fg-color-2, rgba(55, 53, 47, 0.65));
              font-size: 0.875em;
            ">
              (${items.length})
            </span>
          </summary>
          <div 
            class="notion-collection-group-items" 
            style="
              margin-left: 1.5em;
              display: ${isExpanded ? 'block' : 'none'};
            "
          >
            ${items.map(item => generateItemHTML(item, collection)).join('')}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }
  
  /**
   * 個別アイテムのHTMLを生成
   */
  function generateItemHTML(item, collection) {
    const title = extractTitle(item);
    const pageId = item.id.replace(/-/g, '');
    const url = `/${pageId}`;
    
    // アイコンの取得
    const icon = item.format?.page_icon || '📄';
    const hasIcon = icon && icon !== '📄';
    
    return `
      <div class="notion-list-item" style="
        padding: 0.375em 0;
        transition: background-color 200ms;
      ">
        <a 
          href="${url}" 
          style="
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.25em 0.5em;
            margin: 0 -0.5em;
            border-radius: 3px;
            transition: background-color 200ms;
          "
          onmouseover="this.style.backgroundColor='var(--bg-color-1, rgba(0,0,0,0.03))'"
          onmouseout="this.style.backgroundColor='transparent'"
        >
          ${hasIcon ? `<span style="font-size: 1.1em;">${icon}</span>` : '<span style="color: var(--fg-color-3, rgba(55, 53, 47, 0.4));">•</span>'}
          <span>${escapeHtml(title)}</span>
        </a>
      </div>
    `;
  }
  
  /**
   * タイトルを抽出
   */
  function extractTitle(item) {
    // タイトルプロパティの検索（複数のパターンに対応）
    const titleCandidates = [
      item.properties?.title,
      item.properties?.Title,
      item.properties?.Name,
      item.properties?.name
    ];
    
    for (const candidate of titleCandidates) {
      if (candidate && candidate[0]) {
        if (typeof candidate[0] === 'string') {
          return candidate[0];
        } else if (Array.isArray(candidate[0]) && candidate[0][0]) {
          return candidate[0][0];
        }
      }
    }
    
    // プロパティから最初のテキストを取得
    for (const prop of Object.values(item.properties || {})) {
      if (prop && prop[0] && prop[0][0] && typeof prop[0][0] === 'string') {
        return prop[0][0];
      }
    }
    
    return '無題';
  }
  
  /**
   * インタラクティブ機能を追加
   */
  function addInteractivity(container) {
    // トグル機能
    container.querySelectorAll('.notion-collection-group-title').forEach(title => {
      title.addEventListener('click', function(e) {
        e.preventDefault();
        
        const group = this.parentElement;
        const items = group.querySelector('.notion-collection-group-items');
        const toggle = this.querySelector('.notion-collection-group-toggle');
        
        if (!items) return;
        
        const isHidden = items.style.display === 'none';
        
        // アニメーション
        items.style.display = isHidden ? 'block' : 'none';
        toggle.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0)';
        
        // 状態を保存（オプション）
        if (window.localStorage) {
          const groupName = group.dataset.groupName;
          const stateKey = `notion-group-state-${groupName}`;
          localStorage.setItem(stateKey, isHidden ? 'expanded' : 'collapsed');
        }
      });
    });
    
    // 保存された状態を復元
    if (window.localStorage) {
      container.querySelectorAll('.notion-collection-group').forEach(group => {
        const groupName = group.dataset.groupName;
        const stateKey = `notion-group-state-${groupName}`;
        const savedState = localStorage.getItem(stateKey);
        
        if (savedState === 'collapsed') {
          const title = group.querySelector('.notion-collection-group-title');
          if (title) {
            title.click();
          }
        }
      });
    }
  }
  
  /**
   * DOM要素を直接チェックして修正（フォールバック）
   */
  function checkAndFixDOMElements() {
    // 隠れているグループ要素を探す
    const hiddenGroups = document.querySelectorAll(`
      .notion-collection-group[style*="display: none"],
      .notion-collection-group[style*="visibility: hidden"],
      .notion-list-view-group[style*="display: none"],
      [class*="group"][style*="display: none"]
    `);
    
    hiddenGroups.forEach(group => {
      group.style.display = 'block';
      group.style.visibility = 'visible';
      group.style.opacity = '1';
      console.log('[Universal Group Fix v2] 隠れていたグループを表示:', group);
    });
    
    // ギャラリービューをリストビューに切り替える必要がある場合
    const tabs = document.querySelectorAll('.notion-collection-view-tab-button');
    tabs.forEach(tab => {
      const tabText = tab.textContent?.toLowerCase() || '';
      if (tabText.includes('list') || tabText.includes('リスト')) {
        if (!tab.classList.contains('notion-collection-view-tab-button-active')) {
          tab.click();
          console.log('[Universal Group Fix v2] リストビューに切り替えました');
        }
      }
    });
  }
  
  /**
   * MutationObserverの設定
   */
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList?.contains('notion-collection-view')) {
              console.log('[Universal Group Fix v2] 新しいコレクションビューを検出');
              setTimeout(() => universalGroupFix(), 100);
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * HTMLエスケープ
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 初期化
   */
  function init() {
    // スタイルの注入（CSSファイルがない場合のフォールバック）
    if (!document.querySelector('link[href*="fix-grouped-collections.css"]')) {
      const style = document.createElement('style');
      style.textContent = `
        .notion-collection-group,
        .notion-list-view-group {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        .notion-collection-group-title {
          cursor: pointer;
          user-select: none;
        }
        
        .notion-collection-group-title:hover {
          background-color: var(--bg-color-1, rgba(0, 0, 0, 0.03));
        }
        
        .notion-collection-grouped {
          padding: 0.5em 0;
        }
        
        [style*="display: none"] .notion-collection-group {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // メイン処理を開始
    universalGroupFix();
  }
  
  // DOMContentLoadedまたは即座に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
