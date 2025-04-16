import { useEffect } from 'react';

/**
 * WhatsNewStylingコンポーネント
 * Notionページのレンダリング後に、What's Newセクションのスタイルを修正します
 * このコンポーネントはUIを表示せず、DOMの操作のみを行います
 */
const WhatsNewStyling = () => {
  useEffect(() => {
    // What's Newセクションのスタイリングを適用する関数
    const applyWhatsNewStyling = () => {
      try {
        // Notion内のコレクションヘッダーを全て取得
        const collectionHeaders = document.querySelectorAll('.notion-collection-header');
        
        // ヘッダーを順に調査
        collectionHeaders.forEach((header) => {
          // What's Newというテキストを含むヘッダーを探す
          const headerTitle = header.querySelector('.notion-collection-header-title');
          
          if (headerTitle && 
              headerTitle.textContent && 
              (headerTitle.textContent.includes("What's New") || 
               headerTitle.textContent.includes("What") || 
               headerTitle.textContent.includes("New"))) {
            
            console.log('Found What\'s New section, applying styles...');
            
            // ヘッダーにカスタムクラスを追加
            header.classList.add('whats-new-header');
            
            // 親のギャラリーセクションを見つける
            const galleryParent = header.closest('.notion-collection');
            if (galleryParent) {
              galleryParent.classList.add('whats-new-gallery');
              
              // ギャラリー内のカードにもクラスを追加
              const cards = galleryParent.querySelectorAll('.notion-collection-card');
              cards.forEach(card => {
                card.classList.add('whats-new-card');
                
                // タイトル要素にクラスを追加
                const titleEl = card.querySelector('.notion-collection-card-property-title');
                if (titleEl) {
                  titleEl.classList.add('whats-new-title');
                }
                
                // カテゴリー要素にクラスを追加
                const categoryEls = card.querySelectorAll('.notion-property-select');
                categoryEls.forEach(el => {
                  el.classList.add('whats-new-category');
                });
                
                // 日付要素にクラスを追加
                const dateEls = card.querySelectorAll('.notion-property-date');
                dateEls.forEach(el => {
                  el.classList.add('whats-new-date');
                });
              });
            }
          }
        });
      } catch (err) {
        console.error('Error applying What\'s New styling:', err);
      }
    };

    // 初回実行 (DOMが完全に読み込まれた後に少し遅延させて実行)
    const initialTimer = setTimeout(() => {
      applyWhatsNewStyling();
    }, 1000);
    
    // Notionコンテンツが動的に変わることがあるため、インターバルで再適用
    const intervalId = setInterval(() => {
      applyWhatsNewStyling();
    }, 3000);
    
    // クリーンアップ関数
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, []);

  // このコンポーネントは何も表示しない
  return null;
};

export default WhatsNewStyling;
