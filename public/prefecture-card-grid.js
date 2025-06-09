// 都道府県テーブルをカードグリッドレイアウトに変換（ギャラリービューの再現）
(function() {
  console.log('都道府県カードグリッド変換開始');
  
  function createCardGridStyle() {
    const styleId = 'prefecture-card-grid';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* コレクション全体のスタイル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d {
        background: #f8f9fa !important;
        padding: 24px !important;
        border-radius: 12px !important;
        margin: 2rem 0 !important;
        border: 1px solid #e9ecef !important;
      }
      
      /* テーブルのボーダーを削除 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      
      /* ヘッダーを非表示 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-header {
        display: none !important;
      }
      
      /* テーブルボディをグリッドレイアウトに */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-body {
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important;
        gap: 12px !important;
        padding: 0 !important;
        background: transparent !important;
      }
      
      /* 各行をカードスタイルに */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: white !important;
        border: 1px solid #dee2e6 !important;
        border-radius: 8px !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: 50px !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        position: relative !important;
        overflow: hidden !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
        border-color: #adb5bd !important;
      }
      
      /* すべてのセルを非表示にして、最初のセルのみ表示 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell {
        display: none !important;
      }
      
      /* 都道府県名（最初のセル）のみ表示 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:first-child {
        display: block !important;
        padding: 12px 16px !important;
        text-align: center !important;
        font-size: 0.95rem !important;
        font-weight: 600 !important;
        color: #495057 !important;
        background: transparent !important;
        width: 100% !important;
        font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif !important;
      }
      
      /* コレクションタイトル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-collection-header {
        margin-bottom: 20px !important;
        text-align: center !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-collection-header-title {
        font-size: 1.5rem !important;
        font-weight: 700 !important;
        color: #212529 !important;
        margin: 0 !important;
      }
      
      /* レスポンシブ対応 */
      @media (max-width: 768px) {
        .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-body {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
          gap: 8px !important;
        }
        
        .notion-collection.notion-block-20db802cb0c68041b934d188d150066d {
          padding: 16px !important;
        }
      }
      
      @media (max-width: 480px) {
        .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-body {
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  function makeCardsClickable() {
    const collection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    if (!collection) return;
    
    const rows = collection.querySelectorAll('.notion-table-row');
    rows.forEach(row => {
      // URLを取得（2番目のセルから）
      const urlCell = row.querySelector('.notion-table-cell:nth-child(2) a');
      if (urlCell && urlCell.href) {
        row.style.cursor = 'pointer';
        row.onclick = (e) => {
          e.preventDefault();
          window.location.href = urlCell.href;
        };
      }
    });
    
    console.log(`${rows.length}個のカードをクリック可能にしました`);
  }
  
  // 実行
  setTimeout(() => {
    createCardGridStyle();
    makeCardsClickable();
    console.log('カードグリッド変換完了');
  }, 1000);
  
  // 動的な変更に対応
  const observer = new MutationObserver(() => {
    const collection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    if (collection && !collection.hasAttribute('data-card-grid')) {
      createCardGridStyle();
      makeCardsClickable();
      collection.setAttribute('data-card-grid', 'true');
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();