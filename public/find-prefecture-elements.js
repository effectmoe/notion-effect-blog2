// 都道府県リストの要素を詳しく調査
(function() {
  console.log('=== 都道府県リスト要素の調査開始 ===');
  
  setTimeout(() => {
    // 都道府県のリンクを探す
    const prefecturePatterns = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];
    
    // すべてのリンクから都道府県を含むものを探す
    const allLinks = document.querySelectorAll('a');
    const prefectureLinks = [];
    
    allLinks.forEach(link => {
      const text = link.textContent || '';
      if (prefecturePatterns.some(pref => text.includes(pref))) {
        prefectureLinks.push(link);
      }
    });
    
    console.log(`都道府県リンク数: ${prefectureLinks.length}`);
    
    if (prefectureLinks.length > 0) {
      // 最初のリンクの詳細な構造を調査
      const firstLink = prefectureLinks[0];
      console.log('最初の都道府県リンク:', firstLink.textContent);
      console.log('リンクURL:', firstLink.href);
      
      // 親要素を辿る
      let current = firstLink;
      let parents = [];
      for (let i = 0; i < 15; i++) {
        current = current.parentElement;
        if (!current) break;
        
        const info = {
          tagName: current.tagName,
          className: current.className,
          id: current.id,
          childrenCount: current.children.length
        };
        parents.push(info);
        console.log(`親要素${i + 1}:`, info);
        
        // 重要な要素を特定
        if (current.className.includes('notion-collection') ||
            current.className.includes('notion-table') ||
            current.className.includes('notion-list') ||
            current.className.includes('notion-gallery')) {
          console.log('*** 重要な親要素を発見 ***:', current.className);
        }
      }
      
      // 都道府県リンクを含む最も近い共通の親要素を探す
      if (prefectureLinks.length >= 2) {
        const firstLinkParents = [];
        let temp = prefectureLinks[0];
        while (temp) {
          firstLinkParents.push(temp);
          temp = temp.parentElement;
        }
        
        // 2番目のリンクから共通の親を探す
        temp = prefectureLinks[1];
        while (temp) {
          if (firstLinkParents.includes(temp)) {
            console.log('\n*** 共通の親要素を発見 ***');
            console.log('要素:', temp);
            console.log('タグ:', temp.tagName);
            console.log('クラス:', temp.className);
            console.log('子要素数:', temp.children.length);
            
            // この要素の直接の子要素を確認
            const children = Array.from(temp.children);
            console.log('\n直接の子要素:');
            children.slice(0, 5).forEach((child, i) => {
              console.log(`子${i + 1}: ${child.tagName}, クラス: ${child.className}`);
            });
            
            break;
          }
          temp = temp.parentElement;
        }
      }
      
      // 現在のスタイルを確認
      console.log('\n=== 現在のスタイル確認 ===');
      const container = firstLink.closest('.notion-collection') || 
                       firstLink.closest('.notion-table') ||
                       firstLink.closest('[class*="notion"]');
      
      if (container) {
        const computedStyle = window.getComputedStyle(container);
        console.log('コンテナ要素:', container.className);
        console.log('背景色:', computedStyle.backgroundColor);
        console.log('境界線:', computedStyle.border);
        console.log('パディング:', computedStyle.padding);
        console.log('表示形式:', computedStyle.display);
      }
    }
    
    console.log('\n=== 調査完了 ===');
  }, 2000);
})();