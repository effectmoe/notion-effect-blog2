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
      
      /* 「東北」などの地域タイトルだけを大きくする */
      details > summary:has-text("北海道"),
      details > summary:has-text("東北"),
      details > summary:has-text("関東"),
      details > summary:has-text("中部"),
      details > summary:has-text("近畿"),
      details > summary:has-text("中国"),
      details > summary:has-text("四国"),
      details > summary:has-text("九州") {
        font-size: 1.5em !important;
        font-weight: bold !important;
        padding: 12px 0 !important;
      }
      
      /* より一般的なアプローチ：▼マークがあるsummaryのみ */
      details > summary:first-child {
        font-size: 1.3em !important;
        font-weight: bold !important;
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