// Notionテーブルの実際のDOM構造を詳細に調査
(function() {
  console.log('=== テーブルDOM構造調査開始 ===');
  
  // 待機してからDOM調査を実行
  setTimeout(() => {
    // 1. すべてのテーブル要素を探す
    const tables = document.querySelectorAll('table');
    console.log(`見つかったテーブル数: ${tables.length}`);
    
    if (tables.length > 0) {
      tables.forEach((table, index) => {
        console.log(`\n--- テーブル ${index + 1} ---`);
        console.log('要素:', table);
        console.log('クラス名:', table.className || 'クラスなし');
        
        // 親要素のクラスを確認
        let parent = table.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
          console.log(`親要素(深さ${depth + 1}):`, parent.className || 'クラスなし');
          parent = parent.parentElement;
          depth++;
        }
        
        // テーブルの最初の行を確認
        const firstRow = table.querySelector('tr');
        if (firstRow) {
          console.log('最初の行:', firstRow.innerHTML.substring(0, 200) + '...');
        }
      });
    }
    
    // 2. Notion関連のクラスを持つ要素を探す
    const notionSelectors = [
      '.notion-table',
      '.notion-collection',
      '.notion-collection-view',
      '.notion-collection-view-body',
      '[class*="notion"][class*="table"]',
      '[class*="notion"][class*="collection"]'
    ];
    
    console.log('\n=== Notion関連要素の検索 ===');
    notionSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`${selector}: ${elements.length}個見つかりました`);
        elements.forEach((el, i) => {
          if (i < 3) { // 最初の3つだけ表示
            console.log(`  要素${i + 1}: ${el.tagName}, クラス: ${el.className}`);
          }
        });
      }
    });
    
    // 3. 都道府県リンクを含む要素を探す
    console.log('\n=== 都道府県リンクの検索 ===');
    const prefectureLinks = document.querySelectorAll('a[href*="category"]');
    console.log(`都道府県リンク数: ${prefectureLinks.length}`);
    
    if (prefectureLinks.length > 0) {
      // 最初のリンクの構造を詳しく調査
      const firstLink = prefectureLinks[0];
      console.log('最初のリンク:', firstLink.href);
      console.log('リンクテキスト:', firstLink.textContent);
      
      // リンクを含むテーブルを探す
      let tableParent = firstLink.closest('table');
      if (tableParent) {
        console.log('リンクを含むテーブルが見つかりました');
        console.log('テーブルのクラス:', tableParent.className || 'クラスなし');
      } else {
        console.log('リンクを含むテーブルが見つかりません');
        
        // 親要素を辿って構造を確認
        let current = firstLink;
        for (let i = 0; i < 10; i++) {
          current = current.parentElement;
          if (!current) break;
          console.log(`親要素${i + 1}: ${current.tagName}, クラス: ${current.className || 'なし'}`);
          if (current.tagName === 'TABLE') {
            console.log('テーブル要素が見つかりました！');
            break;
          }
        }
      }
    }
    
    // 4. 現在適用されているスタイルを確認
    console.log('\n=== スタイル適用状況 ===');
    const styleSheets = Array.from(document.styleSheets);
    const tableStyles = [];
    
    styleSheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        rules.forEach(rule => {
          if (rule.selectorText && rule.selectorText.includes('table')) {
            tableStyles.push({
              selector: rule.selectorText,
              styles: rule.style.cssText
            });
          }
        });
      } catch (e) {
        // クロスオリジンのスタイルシートはアクセスできない
      }
    });
    
    console.log('テーブル関連のCSSルール数:', tableStyles.length);
    tableStyles.slice(0, 5).forEach(style => {
      console.log(`セレクタ: ${style.selector}`);
      console.log(`スタイル: ${style.styles.substring(0, 100)}...`);
    });
    
    console.log('\n=== 調査完了 ===');
  }, 2000); // ページ読み込み後2秒待機
})();