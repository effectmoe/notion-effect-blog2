// Notionテーブルにスタイルを直接適用
(function() {
  console.log('テーブルスタイル拡張スクリプト開始');
  
  function enhanceTableStyles() {
    // すべての.notion-tableを探す
    const notionTables = document.querySelectorAll('.notion-table');
    
    notionTables.forEach((table, index) => {
      console.log(`テーブル ${index + 1} を処理中`);
      
      // テーブル全体のスタイル
      table.style.cssText = `
        border: 1px solid #e1e4e8 !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        background: #ffffff !important;
        margin: 1.5rem 0 !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
      `;
      
      // ヘッダー行のスタイル
      const headers = table.querySelectorAll('.notion-table-header');
      headers.forEach(header => {
        header.style.cssText = `
          background: #f6f8fa !important;
          border-bottom: 2px solid #e1e4e8 !important;
          font-weight: 600 !important;
        `;
      });
      
      // すべての行のスタイル
      const rows = table.querySelectorAll('.notion-table-row');
      rows.forEach((row, rowIndex) => {
        row.style.cssText = `
          border-bottom: 1px solid #e1e4e8 !important;
          transition: background-color 0.15s ease !important;
        `;
        
        // 最後の行の境界線を削除
        if (rowIndex === rows.length - 1) {
          row.style.borderBottom = 'none !important';
        }
        
        // ホバー効果
        row.addEventListener('mouseenter', function() {
          this.style.backgroundColor = '#f6f8fa';
        });
        row.addEventListener('mouseleave', function() {
          this.style.backgroundColor = 'transparent';
        });
      });
      
      // セルのスタイル
      const cells = table.querySelectorAll('.notion-table-cell');
      cells.forEach(cell => {
        cell.style.cssText = `
          padding: 12px 16px !important;
          font-size: 0.875rem !important;
          vertical-align: middle !important;
          color: #24292e !important;
          font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif !important;
        `;
      });
      
      // 各行の最初のセル（タイトル列）を強調
      rows.forEach(row => {
        const firstCell = row.querySelector('.notion-table-cell:first-child');
        if (firstCell) {
          firstCell.style.cssText += `
            font-weight: 600 !important;
            background: rgba(0, 0, 0, 0.02) !important;
            min-width: 120px !important;
          `;
        }
      });
      
      // リンクのスタイル
      const links = table.querySelectorAll('a');
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
      const collectionHeaders = document.querySelectorAll('.notion-collection-header-title');
      collectionHeaders.forEach(header => {
        header.style.cssText = `
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #24292e !important;
          margin-bottom: 1rem !important;
          font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif !important;
        `;
      });
    });
    
    console.log(`${notionTables.length} 個のテーブルにスタイルを適用しました`);
  }
  
  // ページ読み込み後に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceTableStyles);
  } else {
    // 既に読み込まれている場合は少し待ってから実行
    setTimeout(enhanceTableStyles, 1000);
  }
  
  // 動的に追加される要素に対応するため、定期的に再実行
  setInterval(function() {
    const unstyledTables = document.querySelectorAll('.notion-table:not([data-styled])');
    if (unstyledTables.length > 0) {
      enhanceTableStyles();
      unstyledTables.forEach(table => {
        table.setAttribute('data-styled', 'true');
      });
    }
  }, 2000);
})();