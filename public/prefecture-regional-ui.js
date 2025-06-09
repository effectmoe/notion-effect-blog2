(function() {
  'use strict';

  // 初期化時に公認インストラクターセクションを特定してスタイルを適用
  function applyPrefectureStyles() {
    // 見出しを探す
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach(heading => {
      const text = heading.textContent || '';
      if (text.includes('公認インストラクター')) {
        // この見出しの後の要素を探す
        let current = heading.nextElementSibling;
        
        while (current) {
          // 次の見出しに到達したら終了
          if (current.matches('h1, h2, h3, h4, h5, h6')) break;
          
          // ギャラリーグリッドの間隔を詰める
          const grids = current.querySelectorAll('.notion-gallery-grid');
          grids.forEach(grid => {
            grid.style.gap = '8px';
            grid.style.rowGap = '8px';
          });
          
          // カードをゴシック体にする
          const cards = current.querySelectorAll('.notion-collection-card');
          cards.forEach(card => {
            card.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif';
          });
          
          // 地域名（北海道、東北など）を大きくする
          const summaries = current.querySelectorAll('details > summary');
          summaries.forEach(summary => {
            const summaryText = summary.textContent || '';
            // 地域名を含むsummaryのみ
            if (summaryText.match(/▼\s*(北海道|東北|関東|中部|近畿|中国|四国|九州)/)) {
              summary.style.fontSize = '1.5em';
              summary.style.fontWeight = 'bold';
              summary.style.padding = '16px 0';
            }
          });
          
          current = current.nextElementSibling;
        }
      }
    });
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