(function() {
  'use strict';

  // スタイルシートを追加
  const style = document.createElement('style');
  style.textContent = `
    /* 公認インストラクターセクション内のスタイル */
    article:has(h1:has-text("公認インストラクター"), h2:has-text("公認インストラクター"), h3:has-text("公認インストラクター")) .notion-gallery-grid,
    article:has(h1[class*="notion-h"]:contains("公認インストラクター"), h2[class*="notion-h"]:contains("公認インストラクター"), h3[class*="notion-h"]:contains("公認インストラクター")) .notion-gallery-grid {
      gap: 8px !important;
      row-gap: 8px !important;
    }
    
    /* ゴシック体フォント */
    article:has(h1:has-text("公認インストラクター"), h2:has-text("公認インストラクター"), h3:has-text("公認インストラクター")) .notion-collection-card,
    article:has(h1[class*="notion-h"]:contains("公認インストラクター"), h2[class*="notion-h"]:contains("公認インストラクター"), h3[class*="notion-h"]:contains("公認インストラクター")) .notion-collection-card {
      font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif !important;
    }
    
    /* 地域名を大きく */
    details > summary {
      font-size: inherit;
    }
    
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
      padding: 16px 0 !important;
    }
  `;
  
  // :has-textと:containsはサポートされていないため、JavaScriptで処理
  function applyStyles() {
    // 公認インストラクターの見出しを含むarticleを探す
    const articles = document.querySelectorAll('article');
    let targetArticle = null;
    
    for (const article of articles) {
      const headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (const heading of headings) {
        if (heading.textContent.includes('公認インストラクター')) {
          targetArticle = article;
          break;
        }
      }
      if (targetArticle) break;
    }
    
    if (targetArticle) {
      // グリッドの間隔
      const grids = targetArticle.querySelectorAll('.notion-gallery-grid');
      grids.forEach(grid => {
        grid.style.gap = '8px';
        grid.style.rowGap = '8px';
      });
      
      // ゴシック体
      const cards = targetArticle.querySelectorAll('.notion-collection-card');
      cards.forEach(card => {
        card.style.fontFamily = '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';
      });
      
      // 地域名を大きく
      const summaries = targetArticle.querySelectorAll('details > summary');
      summaries.forEach(summary => {
        const text = summary.textContent || '';
        if (text.includes('北海道') || text.includes('東北') || 
            text.includes('関東') || text.includes('中部') || 
            text.includes('近畿') || text.includes('中国') || 
            text.includes('四国') || text.includes('九州')) {
          summary.style.fontSize = '1.5em';
          summary.style.fontWeight = 'bold';
          summary.style.padding = '16px 0';
        }
      });
    }
  }
  
  // スタイルを追加
  document.head.appendChild(style);
  
  // DOMContentLoadedとMutationObserverの両方で実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStyles);
  } else {
    applyStyles();
  }
  
  // 2秒後にも実行（Notionの動的読み込み対策）
  setTimeout(applyStyles, 2000);
  
  // MutationObserver
  const observer = new MutationObserver(() => {
    applyStyles();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();