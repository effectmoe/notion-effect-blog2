// 都道府県テーブルをギャラリー風のカードレイアウトに変換
(function() {
  console.log('都道府県ギャラリースタイル変換開始');
  
  function createGalleryStyle() {
    // スタイルを挿入
    const styleId = 'prefecture-gallery-transform';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* テーブル全体をグリッドレイアウトに変換 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d {
        background: transparent !important;
        padding: 0 !important;
        border-radius: 0 !important;
        margin: 2rem 0 !important;
      }
      
      /* ヘッダーを非表示 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-header {
        display: none !important;
      }
      
      /* テーブルボディをグリッドに */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-body {
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
        gap: 16px !important;
        padding: 0 !important;
        background: transparent !important;
      }
      
      /* 各行をカードに変換 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row {
        display: block !important;
        background: white !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 12px !important;
        padding: 0 !important;
        overflow: hidden !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
        position: relative !important;
        height: auto !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row:hover {
        transform: translateY(-4px) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        border-color: #2196F3 !important;
      }
      
      /* セルを再配置 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell {
        display: block !important;
        padding: 0 !important;
        border: none !important;
        background: transparent !important;
      }
      
      /* 都道府県名（最初のセル）をメインに */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:first-child {
        padding: 20px 16px !important;
        text-align: center !important;
        font-size: 1.1rem !important;
        font-weight: 700 !important;
        color: #1a1a1a !important;
        background: transparent !important;
        font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif !important;
        letter-spacing: 0.5px !important;
      }
      
      /* URL（2番目のセル）を非表示 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(2) {
        display: none !important;
      }
      
      /* 地域（3番目のセル）をバッジとして表示 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(3) {
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        padding: 0 !important;
        font-size: 0.7rem !important;
        z-index: 1 !important;
      }
      
      /* 4番目のセルを非表示 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(4) {
        display: none !important;
      }
      
      /* 地域別グルーピングのためのヘッダー */
      .prefecture-region-header {
        grid-column: 1 / -1 !important;
        padding: 16px 0 8px 0 !important;
        font-size: 1.25rem !important;
        font-weight: 700 !important;
        color: #333 !important;
        border-bottom: 2px solid #e0e0e0 !important;
        margin-top: 24px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif !important;
      }
      
      .prefecture-region-header:first-child {
        margin-top: 0 !important;
      }
      
      /* コレクションタイトルのスタイル改善 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-collection-header-title {
        font-size: 1.75rem !important;
        font-weight: 800 !important;
        color: #1a1a1a !important;
        margin-bottom: 24px !important;
        text-align: center !important;
        padding-bottom: 16px !important;
        border-bottom: 3px solid #2196F3 !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  function transformToGallery() {
    const collection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    if (!collection) {
      console.log('都道府県コレクションが見つかりません');
      return;
    }
    
    const tableBody = collection.querySelector('.notion-table-body');
    if (!tableBody) return;
    
    // 地域ごとにグループ化
    const regions = {
      '北海道': [],
      '東北': [],
      '関東': [],
      '中部': [],
      '近畿': [],
      '中国': [],
      '四国': [],
      '九州・沖縄': [],
      '海外': []
    };
    
    // すべての行を取得してグループ化
    const rows = Array.from(tableBody.querySelectorAll('.notion-table-row'));
    rows.forEach(row => {
      const regionCell = row.querySelector('.notion-table-cell:nth-child(3)');
      if (regionCell) {
        const region = regionCell.textContent.trim();
        if (regions[region]) {
          regions[region].push(row);
        }
      }
    });
    
    // テーブルボディをクリア
    tableBody.innerHTML = '';
    
    // 地域ごとに再配置
    Object.entries(regions).forEach(([regionName, regionRows]) => {
      if (regionRows.length === 0) return;
      
      // 地域ヘッダーを追加
      const header = document.createElement('div');
      header.className = 'prefecture-region-header';
      header.textContent = regionName;
      tableBody.appendChild(header);
      
      // 都道府県カードを追加
      regionRows.forEach(row => {
        // 地域バッジの色を設定
        const regionCell = row.querySelector('.notion-table-cell:nth-child(3)');
        if (regionCell) {
          const badge = document.createElement('span');
          badge.textContent = regionName;
          badge.style.cssText = `
            display: inline-block !important;
            padding: 4px 8px !important;
            border-radius: 12px !important;
            font-size: 0.7rem !important;
            font-weight: 600 !important;
            background: ${getRegionColor(regionName)} !important;
            color: white !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
          `;
          regionCell.innerHTML = '';
          regionCell.appendChild(badge);
        }
        
        // 行をクリック可能にする
        const firstCell = row.querySelector('.notion-table-cell:first-child');
        const urlCell = row.querySelector('.notion-table-cell:nth-child(2) a');
        
        if (firstCell && urlCell) {
          row.style.cursor = 'pointer';
          row.onclick = (e) => {
            e.preventDefault();
            window.location.href = urlCell.href;
          };
        }
        
        tableBody.appendChild(row);
      });
    });
    
    console.log('ギャラリースタイル変換完了');
  }
  
  function getRegionColor(region) {
    const colors = {
      '海外': '#e74c3c',
      '九州・沖縄': '#f39c12',
      '四国': '#27ae60',
      '中国': '#3498db',
      '近畿': '#9b59b6',
      '中部': '#34495e',
      '関東': '#e67e22',
      '東北': '#16a085',
      '北海道': '#c0392b'
    };
    return colors[region] || '#95a5a6';
  }
  
  // 実行
  setTimeout(() => {
    createGalleryStyle();
    transformToGallery();
  }, 1500);
  
  // 動的な変更に対応
  const observer = new MutationObserver(() => {
    const collection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    if (collection && !collection.hasAttribute('data-gallery-transformed')) {
      createGalleryStyle();
      transformToGallery();
      collection.setAttribute('data-gallery-transformed', 'true');
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();