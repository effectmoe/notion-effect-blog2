// 都道府県DBが特別なレンダリングパスを持っているか確認
(function() {
  console.log('\n🔎 都道府県DBのレンダリング方法を調査...\n');
  
  const prefectureBlockId = '20fb802cb0c68027945beabe5f521e5a';
  
  // 1. React Fiberノードを確認（React内部構造）
  console.log('=== 1. React内部構造の確認 ===');
  const prefectureBlock = document.querySelector('.notion-block-' + prefectureBlockId);
  
  if (prefectureBlock) {
    // React Fiberノードを取得する試み
    const reactInternalKey = Object.keys(prefectureBlock).find(key => 
      key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
    );
    
    if (reactInternalKey) {
      console.log('✅ Reactコンポーネントとして管理されています');
      const fiber = prefectureBlock[reactInternalKey];
      console.log('Component type:', fiber?.elementType?.name || fiber?.type?.name || 'Unknown');
    } else {
      console.log('❌ Reactコンポーネントではない可能性があります');
    }
  }
  
  // 2. 初期HTMLとしてレンダリングされているか確認
  console.log('\n=== 2. 初期HTMLレンダリングの確認 ===');
  
  // データ属性を確認
  const checkDataAttributes = (element) => {
    const attrs = element.attributes;
    const dataAttrs = [];
    
    for (let i = 0; i < attrs.length; i++) {
      if (attrs[i].name.startsWith('data-')) {
        dataAttrs.push(`${attrs[i].name}="${attrs[i].value}"`);
      }
    }
    
    return dataAttrs;
  };
  
  const prefectureDataAttrs = checkDataAttributes(prefectureBlock);
  console.log('都道府県DBのdata属性:', prefectureDataAttrs);
  
  // 3. 他のDBと比較
  console.log('\n=== 3. 他のDBとのレンダリング方法の比較 ===');
  
  const allCollectionViews = document.querySelectorAll('.notion-collection-view');
  let foundDifference = false;
  
  allCollectionViews.forEach(view => {
    const blockElement = view.closest('[class*="notion-block-"]');
    if (!blockElement) return;
    
    const blockId = Array.from(blockElement.classList)
      .find(c => c.startsWith('notion-block-'))
      ?.replace('notion-block-', '');
    
    if (blockId && blockId !== prefectureBlockId) {
      // グループ化されたリストビューか確認
      const hasGroups = view.querySelector('.notion-collection-group, .notion-list-view-group');
      const isListView = view.querySelector('.notion-list-view');
      
      if (hasGroups && isListView) {
        const otherDataAttrs = checkDataAttributes(blockElement);
        
        if (otherDataAttrs.length !== prefectureDataAttrs.length) {
          foundDifference = true;
          console.log(`\n他のDB (${blockId}):`);
          console.log('  data属性:', otherDataAttrs);
          console.log('  違い: data属性の数が異なります');
        }
      }
    }
  });
  
  if (!foundDifference) {
    console.log('data属性に大きな違いは見つかりませんでした');
  }
  
  // 4. SSR/CSRの判定
  console.log('\n=== 4. SSR vs CSR の判定 ===');
  
  // グループ要素のテキストコンテンツを確認
  const checkGroupRendering = (container) => {
    const groups = container.querySelectorAll('.notion-collection-group, .notion-list-view-group');
    
    if (groups.length > 0) {
      const firstGroup = groups[0];
      const groupTitle = firstGroup.querySelector('.notion-collection-group-title, .notion-list-view-group-header');
      
      if (groupTitle) {
        // innerHTMLとtextContentを比較
        const hasComplexHTML = groupTitle.innerHTML !== groupTitle.textContent;
        const hasNestedElements = groupTitle.children.length > 0;
        
        return {
          hasContent: true,
          hasComplexHTML,
          hasNestedElements,
          titleText: groupTitle.textContent.trim()
        };
      }
    }
    
    return { hasContent: false };
  };
  
  const prefectureRendering = checkGroupRendering(prefectureBlock);
  console.log('都道府県DBのグループレンダリング:', prefectureRendering);
  
  // 5. スクリプトによる後処理の痕跡
  console.log('\n=== 5. スクリプトによる後処理の確認 ===');
  
  // インラインスタイルの存在を確認
  const checkInlineStyles = (container) => {
    const elementsWithStyle = container.querySelectorAll('[style]');
    const stylePatterns = new Set();
    
    elementsWithStyle.forEach(el => {
      const style = el.getAttribute('style');
      if (style && (style.includes('display') || style.includes('visibility'))) {
        stylePatterns.add(style);
      }
    });
    
    return Array.from(stylePatterns);
  };
  
  const prefectureStyles = checkInlineStyles(prefectureBlock);
  console.log('都道府県DBのインラインスタイル数:', prefectureStyles.length);
  if (prefectureStyles.length > 0) {
    console.log('サンプル:', prefectureStyles.slice(0, 3));
  }
  
  // 6. 特別な処理の痕跡
  console.log('\n=== 6. 特別な処理の痕跡 ===');
  
  // カスタムイベントリスナーの確認
  const checkEventListeners = () => {
    // グローバルに登録されたイベントを確認
    if (window.notionEventListeners) {
      console.log('カスタムNotionイベントリスナーが見つかりました');
    }
    
    // MutationObserverの存在を確認
    if (window.notionObservers) {
      console.log('カスタムMutationObserverが見つかりました');
    }
  };
  
  checkEventListeners();
  
  // 7. 結論
  console.log('\n\n=== 調査結果のまとめ ===');
  console.log('1. 都道府県DBが正しく表示される理由として考えられること:');
  console.log('   - 初期レンダリング時に正しい構造で生成されている');
  console.log('   - 特定のスクリプトによる後処理を受けている');
  console.log('   - CSSによる表示制御が正しく適用されている');
  console.log('2. 他のDBとの違いを基に修正方法を検討する必要があります');
  
  return '調査完了';
})();