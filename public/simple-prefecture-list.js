// 都道府県テーブルをシンプルなリスト形式に変換
(function() {
  console.log('シンプルな都道府県リスト変換開始');
  
  function createSimpleListStyle() {
    const styleId = 'prefecture-simple-list';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* テーブル全体の枠線を削除してシンプルに */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table {
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 1rem 0 !important;
      }
      
      /* ヘッダーを非表示 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-header {
        display: none !important;
      }
      
      /* テーブルビュー全体 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-view {
        background: transparent !important;
        padding: 0 !important;
      }
      
      /* 各行のスタイル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row {
        border: none !important;
        border-bottom: 1px solid #e5e5e5 !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        transition: background-color 0.2s ease !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row:hover {
        background-color: #f5f5f5 !important;
        transform: none !important;
        box-shadow: none !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row:last-child {
        border-bottom: none !important;
      }
      
      /* セルの基本スタイル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell {
        padding: 12px 0 !important;
        background: transparent !important;
        border: none !important;
      }
      
      /* 都道府県名（最初のセル） */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:first-child {
        width: 120px !important;
        min-width: 120px !important;
        font-weight: 500 !important;
        font-size: 1rem !important;
        color: #333 !important;
        padding-left: 20px !important;
        position: relative !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:first-child::before {
        content: "•" !important;
        position: absolute !important;
        left: 8px !important;
        color: #999 !important;
      }
      
      /* URL（2番目のセル） */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(2) {
        flex: 1 !important;
        padding-left: 20px !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(2) a {
        color: #0066cc !important;
        text-decoration: none !important;
        font-size: 0.9rem !important;
        transition: color 0.2s ease !important;
      }
      
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(2) a:hover {
        color: #0052a3 !important;
        text-decoration: underline !important;
      }
      
      /* 地域（3番目のセル） */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(3) {
        width: 100px !important;
        text-align: right !important;
        padding-right: 20px !important;
        font-size: 0.85rem !important;
        color: #666 !important;
      }
      
      /* 4番目のセルを非表示 */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(4) {
        display: none !important;
      }
      
      /* 行を横並びに */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-row {
        display: flex !important;
        align-items: center !important;
      }
      
      /* コレクション全体のスタイル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d {
        background: white !important;
        padding: 20px !important;
        border: 1px solid #e5e5e5 !important;
        border-radius: 8px !important;
        margin: 2rem 0 !important;
      }
      
      /* コレクションタイトル */
      .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-collection-header-title {
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        color: #333 !important;
        margin-bottom: 20px !important;
        padding-bottom: 10px !important;
        border-bottom: 2px solid #e5e5e5 !important;
      }
      
      /* レスポンシブ対応 */
      @media (max-width: 768px) {
        .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:first-child {
          width: 80px !important;
          min-width: 80px !important;
          font-size: 0.9rem !important;
          padding-left: 15px !important;
        }
        
        .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(2) {
          padding-left: 10px !important;
        }
        
        .notion-collection.notion-block-20db802cb0c68041b934d188d150066d .notion-table-cell:nth-child(3) {
          display: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    console.log('シンプルリストスタイル適用完了');
  }
  
  // 実行
  setTimeout(() => {
    createSimpleListStyle();
  }, 1000);
  
  // 動的な変更に対応
  const observer = new MutationObserver(() => {
    const collection = document.querySelector('.notion-collection.notion-block-20db802cb0c68041b934d188d150066d');
    if (collection && !collection.hasAttribute('data-simple-list')) {
      createSimpleListStyle();
      collection.setAttribute('data-simple-list', 'true');
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();