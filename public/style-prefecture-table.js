// 都道府県テーブルに直接スタイルを適用
(function() {
  console.log('都道府県テーブルスタイル適用開始');
  
  function applyPrefectureTableStyles() {
    // 都道府県テーブルを特定（コレクション4）
    const prefectureCollection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    
    if (!prefectureCollection) {
      console.log('都道府県コレクションが見つかりません');
      return;
    }
    
    console.log('都道府県コレクションを発見');
    
    // テーブル全体のコンテナにスタイルを適用
    const tableContainer = prefectureCollection.querySelector('.notion-table');
    if (tableContainer) {
      tableContainer.style.cssText = `
        border: 1px solid #e1e4e8 !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        background: #ffffff !important;
        margin: 1.5rem 0 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
      `;
    }
    
    // テーブルビューにスタイルを適用
    const tableView = prefectureCollection.querySelector('.notion-table-view');
    if (tableView) {
      tableView.style.cssText = `
        width: 100% !important;
      `;
    }
    
    // ヘッダー行にスタイルを適用
    const headers = prefectureCollection.querySelectorAll('.notion-table-header');
    headers.forEach(header => {
      header.style.cssText = `
        background: #f6f8fa !important;
        border-bottom: 2px solid #e1e4e8 !important;
        font-weight: 600 !important;
      `;
      
      // ヘッダー内のテキストにもスタイルを適用
      const headerInner = header.querySelector('.notion-table-header-inner');
      if (headerInner) {
        headerInner.style.cssText = `
          padding: 12px 16px !important;
          font-size: 0.875rem !important;
          color: #24292e !important;
          font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif !important;
        `;
      }
    });
    
    // すべての行にスタイルを適用
    const rows = prefectureCollection.querySelectorAll('.notion-table-row');
    console.log(`${rows.length}個の行を処理`);
    
    rows.forEach((row, index) => {
      // 行の基本スタイル
      row.style.cssText = `
        border-bottom: 1px solid #e1e4e8 !important;
        transition: background-color 0.15s ease !important;
        cursor: pointer !important;
      `;
      
      // 最後の行の境界線を削除
      if (index === rows.length - 1) {
        row.style.borderBottom = 'none !important';
      }
      
      // ホバー効果
      row.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#f6f8fa';
      });
      row.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
      });
      
      // セルにスタイルを適用
      const cells = row.querySelectorAll('.notion-table-cell');
      cells.forEach((cell, cellIndex) => {
        cell.style.cssText = `
          padding: 12px 16px !important;
          font-size: 0.875rem !important;
          vertical-align: middle !important;
          color: #24292e !important;
          font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif !important;
        `;
        
        // 最初のセル（都道府県名）を強調
        if (cellIndex === 0) {
          cell.style.cssText += `
            font-weight: 600 !important;
            background: rgba(0, 0, 0, 0.02) !important;
            min-width: 120px !important;
          `;
        }
        
        // 地域列（3番目）の背景色
        if (cellIndex === 2) {
          const region = cell.textContent.trim();
          let bgColor = '';
          
          switch(region) {
            case '海外':
              bgColor = 'rgba(229, 115, 115, 0.08)';
              break;
            case '九州・沖縄':
              bgColor = 'rgba(255, 183, 77, 0.08)';
              break;
            case '四国':
              bgColor = 'rgba(129, 199, 132, 0.08)';
              break;
            case '中国':
              bgColor = 'rgba(77, 182, 172, 0.08)';
              break;
            case '近畿':
              bgColor = 'rgba(186, 104, 200, 0.08)';
              break;
            case '中部':
              bgColor = 'rgba(149, 117, 205, 0.08)';
              break;
            case '関東':
              bgColor = 'rgba(100, 181, 246, 0.08)';
              break;
            case '東北':
              bgColor = 'rgba(255, 152, 0, 0.08)';
              break;
            case '北海道':
              bgColor = 'rgba(229, 115, 115, 0.08)';
              break;
          }
          
          if (bgColor) {
            cell.style.backgroundColor = bgColor + ' !important';
            cell.style.padding = '8px 12px !important';
            cell.style.borderRadius = '4px !important';
          }
        }
      });
    });
    
    // リンクのスタイル
    const links = prefectureCollection.querySelectorAll('a');
    links.forEach(link => {
      link.style.cssText = `
        color: #0366d6 !important;
        text-decoration: none !important;
        transition: all 0.15s ease !important;
      `;
      
      link.addEventListener('mouseenter', function() {
        this.style.textDecoration = 'underline';
        this.style.opacity = '0.8';
      });
      link.addEventListener('mouseleave', function() {
        this.style.textDecoration = 'none';
        this.style.opacity = '1';
      });
    });
    
    // コレクションタイトルのスタイル
    const collectionTitle = prefectureCollection.querySelector('.notion-collection-header-title');
    if (collectionTitle) {
      collectionTitle.style.cssText = `
        font-size: 1.5rem !important;
        font-weight: 700 !important;
        color: #24292e !important;
        margin-bottom: 1rem !important;
        font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif !important;
      `;
    }
    
    console.log('都道府県テーブルのスタイル適用完了');
  }
  
  // ページ読み込み後に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPrefectureTableStyles);
  } else {
    setTimeout(applyPrefectureTableStyles, 1000);
  }
  
  // 動的な変更に対応
  const observer = new MutationObserver(function(mutations) {
    const prefectureCollection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    if (prefectureCollection && !prefectureCollection.hasAttribute('data-styled')) {
      applyPrefectureTableStyles();
      prefectureCollection.setAttribute('data-styled', 'true');
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();