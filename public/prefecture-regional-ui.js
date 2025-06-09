(function() {
  'use strict';

  // CSSスタイルシートを追加
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    /* グリッドの間隔を強制的に詰める */
    .notion-gallery-grid {
      gap: 8px !important;
      row-gap: 8px !important;
      grid-gap: 8px !important;
    }
    
    /* カードのフォントを強制的にゴシック体に */
    .notion-collection-card,
    .notion-collection-card * {
      font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif !important;
    }
  `;
  document.head.appendChild(styleSheet);

  function applyStyles() {
    // 1. ギャラリーグリッドの間隔を詰める
    document.querySelectorAll('.notion-gallery-grid').forEach(grid => {
      grid.style.setProperty('gap', '8px', 'important');
      grid.style.setProperty('row-gap', '8px', 'important');
      grid.style.setProperty('grid-gap', '8px', 'important');
    });

    // 2. カード内のすべてのテキストをゴシック体にする
    document.querySelectorAll('.notion-collection-card').forEach(card => {
      card.style.setProperty('font-family', '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif', 'important');
      // カード内のすべての要素にも適用
      card.querySelectorAll('*').forEach(el => {
        el.style.setProperty('font-family', '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif', 'important');
      });
    });

    // 3. 地域名を大きくする
    document.querySelectorAll('details > summary').forEach(summary => {
      const text = summary.textContent || '';
      if (text.includes('北海道') || text.includes('東北') || 
          text.includes('関東') || text.includes('中部') || 
          text.includes('近畿') || text.includes('中国') || 
          text.includes('四国') || text.includes('九州')) {
        summary.style.setProperty('font-size', '1.5em', 'important');
        summary.style.setProperty('font-weight', 'bold', 'important');
        summary.style.setProperty('padding', '16px 0', 'important');
      }
    });
    
    console.log('[Prefecture UI] Styles applied');
  }

  // 即座に実行
  applyStyles();

  // 1秒後、2秒後、3秒後にも実行
  setTimeout(applyStyles, 1000);
  setTimeout(applyStyles, 2000);
  setTimeout(applyStyles, 3000);

  // MutationObserverでも監視
  const observer = new MutationObserver(applyStyles);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();