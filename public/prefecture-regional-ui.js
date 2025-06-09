(function() {
  'use strict';
  
  console.log('[Prefecture Regional UI] Script loaded');
  
  const prefecturePattern = /(北海道|青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|東京|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|京都|大阪|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)/;
  
  const regions = [
    { name: '北海道', prefectures: ['北海道'] },
    { name: '東北', prefectures: ['青森', '岩手', '秋田', '宮城', '山形', '福島'] },
    { name: '関東', prefectures: ['茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川'] },
    { name: '中部', prefectures: ['新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知'] },
    { name: '近畿', prefectures: ['三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山'] },
    { name: '中国', prefectures: ['鳥取', '島根', '岡山', '広島', '山口'] },
    { name: '四国', prefectures: ['徳島', '香川', '愛媛', '高知'] },
    { name: '九州・沖縄', prefectures: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄'] }
  ];
  
  function createRegionalUI() {
    try {
      // 都道府県リンクを探す
      const allLinks = document.querySelectorAll('a.notion-page-link, .notion-page-link');
      console.log('[Prefecture Regional UI] Found potential links:', allLinks.length);
      
      // 都道府県リンクを収集
      const prefectureData = new Map();
      
      allLinks.forEach(link => {
        const text = link.textContent?.trim() || '';
        if (text && prefecturePattern.test(text)) {
          // 都道府県名を正規化（県、都、府を削除、ただし北海道は特別扱い）
          let normalizedName = text;
          if (text === '北海道') {
            normalizedName = '北海道';
          } else {
            normalizedName = text.replace(/[県都府]$/, '');
          }
          prefectureData.set(normalizedName, {
            name: text,
            url: link.href,
            element: link
          });
        }
      });
      
      console.log('[Prefecture Regional UI] Prefecture data collected:', prefectureData.size);
      
      // より柔軟な検出条件
      const shouldApplyRegionalUI = prefectureData.size >= 10 || 
        (prefectureData.size >= 5 && document.querySelector('[data-prefecture-list="true"]'));
      
      if (shouldApplyRegionalUI) {
        // 共通の親要素を見つける
        const firstLink = Array.from(prefectureData.values())[0].element;
        let commonParent = firstLink.parentElement;
        
        while (commonParent && commonParent !== document.body) {
          let containsAll = true;
          
          for (const data of prefectureData.values()) {
            if (!commonParent.contains(data.element)) {
              containsAll = false;
              break;
            }
          }
          
          if (containsAll && (commonParent.classList.contains('notion-list') || 
              commonParent.querySelector('.notion-list'))) {
            break;
          }
          
          commonParent = commonParent.parentElement;
        }
        
        if (commonParent && !commonParent.classList.contains('prefecture-regional-ui')) {
          console.log('[Prefecture Regional UI] Creating regional table');
          
          // データベースタイトルを探す
          let dbTitle = '';
          let titleElement = commonParent.previousElementSibling;
          while (titleElement && !dbTitle) {
            if (titleElement.classList.contains('notion-text') || 
                titleElement.querySelector('.notion-text') ||
                titleElement.tagName.match(/^H[1-6]$/)) {
              dbTitle = titleElement.textContent?.trim() || '';
              break;
            }
            titleElement = titleElement.previousElementSibling;
          }
          
          // 新しいテーブル要素を作成
          const container = document.createElement('div');
          container.className = 'prefecture-regional-container';
          
          // タイトルを追加（元のタイトルは残す）
          if (dbTitle) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'prefecture-db-title';
            titleDiv.textContent = dbTitle;
            container.appendChild(titleDiv);
          }
          
          const table = document.createElement('table');
          table.className = 'prefecture-regional-table';
          
          const tbody = document.createElement('tbody');
          
          // 地域ごとに行を作成
          regions.forEach(region => {
            const tr = document.createElement('tr');
            tr.className = 'prefecture-region-row';
            
            // 地域名セル
            const tdRegion = document.createElement('td');
            tdRegion.className = 'prefecture-region-name';
            tdRegion.textContent = region.name;
            tr.appendChild(tdRegion);
            
            // 都道府県リストセル
            const tdPrefectures = document.createElement('td');
            tdPrefectures.className = 'prefecture-list-cell';
            
            region.prefectures.forEach((prefName, index) => {
              const data = prefectureData.get(prefName);
              console.log(`[Prefecture Regional UI] Looking for ${prefName}:`, data);
              if (data) {
                const link = document.createElement('a');
                link.href = data.url;
                link.className = 'prefecture-link';
                link.textContent = data.name;
                tdPrefectures.appendChild(link);
                
                if (index < region.prefectures.length - 1) {
                  tdPrefectures.appendChild(document.createTextNode(' '));
                }
              }
            });
            
            tr.appendChild(tdPrefectures);
            tbody.appendChild(tr);
          });
          
          table.appendChild(tbody);
          container.appendChild(table);
          
          // 元のリストを置き換え
          commonParent.innerHTML = '';
          commonParent.appendChild(container);
          commonParent.classList.add('prefecture-regional-ui');
          
          // スタイルを追加
          if (!document.getElementById('prefecture-regional-styles')) {
            const style = document.createElement('style');
            style.id = 'prefecture-regional-styles';
            style.textContent = `
              .prefecture-regional-container {
                max-width: 100%;
                margin: 1.5rem 0;
                background: var(--bg-color-0);
                border: 1px solid var(--bg-color-1);
                border-radius: 8px;
                overflow: hidden;
              }
              
              .prefecture-db-title {
                padding: 16px 20px;
                font-size: 1rem;
                font-weight: 600;
                color: var(--fg-color);
                background: rgba(0, 0, 0, 0.01);
                border-bottom: 1px solid var(--bg-color-1);
                font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
              }
              
              .prefecture-regional-table {
                width: 100%;
                border-collapse: collapse;
              }
              
              .prefecture-region-row {
                border-bottom: 1px solid var(--bg-color-1);
              }
              
              .prefecture-region-row:last-child {
                border-bottom: none;
              }
              
              .prefecture-region-name {
                width: 100px;
                padding: 14px 16px;
                font-weight: 600;
                font-size: 0.875rem;
                background: rgba(0, 0, 0, 0.02);
                border-right: 1px solid var(--bg-color-1);
                text-align: center;
                vertical-align: middle;
                font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
                white-space: nowrap;
              }
              
              .prefecture-list-cell {
                padding: 12px 16px;
                vertical-align: middle;
              }
              
              .prefecture-link {
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
              
              .prefecture-link:hover {
                background: rgba(0, 0, 0, 0.04);
                text-decoration: underline;
              }
              
              /* ダークモード対応 */
              @media (prefers-color-scheme: dark) {
                .prefecture-regional-container {
                  background: var(--bg-color);
                  border-color: rgba(255, 255, 255, 0.1);
                }
                
                .prefecture-region-row {
                  border-color: rgba(255, 255, 255, 0.1);
                }
                
                .prefecture-region-name {
                  background: rgba(255, 255, 255, 0.02);
                  border-color: rgba(255, 255, 255, 0.1);
                }
                
                .prefecture-link:hover {
                  background: rgba(255, 255, 255, 0.08);
                }
              }
              
              /* レスポンシブ対応 */
              @media (max-width: 768px) {
                .prefecture-region-name {
                  width: 80px;
                  padding: 12px 10px;
                  font-size: 0.8125rem;
                }
                
                .prefecture-list-cell {
                  padding: 10px 12px;
                }
                
                .prefecture-link {
                  padding: 3px 8px;
                  font-size: 0.775rem;
                }
              }
              
              @media (max-width: 480px) {
                .prefecture-regional-container {
                  margin: 1rem -1rem;
                  border-radius: 0;
                  border-left: none;
                  border-right: none;
                }
                
                .prefecture-region-name {
                  width: 60px;
                  padding: 10px 8px;
                  font-size: 0.75rem;
                }
                
                .prefecture-list-cell {
                  padding: 8px 10px;
                }
                
                .prefecture-link {
                  padding: 2px 6px;
                  font-size: 0.75rem;
                  margin: 1px;
                }
              }
            `;
            document.head.appendChild(style);
          }
        }
      }
    } catch (error) {
      console.error('[Prefecture Regional UI] Error:', error);
    }
  }
  
  // 初回実行
  setTimeout(createRegionalUI, 500);
  setTimeout(createRegionalUI, 1000);
  setTimeout(createRegionalUI, 2000);
  
  // DOMの変更を監視
  const observer = new MutationObserver(() => {
    createRegionalUI();
  });
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createRegionalUI);
  } else {
    createRegionalUI();
  }
  
  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }, 1000);
})();