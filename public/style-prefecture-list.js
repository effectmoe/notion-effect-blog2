(function() {
  'use strict';
  
  console.log('[Prefecture List Styler] Script loaded at', new Date().toISOString());
  
  // より広範なパターンマッチング（部分一致も含む）
  const prefecturePattern = /(北海道|青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|東京|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|京都|大阪|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)/;
  
  function stylePrefectureList() {
    try {
      // より幅広いセレクターでリンクを探す
      const allLinks = document.querySelectorAll('a.notion-page-link, .notion-page-link, .notion-list-item');
      console.log('[Prefecture List Styler] Found potential links:', allLinks.length);
      
      // 都道府県リンクを収集
      const prefectureLinks = [];
      allLinks.forEach(link => {
        const text = link.textContent?.trim() || '';
        if (text && prefecturePattern.test(text)) {
          prefectureLinks.push(link);
          console.log('[Prefecture List Styler] Found prefecture:', text);
        }
      });
      
      console.log('[Prefecture List Styler] Total prefecture links found:', prefectureLinks.length);
      
      // 都道府県リンクが10個以上ある場合、それらの親要素を探してスタイルを適用
      if (prefectureLinks.length >= 10) {
        // 共通の親要素を見つける
        let commonParent = null;
        
        // 最初のリンクから上に辿って、すべてのリンクを含む最小の親要素を見つける
        let currentParent = prefectureLinks[0].parentElement;
        
        while (currentParent && currentParent !== document.body) {
          let containsAll = true;
          
          for (const link of prefectureLinks) {
            if (!currentParent.contains(link)) {
              containsAll = false;
              break;
            }
          }
          
          if (containsAll) {
            // notion-listクラスがある親要素を優先
            if (currentParent.classList.contains('notion-list')) {
              commonParent = currentParent;
              break;
            }
            // なければ最初に見つかった共通の親を記憶
            if (!commonParent) {
              commonParent = currentParent;
            }
          }
          
          currentParent = currentParent.parentElement;
        }
        
        if (commonParent && !commonParent.classList.contains('prefecture-list-styled')) {
          console.log('[Prefecture List Styler] Applying styles to parent element');
          commonParent.classList.add('prefecture-list-styled');
          
          // スタイルを適用
          if (!document.getElementById('prefecture-list-styles')) {
            const style = document.createElement('style');
            style.id = 'prefecture-list-styles';
            style.textContent = `
              .prefecture-list-styled {
                display: grid !important;
                grid-template-columns: repeat(6, 1fr) !important;
                gap: 2px !important;
                padding: 0 !important;
                background: transparent !important;
                border-radius: 0 !important;
                border: none !important;
                max-height: 360px !important;
                overflow-y: auto !important;
                margin: 1rem 0 !important;
                padding-right: 4px !important;
              }
              
              .prefecture-list-styled a.notion-page-link,
              .prefecture-list-styled .notion-page-link,
              .prefecture-list-styled .notion-list-item,
              .prefecture-list-styled > a,
              .prefecture-list-styled > div {
                background: rgba(0, 0, 0, 0.02) !important;
                border: none !important;
                border-radius: 4px !important;
                padding: 10px 4px !important;
                min-height: 40px !important;
                transition: background-color 0.12s ease !important;
                cursor: pointer !important;
                position: relative !important;
                overflow: hidden !important;
                box-shadow: none !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin: 0 !important;
                text-align: center !important;
                text-decoration: none !important;
                font-size: 0.8125rem !important;
                font-weight: 400 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif !important;
                color: var(--fg-color) !important;
                line-height: 1 !important;
                letter-spacing: 0 !important;
                white-space: nowrap !important;
                text-overflow: ellipsis !important;
              }
              
              .prefecture-list-styled a.notion-page-link:hover,
              .prefecture-list-styled .notion-page-link:hover,
              .prefecture-list-styled .notion-list-item:hover,
              .prefecture-list-styled > a:hover,
              .prefecture-list-styled > div:hover {
                background: rgba(0, 0, 0, 0.05) !important;
                transform: none !important;
                box-shadow: none !important;
              }
              
              /* スクロールバー - より細くて控えめに */
              .prefecture-list-styled::-webkit-scrollbar {
                width: 4px;
              }
              
              .prefecture-list-styled::-webkit-scrollbar-track {
                background: transparent;
              }
              
              .prefecture-list-styled::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 2px;
              }
              
              .prefecture-list-styled::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.15);
              }
              
              /* ダークモード対応 */
              @media (prefers-color-scheme: dark) {
                .prefecture-list-styled a,
                .prefecture-list-styled > div {
                  background: rgba(255, 255, 255, 0.04) !important;
                }
                
                .prefecture-list-styled a:hover,
                .prefecture-list-styled > div:hover {
                  background: rgba(255, 255, 255, 0.08) !important;
                }
                
                .prefecture-list-styled::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.1);
                }
                
                .prefecture-list-styled::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.15);
                }
              }
              
              /* レスポンシブ対応 */
              @media (max-width: 768px) {
                .prefecture-list-styled {
                  grid-template-columns: repeat(5, 1fr) !important;
                  gap: 2px !important;
                  max-height: 340px !important;
                }
                
                .prefecture-list-styled a,
                .prefecture-list-styled > div {
                  padding: 9px 3px !important;
                  min-height: 38px !important;
                  font-size: 0.775rem !important;
                }
              }
              
              @media (max-width: 480px) {
                .prefecture-list-styled {
                  grid-template-columns: repeat(4, 1fr) !important;
                  gap: 2px !important;
                  max-height: 300px !important;
                }
                
                .prefecture-list-styled a,
                .prefecture-list-styled > div {
                  padding: 8px 2px !important;
                  min-height: 36px !important;
                  font-size: 0.75rem !important;
                  border-radius: 3px !important;
                }
              }
            `;
            document.head.appendChild(style);
          }
        }
      }
    } catch (error) {
      console.error('[Prefecture List Styler] Error:', error);
    }
  }
  
  // 初回実行
  setTimeout(stylePrefectureList, 500);
  setTimeout(stylePrefectureList, 1000);
  setTimeout(stylePrefectureList, 2000);
  
  // DOMの変更を監視
  const observer = new MutationObserver(() => {
    stylePrefectureList();
  });
  
  // DOMContentLoadedでも実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stylePrefectureList);
  } else {
    stylePrefectureList();
  }
  
  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }, 1000);
})();