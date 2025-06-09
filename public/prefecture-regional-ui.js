(function() {
  'use strict';

  // スタイルを追加
  function addStyles() {
    const styleId = 'prefecture-regional-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      /* 都道府県リストのカード全体をゴシック体に */
      .notion-collection-card {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif !important;
      }
      
      /* ギャラリーグリッドの行間隔を詰める */
      .notion-gallery-grid {
        gap: 8px !important;
        row-gap: 8px !important;
      }
      
      /* 地域別のヘッダー（東北、関東など）を大きくする - 複数のセレクタに対応 */
      .notion-gallery-view > div > div:first-child,
      .notion-gallery > div > div:first-child,
      [class*="notion-collection"] > div > div:first-child {
        font-size: 1.5em !important;
        font-weight: bold !important;
        padding: 12px 0 !important;
      }
      
      /* Notion detailsタグの地域ヘッダー */
      details > summary {
        font-size: 1.5em !important;
        font-weight: bold !important;
        padding: 12px 0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 初期化
  function initialize() {
    addStyles();
  }

  // ページ読み込み完了後に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();