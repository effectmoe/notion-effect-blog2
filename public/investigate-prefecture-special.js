// 都道府県データベースがなぜ正しく表示されるのかを詳細に調査
(function() {
  console.log('\n🔍 都道府県データベースの特別な要素を調査...\n');
  
  // 都道府県DBのブロックID
  const prefectureBlockId = '20fb802cb0c68027945beabe5f521e5a';
  
  // 1. DOM構造の詳細分析
  console.log('=== 1. DOM構造の分析 ===');
  const prefectureBlock = document.querySelector('.notion-block-' + prefectureBlockId);
  
  if (prefectureBlock) {
    console.log('都道府県DBブロックを発見');
    
    // クラス名を全て確認
    console.log('クラス名:', Array.from(prefectureBlock.classList));
    
    // 子要素の構造を調査
    const analyzeStructure = (element, level = 0) => {
      const indent = '  '.repeat(level);
      const tagName = element.tagName?.toLowerCase() || 'text';
      const classList = element.classList ? Array.from(element.classList) : [];
      
      if (classList.some(c => c.includes('group') || c.includes('list'))) {
        console.log(`${indent}${tagName}.${classList.join('.')}`);
        
        // グループ関連の要素の詳細
        if (classList.some(c => c.includes('group'))) {
          const style = window.getComputedStyle(element);
          console.log(`${indent}  display: ${style.display}, visibility: ${style.visibility}, opacity: ${style.opacity}`);
          
          // テキストコンテンツ（グループタイトル）
          if (element.textContent && element.textContent.length < 50) {
            console.log(`${indent}  content: "${element.textContent.trim()}"`);
          }
        }
      }
      
      // 子要素を再帰的に調査
      Array.from(element.children).forEach(child => {
        analyzeStructure(child, level + 1);
      });
    };
    
    console.log('\nDOM階層:');
    analyzeStructure(prefectureBlock);
  }
  
  // 2. recordMapの構造を確認
  console.log('\n\n=== 2. recordMapデータの分析 ===');
  if (window.recordMap) {
    const blocks = window.recordMap.block || {};
    const prefBlock = blocks[prefectureBlockId]?.value;
    
    if (prefBlock) {
      console.log('Block type:', prefBlock.type);
      console.log('Collection ID:', prefBlock.collection_id);
      console.log('View IDs:', prefBlock.view_ids);
      
      // ビューの詳細を確認
      if (prefBlock.view_ids && prefBlock.view_ids[0]) {
        const viewId = prefBlock.view_ids[0];
        const view = window.recordMap.collection_view?.[viewId]?.value;
        
        if (view) {
          console.log('\nView詳細:');
          console.log('  Type:', view.type);
          console.log('  Name:', view.name);
          
          // group_byの設定を詳細に確認
          if (view.query2?.group_by) {
            console.log('  Group by設定:');
            console.log(JSON.stringify(view.query2.group_by, null, 2));
          }
          
          // formatの設定を確認
          if (view.format) {
            console.log('  Format設定:');
            Object.keys(view.format).forEach(key => {
              if (key.includes('group') || key === 'collection_groups') {
                console.log(`    ${key}:`, view.format[key]);
              }
            });
          }
        }
      }
    }
  }
  
  // 3. 適用されているCSSを確認
  console.log('\n\n=== 3. 適用されているCSS ===');
  const checkCSS = (selector) => {
    const elements = prefectureBlock.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`${selector}: ${elements.length}個見つかりました`);
      const style = window.getComputedStyle(elements[0]);
      console.log(`  display: ${style.display}, visibility: ${style.visibility}`);
    }
  };
  
  checkCSS('.notion-collection-group');
  checkCSS('.notion-list-view-group');
  checkCSS('.notion-collection-group-title');
  checkCSS('.notion-list-view-group-header');
  
  // 4. 他のデータベースとの比較
  console.log('\n\n=== 4. 他のDBとの比較 ===');
  const allCollectionViews = document.querySelectorAll('.notion-collection-view');
  
  allCollectionViews.forEach((collectionView, index) => {
    const blockId = Array.from(collectionView.parentElement?.classList || [])
      .find(c => c.startsWith('notion-block-'))
      ?.replace('notion-block-', '');
    
    if (blockId && blockId !== prefectureBlockId) {
      const hasGroups = collectionView.querySelector('.notion-collection-group, .notion-list-view-group');
      const isListView = collectionView.querySelector('.notion-list-view');
      
      if (hasGroups && isListView) {
        console.log(`\n他のグループ化されたDB (${blockId}):`);
        
        // このDBがなぜ表示されないかを調査
        const groups = collectionView.querySelectorAll('.notion-collection-group, .notion-list-view-group');
        console.log(`  グループ数: ${groups.length}`);
        
        if (groups.length > 0) {
          const firstGroup = groups[0];
          const style = window.getComputedStyle(firstGroup);
          console.log(`  最初のグループのスタイル:`);
          console.log(`    display: ${style.display}`);
          console.log(`    visibility: ${style.visibility}`);
          console.log(`    opacity: ${style.opacity}`);
          console.log(`    position: ${style.position}`);
          console.log(`    height: ${style.height}`);
        }
      }
    }
  });
  
  // 5. 実行されているスクリプトを確認
  console.log('\n\n=== 5. 読み込まれているスクリプト ===');
  const scripts = Array.from(document.scripts);
  const relevantScripts = scripts.filter(s => 
    s.src && (
      s.src.includes('prefecture') || 
      s.src.includes('group') || 
      s.src.includes('list') ||
      s.src.includes('fix')
    )
  );
  
  relevantScripts.forEach(script => {
    console.log('Script:', script.src.split('/').pop());
  });
  
  // 6. 結論
  console.log('\n\n=== 結論 ===');
  console.log('都道府県DBが正しく表示される理由を特定するため、');
  console.log('上記の情報を基に他のDBとの違いを分析してください。');
  
  return '調査完了';
})();