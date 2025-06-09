(function() {
  'use strict';
  
  console.log('[Prefecture Table Regional] Script loaded');
  
  // 地域データ
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
  
  function transformPrefectureTable() {
    try {
      // Notionのテーブルコレクションを探す
      const collections = document.querySelectorAll('.notion-collection, .notion-collection-view-body');
      console.log('[Prefecture Table Regional] Found collections:', collections.length);
      
      let targetCollection = null;
      let targetData = [];
      
      // テキストに都道府県名が含まれているセクションを探す
      const allElements = document.querySelectorAll('*');
      let prefectureElements = [];
      
      allElements.forEach(element => {
        const text = element.textContent?.trim() || '';
        // 直接のテキストノードのみチェック（子要素のテキストは除外）
        const directText = Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent?.trim() || '')
          .join('');
        
        if (directText.match(/^(北海道|青森県?|岩手県?|宮城県?|秋田県?|山形県?|福島県?|茨城県?|栃木県?|群馬県?|埼玉県?|千葉県?|東京都?|神奈川県?|新潟県?|富山県?|石川県?|福井県?|山梨県?|長野県?|岐阜県?|静岡県?|愛知県?|三重県?|滋賀県?|京都府?|大阪府?|兵庫県?|奈良県?|和歌山県?|鳥取県?|島根県?|岡山県?|広島県?|山口県?|徳島県?|香川県?|愛媛県?|高知県?|福岡県?|佐賀県?|長崎県?|熊本県?|大分県?|宮崎県?|鹿児島県?|沖縄県?)$/)) {
          prefectureElements.push(element);
          console.log('[Prefecture Table Regional] Found prefecture:', directText);
        }
      });
      
      console.log('[Prefecture Table Regional] Total prefecture elements:', prefectureElements.length);
      
      if (prefectureElements.length < 10) {
        console.log('[Prefecture Table Regional] Not enough prefectures found');
        return;
      }
      
      // 共通の親要素を見つける
      let commonParent = null;
      const firstElement = prefectureElements[0];
      let currentParent = firstElement.parentElement;
      
      while (currentParent && currentParent !== document.body) {
        let containsAll = true;
        
        for (const element of prefectureElements) {
          if (!currentParent.contains(element)) {
            containsAll = false;
            break;
          }
        }
        
        if (containsAll) {
          commonParent = currentParent;
          break;
        }
        
        currentParent = currentParent.parentElement;
      }
      
      if (!commonParent) {
        console.log('[Prefecture Table Regional] No common parent found');
        return;
      }
      
      console.log('[Prefecture Table Regional] Found common parent');
      
      // タイトルからも探す
      if (!targetTable) {
        const allTexts = document.querySelectorAll('.notion-text, h1, h2, h3');
        allTexts.forEach(textElement => {
          const text = textElement.textContent?.trim() || '';
          if (text.includes('公認インストラクター') || text.includes('ナビゲーター')) {
            console.log('[Prefecture Table Regional] Found title:', text);
            
            // 親要素から探す
            let parent = textElement.parentElement;
            while (parent && !targetTable) {
              const table = parent.querySelector('table');
              if (table) {
                console.log('[Prefecture Table Regional] Found table near title');
                targetTable = table;
                break;
              }
              parent = parent.nextElementSibling;
            }
          }
        });
      }
      
      if (!targetTable) {
        console.log('[Prefecture Table Regional] Target table not found');
        return;
      }
      
      // すでに処理済みの場合はスキップ
      if (targetTable.classList.contains('prefecture-regional-processed')) {
        return;
      }
      
      console.log('[Prefecture Table Regional] Processing table');
      
      // テーブルの行を取得
      const rows = targetTable.querySelectorAll('tbody tr');
      const prefectureData = new Map();
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          // 最初のセルから都道府県名を取得
          const nameCell = cells[0];
          const linkCell = cells[1];
          
          const prefectureName = nameCell.textContent?.trim() || '';
          const link = linkCell.querySelector('a');
          
          if (prefectureName && link) {
            // 県を除いた名前をキーにする（北海道は特別扱い）
            let key = prefectureName;
            if (prefectureName !== '北海道') {
              key = prefectureName.replace(/[県都府]$/, '');
            }
            
            prefectureData.set(key, {
              name: prefectureName,
              url: link.href,
              region: cells[2]?.textContent?.trim() || '' // 地域別表示プロパティがある場合
            });
          }
        }
      });
      
      console.log('[Prefecture Table Regional] Prefecture data:', prefectureData.size);
      
      if (prefectureData.size === 0) {
        return;
      }
      
      // 新しいコンテナを作成
      const container = document.createElement('div');
      container.className = 'prefecture-regional-table-container';
      
      // タイトルを追加
      const title = document.createElement('div');
      title.className = 'prefecture-regional-table-title';
      title.textContent = '公認インストラクター＆ナビゲーター';
      container.appendChild(title);
      
      // 地域別テーブルを作成
      const table = document.createElement('table');
      table.className = 'prefecture-regional-table';
      
      const tbody = document.createElement('tbody');
      
      regions.forEach(region => {
        const tr = document.createElement('tr');
        tr.className = 'prefecture-regional-row';
        
        // 地域名セル
        const tdRegion = document.createElement('td');
        tdRegion.className = 'prefecture-regional-name';
        tdRegion.textContent = region.name;
        tr.appendChild(tdRegion);
        
        // 都道府県セル
        const tdPrefectures = document.createElement('td');
        tdPrefectures.className = 'prefecture-regional-list';
        
        const prefecturesInRegion = [];
        region.prefectures.forEach(prefName => {
          const data = prefectureData.get(prefName);
          if (data) {
            prefecturesInRegion.push(data);
          }
        });
        
        if (prefecturesInRegion.length > 0) {
          prefecturesInRegion.forEach((data, index) => {
            const link = document.createElement('a');
            link.href = data.url;
            link.className = 'prefecture-regional-link';
            link.textContent = data.name;
            tdPrefectures.appendChild(link);
            
            if (index < prefecturesInRegion.length - 1) {
              tdPrefectures.appendChild(document.createTextNode(' '));
            }
          });
        } else {
          tdPrefectures.innerHTML = '<span class="prefecture-regional-empty">-</span>';
        }
        
        tr.appendChild(tdPrefectures);
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      container.appendChild(table);
      
      // 元のテーブルを非表示にして新しいものを挿入
      targetTable.style.display = 'none';
      targetTable.parentNode.insertBefore(container, targetTable);
      targetTable.classList.add('prefecture-regional-processed');
      
      // スタイルを追加
      if (!document.getElementById('prefecture-regional-table-styles')) {
        const style = document.createElement('style');
        style.id = 'prefecture-regional-table-styles';
        style.textContent = `
          .prefecture-regional-table-container {
            max-width: 100%;
            margin: 1.5rem 0;
            background: var(--bg-color-0);
            border: 1px solid var(--bg-color-1);
            border-radius: 8px;
            overflow: hidden;
          }
          
          .prefecture-regional-table-title {
            padding: 16px 20px;
            font-size: 1.1rem;
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
          
          .prefecture-regional-row {
            border-bottom: 1px solid var(--bg-color-1);
          }
          
          .prefecture-regional-row:last-child {
            border-bottom: none;
          }
          
          .prefecture-regional-name {
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
          
          .prefecture-regional-list {
            padding: 12px 16px;
            vertical-align: middle;
          }
          
          .prefecture-regional-link {
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
          
          .prefecture-regional-link:hover {
            background: rgba(0, 0, 0, 0.04);
            text-decoration: underline;
          }
          
          .prefecture-regional-empty {
            color: var(--fg-color-3);
            font-size: 0.8125rem;
          }
          
          /* ダークモード対応 */
          @media (prefers-color-scheme: dark) {
            .prefecture-regional-table-container {
              background: var(--bg-color);
              border-color: rgba(255, 255, 255, 0.1);
            }
            
            .prefecture-regional-table-title {
              background: rgba(255, 255, 255, 0.02);
              border-color: rgba(255, 255, 255, 0.1);
            }
            
            .prefecture-regional-row {
              border-color: rgba(255, 255, 255, 0.1);
            }
            
            .prefecture-regional-name {
              background: rgba(255, 255, 255, 0.02);
              border-color: rgba(255, 255, 255, 0.1);
            }
            
            .prefecture-regional-link:hover {
              background: rgba(255, 255, 255, 0.08);
            }
          }
          
          /* レスポンシブ対応 */
          @media (max-width: 768px) {
            .prefecture-regional-name {
              width: 80px;
              padding: 12px 10px;
              font-size: 0.8125rem;
            }
            
            .prefecture-regional-list {
              padding: 10px 12px;
            }
            
            .prefecture-regional-link {
              padding: 3px 8px;
              font-size: 0.775rem;
            }
          }
          
          @media (max-width: 480px) {
            .prefecture-regional-table-container {
              margin: 1rem -1rem;
              border-radius: 0;
              border-left: none;
              border-right: none;
            }
            
            .prefecture-regional-name {
              width: 70px;
              padding: 10px 8px;
              font-size: 0.75rem;
            }
            
            .prefecture-regional-list {
              padding: 8px 10px;
            }
            
            .prefecture-regional-link {
              padding: 2px 6px;
              font-size: 0.75rem;
              margin: 1px;
            }
          }
        `;
        document.head.appendChild(style);
      }
    } catch (error) {
      console.error('[Prefecture Table Regional] Error:', error);
    }
  }
  
  // 初回実行
  setTimeout(transformPrefectureTable, 500);
  setTimeout(transformPrefectureTable, 1000);
  setTimeout(transformPrefectureTable, 2000);
  
  // DOMの変更を監視
  const observer = new MutationObserver(() => {
    transformPrefectureTable();
  });
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', transformPrefectureTable);
  } else {
    transformPrefectureTable();
  }
  
  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }, 1000);
})();