// 都道府県テーブルに強制的にスタイルを適用（!importantと高い特異性を使用）
(function() {
  console.log('強制スタイル適用開始');
  
  // スタイルタグを作成して直接挿入
  function injectStyles() {
    const styleId = 'prefecture-table-forced-styles';
    
    // 既存のスタイルがあれば削除
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 都道府県テーブル専用の強制スタイル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table {
        border: 2px solid #e1e4e8 !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        background: #ffffff !important;
        margin: 2rem 0 !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
        padding: 0 !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-view {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-header {
        background: linear-gradient(to bottom, #f8f9fa, #e9ecef) !important;
        border-bottom: 3px solid #dee2e6 !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 10 !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-header-inner {
        padding: 16px 20px !important;
        font-size: 0.9rem !important;
        font-weight: 700 !important;
        color: #212529 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row {
        border-bottom: 1px solid #e9ecef !important;
        transition: all 0.2s ease !important;
        position: relative !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row:hover {
        background-color: #f8f9fa !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row:last-child {
        border-bottom: none !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell {
        padding: 16px 20px !important;
        font-size: 0.95rem !important;
        color: #495057 !important;
        vertical-align: middle !important;
        font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif !important;
        line-height: 1.5 !important;
      }
      
      /* 最初のセル（都道府県名）の強調 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:first-child {
        font-weight: 600 !important;
        background: linear-gradient(to right, rgba(0,123,255,0.05), transparent) !important;
        color: #212529 !important;
        font-size: 1rem !important;
        position: relative !important;
        padding-left: 30px !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:first-child::before {
        content: "📍" !important;
        position: absolute !important;
        left: 10px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
      }
      
      /* URL列のスタイル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell-url a {
        color: #007bff !important;
        text-decoration: none !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        display: inline-block !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        background: rgba(0,123,255,0.05) !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell-url a:hover {
        background: rgba(0,123,255,0.15) !important;
        transform: translateX(2px) !important;
      }
      
      /* 地域列の色分けスタイル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(3) {
        font-weight: 600 !important;
        padding: 12px 16px !important;
      }
      
      /* 地域ごとのカラーバッジ */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row:has(.notion-table-cell:nth-child(3):contains("海外")) .notion-table-cell:nth-child(3) {
        background: #ff6b6b !important;
        color: white !important;
        border-radius: 20px !important;
        padding: 6px 16px !important;
        display: inline-block !important;
        font-size: 0.85rem !important;
      }
      
      /* コレクションヘッダーのスタイル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-collection-header {
        margin-bottom: 1.5rem !important;
        padding-bottom: 1rem !important;
        border-bottom: 2px solid #e9ecef !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-collection-header-title {
        font-size: 2rem !important;
        font-weight: 800 !important;
        color: #212529 !important;
        margin: 0 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif !important;
      }
      
      /* 視覚的な変更を確実にするための追加スタイル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d {
        background: #f8f9fa !important;
        padding: 2rem !important;
        border-radius: 16px !important;
        margin: 2rem 0 !important;
      }
      
      /* デバッグ用：明確な変更 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d::before {
        content: "🗾 都道府県一覧" !important;
        display: block !important;
        font-size: 1.5rem !important;
        font-weight: bold !important;
        color: #007bff !important;
        margin-bottom: 1rem !important;
        text-align: center !important;
        padding: 1rem !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        border-radius: 8px !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log('スタイルタグを挿入しました');
  }
  
  // 地域ごとにバッジスタイルを適用する関数
  function applyRegionBadges() {
    const collection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    if (!collection) return;
    
    const rows = collection.querySelectorAll('.notion-table-row');
    rows.forEach(row => {
      const regionCell = row.querySelector('.notion-table-cell:nth-child(3)');
      if (regionCell) {
        const region = regionCell.textContent.trim();
        const badge = document.createElement('span');
        badge.textContent = region;
        badge.style.cssText = `
          display: inline-block !important;
          padding: 4px 12px !important;
          border-radius: 20px !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          margin: 0 !important;
        `;
        
        // 地域ごとの色設定
        const colors = {
          '海外': { bg: '#ff6b6b', color: 'white' },
          '九州・沖縄': { bg: '#feca57', color: '#333' },
          '四国': { bg: '#48dbfb', color: 'white' },
          '中国': { bg: '#ff9ff3', color: 'white' },
          '近畿': { bg: '#54a0ff', color: 'white' },
          '中部': { bg: '#10ac84', color: 'white' },
          '関東': { bg: '#ee5a6f', color: 'white' },
          '東北': { bg: '#c8d6e5', color: '#333' },
          '北海道': { bg: '#576574', color: 'white' }
        };
        
        const colorScheme = colors[region] || { bg: '#dfe6e9', color: '#2d3436' };
        badge.style.backgroundColor = colorScheme.bg + ' !important';
        badge.style.color = colorScheme.color + ' !important';
        
        regionCell.innerHTML = '';
        regionCell.appendChild(badge);
      }
    });
  }
  
  // 実行
  setTimeout(() => {
    injectStyles();
    applyRegionBadges();
    console.log('強制スタイル適用完了');
    
    // 視覚的な確認のためアラート
    const collection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    if (collection) {
      collection.style.border = '5px solid red !important';
      setTimeout(() => {
        collection.style.border = '2px solid #e1e4e8 !important';
      }, 2000);
      console.log('都道府県テーブルに赤い枠を一時的に表示しました');
    }
  }, 1500);
  
  // 動的な変更にも対応
  const observer = new MutationObserver(() => {
    const collection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    if (collection && !collection.hasAttribute('data-force-styled')) {
      injectStyles();
      applyRegionBadges();
      collection.setAttribute('data-force-styled', 'true');
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();