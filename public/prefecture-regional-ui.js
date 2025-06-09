(function() {
  'use strict';

  // スタイルを追加
  function addStyles() {
    const styleId = 'prefecture-regional-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      /* 公認インストラクターセクション内のカードのみゴシック体に */
      /* ギャラリーグリッドの行間隔を詰める（公認インストラクターセクション内のみ） */
      /* 地域タイトルは標準のままとする */
    `;
    document.head.appendChild(style);
  }

  // 初期化時に公認インストラクターセクションを特定してスタイルを適用
  function applyCustomStyles() {
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
          
          // ギャラリーグリッドを見つけたらスタイルを適用
          const grids = current.querySelectorAll('.notion-gallery-grid');
          grids.forEach(grid => {
            grid.style.gap = '8px';
            grid.style.rowGap = '8px';
          });
          
          // カードを見つけたらゴシック体を適用
          const cards = current.querySelectorAll('.notion-collection-card');
          cards.forEach(card => {
            card.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif';
          });
          
          // 地域タイトル（details summary）を大きくする
          const summaries = current.querySelectorAll('details > summary');
          summaries.forEach(summary => {
            const summaryText = summary.textContent || '';
            // 地域名を含むsummaryのみ
            if (summaryText.includes('北海道') || summaryText.includes('東北') || 
                summaryText.includes('関東') || summaryText.includes('中部') || 
                summaryText.includes('近畿') || summaryText.includes('中国') || 
                summaryText.includes('四国') || summaryText.includes('九州')) {
              summary.style.fontSize = '1.3em';
              summary.style.fontWeight = 'bold';
              summary.style.padding = '12px 0';
            }
          });
          
          current = current.nextElementSibling;
        }
      }
    });
  }

  // 初期化
  function initialize() {
    addStyles();
    
    // 少し待ってから実行
    setTimeout(() => {
      applyCustomStyles();
    }, 1000);
    
    // 動的な変更を監視
    const observer = new MutationObserver(() => {
      applyCustomStyles();
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