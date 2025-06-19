// カフェキネシラバーズのデバッグスクリプト
(function() {
  console.log('\n🔍 カフェキネシラバーズのリストビューを分析...\n');
  
  // すべてのcollectionを取得
  const collections = document.querySelectorAll('.notion-collection');
  
  // カフェキネシラバーズを含むコレクションを探す
  let cafeKinesiCollection = null;
  collections.forEach(col => {
    // コレクション内のテキストをチェック
    if (col.textContent.includes('カフェキネシラバーズ')) {
      cafeKinesiCollection = col;
    }
  });
  
  if (!cafeKinesiCollection) {
    console.log('❌ カフェキネシラバーズのコレクションが見つかりません');
    return;
  }
  
  console.log('✅ カフェキネシラバーズのコレクションを発見');
  console.log('Block ID:', cafeKinesiCollection.className.match(/notion-block-(\w+)/)?.[1]);
  
  // リストビューを確認
  const listView = cafeKinesiCollection.querySelector('.notion-list-view');
  if (!listView) {
    console.log('❌ リストビューが見つかりません');
    return;
  }
  
  // グループを分析
  const groups = cafeKinesiCollection.querySelectorAll('.notion-collection-group');
  console.log(`\n📁 グループ数: ${groups.length}`);
  
  groups.forEach((group, index) => {
    const title = group.querySelector('.notion-collection-group-title');
    const groupName = title?.textContent?.trim() || '不明';
    
    // グループ内のアイテムを数える
    const items = group.querySelectorAll('.notion-list-item');
    const links = group.querySelectorAll('a');
    
    console.log(`\nグループ ${index + 1}: ${groupName}`);
    console.log(`  リストアイテム数: ${items.length}`);
    console.log(`  リンク数: ${links.length}`);
    
    // 表示状態を確認
    const groupStyle = window.getComputedStyle(group);
    console.log(`  表示状態: display=${groupStyle.display}, visibility=${groupStyle.visibility}`);
    
    // 子要素の構造を確認
    if (items.length === 0 && group.children.length > 1) {
      console.log('  ⚠️ リストアイテムがないが、子要素があります:');
      Array.from(group.children).forEach((child, i) => {
        if (i > 0) { // タイトル以外
          console.log(`    - ${child.className || child.tagName}`);
        }
      });
    }
  });
  
  // FAQマスターとの比較
  console.log('\n\n📊 FAQマスターとの比較...');
  let faqCollection = null;
  collections.forEach(col => {
    if (col.textContent.includes('FAQマスター') || col.textContent.includes('FAQ')) {
      faqCollection = col;
    }
  });
  
  if (faqCollection) {
    console.log('✅ FAQのコレクションを発見');
    const faqGroups = faqCollection.querySelectorAll('.notion-collection-group');
    console.log(`FAQのグループ数: ${faqGroups.length}`);
    
    if (faqGroups.length > 0) {
      const faqItems = faqGroups[0].querySelectorAll('.notion-list-item');
      console.log(`FAQの最初のグループのアイテム数: ${faqItems.length}`);
    }
  }
  
  return 'デバッグ完了';
})();