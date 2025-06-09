// Notionテーブルの構造を調査するスクリプト
(function() {
  console.log('=== Notionテーブル構造調査開始 ===');
  
  // すべてのテーブルを探す
  const tables = document.querySelectorAll('table');
  console.log(`見つかったテーブル数: ${tables.length}`);
  
  tables.forEach((table, index) => {
    console.log(`\nテーブル ${index + 1}:`);
    console.log('クラス名:', table.className);
    console.log('親要素のクラス:', table.parentElement?.className);
    console.log('祖父母要素のクラス:', table.parentElement?.parentElement?.className);
    
    // Notionテーブル関連のクラスを持つ要素を探す
    const notionTable = table.closest('.notion-table');
    const notionCollection = table.closest('.notion-collection');
    const notionView = table.closest('.notion-collection-view');
    
    console.log('notion-table クラスを持つ親要素:', notionTable ? 'あり' : 'なし');
    console.log('notion-collection クラスを持つ親要素:', notionCollection ? 'あり' : 'なし');
    console.log('notion-collection-view クラスを持つ親要素:', notionView ? 'あり' : 'なし');
    
    if (notionView) {
      console.log('notion-collection-view のクラス:', notionView.className);
    }
  });
  
  // Notion関連のクラスを持つすべての要素を調査
  const notionElements = document.querySelectorAll('[class*="notion"]');
  const uniqueClasses = new Set();
  
  notionElements.forEach(el => {
    if (el.className && typeof el.className === 'string') {
      el.className.split(' ').forEach(cls => {
        if (cls.includes('notion')) {
          uniqueClasses.add(cls);
        }
      });
    }
  });
  
  console.log('\n=== Notion関連のユニークなクラス名 ===');
  Array.from(uniqueClasses).sort().forEach(cls => console.log(cls));
  
  console.log('\n=== 調査完了 ===');
})();