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
      
      /* 地域別のヘッダー（東北、関東など）を大きくする */
      .notion-collection-group summary,
      .notion-collection-group > div:first-child {
        font-size: 1.5em !important;
        font-weight: bold !important;
        padding: 12px 0 !important;
      }
      
      /* 折りたたみ可能なグループのスタイル調整 */
      details.notion-collection-group summary {
        font-size: 1.5em !important;
        font-weight: bold !important;
        padding: 12px 0 !important;
        cursor: pointer;
      }
      
      /* グループタイトルの背景色や装飾を追加（オプション） */
      details.notion-collection-group summary::before {
        content: "▼ ";
        display: inline-block;
        transition: transform 0.2s;
      }
      
      details.notion-collection-group[open] summary::before {
        transform: rotate(-90deg);
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