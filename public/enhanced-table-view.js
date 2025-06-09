(function() {
  'use strict';
  
  console.log('[Enhanced Table View] Script loaded');
  
  function enhanceTableViews() {
    try {
      // Notionのテーブルビューを探す
      const tables = document.querySelectorAll('.notion-collection-table, .notion-table');
      console.log('[Enhanced Table View] Found tables:', tables.length);
      
      tables.forEach((table, index) => {
        // すでに処理済みの場合はスキップ
        if (table.classList.contains('enhanced-table-processed')) {
          return;
        }
        
        // テーブルの構造を解析
        const wrapper = table.closest('.notion-collection-view-wrapper') || table.parentElement;
        const isTableView = wrapper?.querySelector('.notion-collection-table');
        
        if (!isTableView) {
          return;
        }
        
        console.log(`[Enhanced Table View] Processing table ${index}`);
        
        // データベースタイトルを取得
        let dbTitle = '';
        const titleElement = wrapper?.querySelector('.notion-collection-header-title');
        if (titleElement) {
          dbTitle = titleElement.textContent?.trim() || '';
        }
        
        // テーブルのヘッダーとボディを取得
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        
        if (!thead || !tbody) {
          console.log('[Enhanced Table View] Table structure incomplete');
          return;
        }
        
        // ヘッダーセルを解析
        const headerCells = Array.from(thead.querySelectorAll('th'));
        const headers = headerCells.map(th => ({
          text: th.textContent?.trim() || '',
          element: th
        }));
        
        console.log('[Enhanced Table View] Headers:', headers.map(h => h.text));
        
        // 最初のカラムが地域名や分類名と思われるかチェック
        const firstColumnValues = Array.from(tbody.querySelectorAll('tr')).map(tr => {
          const firstCell = tr.querySelector('td');
          return firstCell?.textContent?.trim() || '';
        });
        
        // グループ化に適したデータかチェック（都道府県、地域名など）
        const regionKeywords = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州'];
        const isRegionalData = firstColumnValues.some(val => regionKeywords.includes(val));
        
        // 縦線が非表示になっているかチェック（CSSで判定）
        const hasVerticalBorders = window.getComputedStyle(headerCells[0]).borderRight !== '0px none rgb(0, 0, 0)';
        
        if (!hasVerticalBorders || isRegionalData) {
          console.log('[Enhanced Table View] Applying enhanced styling');
          
          // 新しいコンテナを作成
          const container = document.createElement('div');
          container.className = 'enhanced-table-container';
          
          // タイトルを追加
          if (dbTitle) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'enhanced-table-title';
            titleDiv.textContent = dbTitle;
            container.appendChild(titleDiv);
          }
          
          // 新しいテーブルを作成
          const newTable = document.createElement('table');
          newTable.className = 'enhanced-table';
          
          // ボディをコピー
          const newTbody = document.createElement('tbody');
          
          tbody.querySelectorAll('tr').forEach(row => {
            const newRow = document.createElement('tr');
            newRow.className = 'enhanced-table-row';
            
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, cellIndex) => {
              const newCell = document.createElement('td');
              
              // 最初のセルはカテゴリー名として特別扱い
              if (cellIndex === 0) {
                newCell.className = 'enhanced-table-category';
              } else {
                newCell.className = 'enhanced-table-cell';
              }
              
              // リンクを含む場合は特別な処理
              const links = cell.querySelectorAll('a');
              if (links.length > 0) {
                links.forEach((link, linkIndex) => {
                  const newLink = link.cloneNode(true);
                  newLink.className = 'enhanced-table-link';
                  newCell.appendChild(newLink);
                  
                  if (linkIndex < links.length - 1) {
                    newCell.appendChild(document.createTextNode(' '));
                  }
                });
              } else {
                newCell.innerHTML = cell.innerHTML;
              }
              
              newRow.appendChild(newCell);
            });
            
            newTbody.appendChild(newRow);
          });
          
          newTable.appendChild(newTbody);
          container.appendChild(newTable);
          
          // 元のテーブルを置き換え
          table.style.display = 'none';
          table.parentNode.insertBefore(container, table);
          table.classList.add('enhanced-table-processed');
          
          // スタイルを追加
          if (!document.getElementById('enhanced-table-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-table-styles';
            style.textContent = `
              .enhanced-table-container {
                max-width: 100%;
                margin: 1.5rem 0;
                background: var(--bg-color-0);
                border: 1px solid var(--bg-color-1);
                border-radius: 8px;
                overflow: hidden;
              }
              
              .enhanced-table-title {
                padding: 16px 20px;
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--fg-color);
                background: rgba(0, 0, 0, 0.01);
                border-bottom: 1px solid var(--bg-color-1);
                font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
              }
              
              .enhanced-table {
                width: 100%;
                border-collapse: collapse;
              }
              
              .enhanced-table-row {
                border-bottom: 1px solid var(--bg-color-1);
              }
              
              .enhanced-table-row:last-child {
                border-bottom: none;
              }
              
              .enhanced-table-category {
                width: 120px;
                padding: 14px 16px;
                font-weight: 600;
                font-size: 0.875rem;
                background: rgba(0, 0, 0, 0.02);
                border-right: 1px solid var(--bg-color-1);
                text-align: left;
                vertical-align: middle;
                font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
                white-space: nowrap;
              }
              
              .enhanced-table-cell {
                padding: 12px 16px;
                vertical-align: middle;
                font-size: 0.875rem;
              }
              
              .enhanced-table-link {
                display: inline-block;
                padding: 4px 10px;
                margin: 2px;
                font-size: 0.8125rem;
                color: var(--notion-link-color);
                text-decoration: none;
                border-radius: 4px;
                transition: all 0.15s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
              }
              
              .enhanced-table-link:hover {
                background: rgba(0, 0, 0, 0.04);
                text-decoration: underline;
              }
              
              /* ダークモード対応 */
              @media (prefers-color-scheme: dark) {
                .enhanced-table-container {
                  background: var(--bg-color);
                  border-color: rgba(255, 255, 255, 0.1);
                }
                
                .enhanced-table-title {
                  background: rgba(255, 255, 255, 0.02);
                  border-color: rgba(255, 255, 255, 0.1);
                }
                
                .enhanced-table-row {
                  border-color: rgba(255, 255, 255, 0.1);
                }
                
                .enhanced-table-category {
                  background: rgba(255, 255, 255, 0.02);
                  border-color: rgba(255, 255, 255, 0.1);
                }
                
                .enhanced-table-link:hover {
                  background: rgba(255, 255, 255, 0.08);
                }
              }
              
              /* レスポンシブ対応 */
              @media (max-width: 768px) {
                .enhanced-table-category {
                  width: 90px;
                  padding: 12px 12px;
                  font-size: 0.825rem;
                }
                
                .enhanced-table-cell {
                  padding: 10px 12px;
                  font-size: 0.825rem;
                }
                
                .enhanced-table-link {
                  padding: 3px 8px;
                  font-size: 0.775rem;
                }
              }
              
              @media (max-width: 480px) {
                .enhanced-table-container {
                  margin: 1rem -1rem;
                  border-radius: 0;
                  border-left: none;
                  border-right: none;
                }
                
                .enhanced-table-category {
                  width: 70px;
                  padding: 10px 10px;
                  font-size: 0.775rem;
                }
                
                .enhanced-table-cell {
                  padding: 8px 10px;
                  font-size: 0.775rem;
                }
                
                .enhanced-table-link {
                  padding: 2px 6px;
                  font-size: 0.75rem;
                  margin: 1px;
                }
              }
            `;
            document.head.appendChild(style);
          }
        }
      });
    } catch (error) {
      console.error('[Enhanced Table View] Error:', error);
    }
  }
  
  // 初回実行
  setTimeout(enhanceTableViews, 500);
  setTimeout(enhanceTableViews, 1000);
  setTimeout(enhanceTableViews, 2000);
  
  // DOMの変更を監視
  const observer = new MutationObserver(() => {
    enhanceTableViews();
  });
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceTableViews);
  } else {
    enhanceTableViews();
  }
  
  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }, 1000);
})();