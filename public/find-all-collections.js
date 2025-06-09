// すべてのコレクションビューを詳しく調査
(function() {
  console.log('=== すべてのコレクションビューを調査 ===');
  
  setTimeout(() => {
    // 1. すべてのNotionコレクションを探す
    const collections = document.querySelectorAll('.notion-collection');
    console.log(`Notionコレクション数: ${collections.length}`);
    
    collections.forEach((collection, index) => {
      console.log(`\n--- コレクション ${index + 1} ---`);
      console.log('クラス:', collection.className);
      
      // タイトルを探す
      const title = collection.querySelector('.notion-collection-header-title');
      if (title) {
        console.log('タイトル:', title.textContent);
      }
      
      // ビューのタイプを確認
      const tableView = collection.querySelector('.notion-table-view');
      const listView = collection.querySelector('.notion-list-view');
      const galleryView = collection.querySelector('.notion-gallery-view');
      const boardView = collection.querySelector('.notion-board-view');
      
      console.log('ビュータイプ:');
      if (tableView) console.log('  - テーブルビュー');
      if (listView) console.log('  - リストビュー');
      if (galleryView) console.log('  - ギャラリービュー');
      if (boardView) console.log('  - ボードビュー');
      
      // 最初の数個のアイテムの内容を確認
      const items = collection.querySelectorAll('.notion-table-row, .notion-list-item, .notion-gallery-card, .notion-board-item');
      console.log(`アイテム数: ${items.length}`);
      
      if (items.length > 0) {
        console.log('最初の3つのアイテム:');
        Array.from(items).slice(0, 3).forEach((item, i) => {
          const text = item.textContent.trim().substring(0, 100);
          console.log(`  ${i + 1}: ${text}...`);
          
          // リンクを探す
          const links = item.querySelectorAll('a');
          if (links.length > 0) {
            console.log(`    リンク: ${links[0].href}`);
          }
        });
      }
      
      // テーブルビューの場合、セルの内容を確認
      if (tableView) {
        const firstRow = tableView.querySelector('.notion-table-row');
        if (firstRow) {
          const cells = firstRow.querySelectorAll('.notion-table-cell');
          console.log('最初の行のセル数:', cells.length);
          cells.forEach((cell, i) => {
            console.log(`  セル${i + 1}: ${cell.textContent.substring(0, 50)}...`);
          });
        }
      }
    });
    
    // 2. categoryを含むリンクを探す
    console.log('\n=== カテゴリーリンクの検索 ===');
    const categoryLinks = document.querySelectorAll('a[href*="category"]');
    console.log(`カテゴリーリンク数: ${categoryLinks.length}`);
    
    if (categoryLinks.length > 0) {
      console.log('最初の5つのカテゴリーリンク:');
      Array.from(categoryLinks).slice(0, 5).forEach((link, i) => {
        console.log(`${i + 1}. ${link.textContent} -> ${link.href}`);
        
        // 親要素の構造を確認
        let parent = link.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
          if (parent.className.includes('notion-')) {
            console.log(`  親(深さ${depth + 1}): ${parent.className}`);
          }
          parent = parent.parentElement;
          depth++;
        }
      });
    }
    
    // 3. 日本語の都道府県名を含むテキストを探す
    console.log('\n=== 都道府県名を含むテキスト要素 ===');
    const prefectures = ['北海道', '東京都', '大阪府', '京都府', '沖縄県'];
    const allElements = document.querySelectorAll('*');
    const foundElements = [];
    
    allElements.forEach(el => {
      if (el.children.length === 0 && el.textContent) {
        const text = el.textContent.trim();
        if (prefectures.some(pref => text.includes(pref))) {
          foundElements.push(el);
        }
      }
    });
    
    console.log(`都道府県名を含む要素数: ${foundElements.length}`);
    if (foundElements.length > 0) {
      console.log('最初の3つ:');
      foundElements.slice(0, 3).forEach((el, i) => {
        console.log(`${i + 1}. ${el.textContent}`);
        console.log(`   タグ: ${el.tagName}, クラス: ${el.className || 'なし'}`);
        if (el.parentElement) {
          console.log(`   親: ${el.parentElement.className || 'なし'}`);
        }
      });
    }
    
    console.log('\n=== 調査完了 ===');
  }, 2000);
})();