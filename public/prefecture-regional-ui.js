(function() {
  'use strict';

  // 公認インストラクターセクションにスタイルを適用
  function applyPrefectureStyles() {
    const heading = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .find(h => h.textContent.includes('公認インストラクター'));

    if (!heading) return;

    // 見出しの親要素（article）を取得
    const article = heading.closest('article');
    if (!article) return;

    // ギャラリーグリッドの間隔を詰める
    const grids = article.querySelectorAll('.notion-gallery-grid');
    grids.forEach(grid => {
      grid.style.gap = '8px';
      grid.style.rowGap = '8px';
    });

    // カードをゴシック体にする
    const cards = article.querySelectorAll('.notion-collection-card');
    cards.forEach(card => {
      card.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif';
    });

    // 地域名（北海道、東北など）を大きくする
    const summaries = article.querySelectorAll('details > summary');
    summaries.forEach(summary => {
      const summaryText = summary.textContent || '';
      if (summaryText.match(/▼\s*(北海道|東北|関東|中部|近畿|中国|四国|九州)/)) {
        summary.style.fontSize = '1.5em';
        summary.style.fontWeight = 'bold';
        summary.style.padding = '16px 0';
      }
    });

    console.log('[Prefecture UI] Styles applied');
  }

  // 初期化
  function initialize() {
    // 少し待ってから実行
    setTimeout(() => {
      applyPrefectureStyles();
    }, 1000);

    // 動的な変更を監視
    let debounceTimer;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        applyPrefectureStyles();
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ページ読み込み完了後に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();