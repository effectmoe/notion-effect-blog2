// 直接実行可能なグループ化リストビュー分析スクリプト
(function analyzeGroupedListViews() {
  console.log('\n📊 グループ化リストビューの分析...\n');
  
  // すべてのコレクションビューを探す
  const collectionViews = document.querySelectorAll('.notion-collection-view');
  console.log(`見つかったコレクションビュー数: ${collectionViews.length}`);
  
  collectionViews.forEach((view, index) => {
    console.log(`\n=== コレクションビュー ${index + 1} ===`);
    
    // タイトルを取得
    const collection = view.closest('.notion-collection');
    const titleElement = collection?.querySelector('.notion-collection-header-title');
    const title = titleElement?.textContent || '不明';
    console.log(`📌 タイトル: ${title}`);
    
    // リストビューかチェック
    const listView = view.querySelector('.notion-list-view');
    if (!listView) {
      console.log('❌ リストビューではありません');
      return;
    }
    
    // グループの分析
    const groups = listView.querySelectorAll('.notion-list-view-group');
    console.log(`✅ リストビュー - グループ数: ${groups.length}`);
    
    if (groups.length > 0) {
      groups.forEach((group, gIndex) => {
        const groupHeader = group.querySelector('.notion-list-view-group-header');
        const groupTitle = groupHeader?.textContent?.trim() || 'タイトルなし';
        const groupItems = group.querySelectorAll('.notion-list-item');
        
        console.log(`\n  📁 グループ ${gIndex + 1}: "${groupTitle}"`);
        console.log(`     アイテム数: ${groupItems.length}`);
        
        // スタイルの確認
        const computedStyle = window.getComputedStyle(group);
        console.log(`     display: ${computedStyle.display}`);
        console.log(`     visibility: ${computedStyle.visibility}`);
        console.log(`     opacity: ${computedStyle.opacity}`);
        
        // 非表示の場合は赤で警告
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
          console.log(`     ⚠️ このグループは非表示です！`);
        }
      });
    } else {
      // グループがない場合、隠れている可能性をチェック
      const hiddenElements = listView.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
      if (hiddenElements.length > 0) {
        console.log(`⚠️ ${hiddenElements.length}個の非表示要素が見つかりました`);
      }
    }
    
    // ビューのタイプを確認
    const viewTabs = collection?.querySelectorAll('.notion-collection-view-tabs-content-item');
    if (viewTabs && viewTabs.length > 0) {
      const activeTab = collection.querySelector('.notion-collection-view-tabs-content-item-active');
      console.log(`\n📊 ビュータイプ: ${activeTab?.textContent || '不明'}`);
    }
  });
  
  // 特定のデータベースをチェック
  console.log('\n\n=== 特定のデータベースの確認 ===');
  const pageText = document.body.textContent;
  console.log(`"カフェキネシラバーズ"を含む: ${pageText.includes('カフェキネシラバーズ')}`);
  console.log(`"FAQマスター"を含む: ${pageText.includes('FAQマスター')}`);
  
  return '分析完了';
})();