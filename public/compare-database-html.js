// 都道府県DB（動作する）と他のDB（動作しない）のHTML構造を直接比較
(function() {
  console.log('\n📊 データベースのHTML構造を比較...\n');
  
  // 都道府県DBのブロックID
  const prefectureBlockId = '20fb802cb0c68027945beabe5f521e5a';
  
  // 1. 都道府県DBのHTML構造を取得
  const prefectureBlock = document.querySelector('.notion-block-' + prefectureBlockId);
  
  if (!prefectureBlock) {
    console.log('❌ 都道府県DBが見つかりません');
    return;
  }
  
  console.log('=== 都道府県DB（動作する）のHTML構造 ===');
  
  // グループ化されたリストビューの構造を詳細に出力
  const analyzeGroupStructure = (container, dbName) => {
    console.log(`\n${dbName}:`);
    
    // コレクションビューを探す
    const collectionView = container.querySelector('.notion-collection-view');
    if (!collectionView) {
      console.log('  ❌ collection-viewが見つかりません');
      return;
    }
    
    // リストビューを探す
    const listView = collectionView.querySelector('.notion-list-view');
    if (!listView) {
      console.log('  ❌ list-viewが見つかりません');
      return;
    }
    
    console.log('  ✅ list-viewが見つかりました');
    
    // グループを探す（両方のパターンを確認）
    const groups1 = listView.querySelectorAll('.notion-collection-group');
    const groups2 = listView.querySelectorAll('.notion-list-view-group');
    
    console.log(`  notion-collection-group: ${groups1.length}個`);
    console.log(`  notion-list-view-group: ${groups2.length}個`);
    
    // 実際に使われているグループ要素
    const groups = groups1.length > 0 ? groups1 : groups2;
    const groupClassName = groups1.length > 0 ? 'notion-collection-group' : 'notion-list-view-group';
    
    if (groups.length > 0) {
      console.log(`\n  使用されているグループクラス: ${groupClassName}`);
      
      // 最初のグループの詳細構造
      const firstGroup = groups[0];
      console.log('\n  最初のグループの構造:');
      
      // HTML構造を簡略化して表示
      const showStructure = (element, indent = '    ') => {
        const tag = element.tagName.toLowerCase();
        const classes = Array.from(element.classList).filter(c => 
          c.includes('notion') && (c.includes('group') || c.includes('list') || c.includes('title') || c.includes('header'))
        ).join('.');
        
        if (classes) {
          console.log(`${indent}<${tag} class="${classes}">`);
          
          // 重要な子要素のみ表示
          const importantChildren = Array.from(element.children).filter(child => {
            const childClasses = Array.from(child.classList);
            return childClasses.some(c => 
              c.includes('group') || c.includes('list') || c.includes('title') || c.includes('header') || c.includes('item')
            );
          });
          
          importantChildren.forEach(child => {
            showStructure(child, indent + '  ');
          });
        }
      };
      
      showStructure(firstGroup);
      
      // スタイル情報
      console.log('\n  最初のグループのスタイル:');
      const style = window.getComputedStyle(firstGroup);
      console.log(`    display: ${style.display}`);
      console.log(`    visibility: ${style.visibility}`);
      console.log(`    opacity: ${style.opacity}`);
      console.log(`    height: ${style.height}`);
      console.log(`    overflow: ${style.overflow}`);
    }
  };
  
  // 都道府県DBを分析
  analyzeGroupStructure(prefectureBlock, '都道府県DB');
  
  // 2. 他のグループ化されたDBと比較
  console.log('\n\n=== 他のグループ化されたDB（動作しない）===');
  
  // recordMapから他のグループ化されたDBを探す
  if (window.recordMap) {
    const blocks = window.recordMap.block || {};
    const collectionViews = window.recordMap.collection_view || {};
    
    let foundOtherDB = false;
    
    Object.entries(blocks).forEach(([blockId, blockData]) => {
      if (blockId === prefectureBlockId) return; // 都道府県DBはスキップ
      
      const block = blockData?.value;
      if (block?.type === 'collection_view' && block.view_ids?.length > 0) {
        // ビューがグループ化されているか確認
        const viewId = block.view_ids[0];
        const view = collectionViews[viewId]?.value;
        
        if (view?.query2?.group_by) {
          const blockElement = document.querySelector('.notion-block-' + blockId);
          if (blockElement) {
            foundOtherDB = true;
            
            // コレクション名を取得
            const collectionId = block.collection_id;
            const collection = window.recordMap.collection?.[collectionId]?.value;
            const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
            
            analyzeGroupStructure(blockElement, `${collectionName} (${blockId.substr(0, 8)}...)`);
          }
        }
      }
    });
    
    if (!foundOtherDB) {
      console.log('他のグループ化されたDBが見つかりませんでした');
    }
  }
  
  // 3. 結論と推奨事項
  console.log('\n\n=== 分析結果 ===');
  console.log('上記の構造の違いから、都道府県DBが正しく表示される理由を特定できます。');
  console.log('特に注目すべき点:');
  console.log('- 使用されているグループクラス名の違い');
  console.log('- HTML階層構造の違い');
  console.log('- 適用されているスタイルの違い');
  
  return '比較完了';
})();