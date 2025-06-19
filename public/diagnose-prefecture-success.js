// 都道府県DBが成功する理由を診断する最終スクリプト
(function() {
  console.log('\n🏥 都道府県DB成功の理由を診断中...\n');
  
  const prefectureBlockId = '20fb802cb0c68027945beabe5f521e5a';
  
  // 診断結果を保存
  const diagnosis = {
    prefectureDB: {},
    otherDBs: []
  };
  
  // データベースを詳細に診断する関数
  const diagnoseDatabase = (blockId, blockElement) => {
    const result = {
      blockId,
      name: 'Unknown',
      hasGroups: false,
      groupClass: null,
      groupCount: 0,
      isVisible: false,
      renderTiming: 'unknown',
      specialAttributes: [],
      cssClasses: [],
      parentStructure: []
    };
    
    // recordMapから情報を取得
    if (window.recordMap) {
      const block = window.recordMap.block?.[blockId]?.value;
      const collectionId = block?.collection_id;
      const collection = window.recordMap.collection?.[collectionId]?.value;
      result.name = collection?.name?.[0]?.[0] || 'Unknown';
    }
    
    // DOM構造を分析
    const collectionView = blockElement.querySelector('.notion-collection-view');
    if (collectionView) {
      const listView = collectionView.querySelector('.notion-list-view');
      if (listView) {
        // グループを探す
        const groups1 = listView.querySelectorAll('.notion-collection-group');
        const groups2 = listView.querySelectorAll('.notion-list-view-group');
        
        if (groups1.length > 0) {
          result.hasGroups = true;
          result.groupClass = 'notion-collection-group';
          result.groupCount = groups1.length;
          result.isVisible = Array.from(groups1).some(g => {
            const style = window.getComputedStyle(g);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });
        } else if (groups2.length > 0) {
          result.hasGroups = true;
          result.groupClass = 'notion-list-view-group';
          result.groupCount = groups2.length;
          result.isVisible = Array.from(groups2).some(g => {
            const style = window.getComputedStyle(g);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });
        }
      }
    }
    
    // 特別な属性を確認
    Array.from(blockElement.attributes).forEach(attr => {
      if (attr.name.startsWith('data-') || attr.name === 'style') {
        result.specialAttributes.push(`${attr.name}="${attr.value}"`);
      }
    });
    
    // CSSクラスを記録
    result.cssClasses = Array.from(blockElement.classList);
    
    // 親要素の構造を確認
    let parent = blockElement.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      const parentClasses = Array.from(parent.classList).filter(c => c.includes('notion'));
      if (parentClasses.length > 0) {
        result.parentStructure.push(parentClasses.join('.'));
      }
      parent = parent.parentElement;
      depth++;
    }
    
    // レンダリングタイミングを推測
    const hasInlineStyles = blockElement.querySelector('[style*="display"]');
    const hasDataReactRoot = blockElement.querySelector('[data-reactroot]');
    
    if (hasDataReactRoot) {
      result.renderTiming = 'SSR';
    } else if (hasInlineStyles) {
      result.renderTiming = 'CSR-modified';
    } else {
      result.renderTiming = 'CSR';
    }
    
    return result;
  };
  
  // 1. 都道府県DBを診断
  console.log('=== 都道府県DB (成功) ===');
  const prefectureElement = document.querySelector('.notion-block-' + prefectureBlockId);
  if (prefectureElement) {
    diagnosis.prefectureDB = diagnoseDatabase(prefectureBlockId, prefectureElement);
    console.log(diagnosis.prefectureDB);
  }
  
  // 2. 他のグループ化されたDBを診断
  console.log('\n=== 他のグループ化されたDB (失敗) ===');
  document.querySelectorAll('[class*="notion-block-"]').forEach(blockElement => {
    const blockId = Array.from(blockElement.classList)
      .find(c => c.startsWith('notion-block-'))
      ?.replace('notion-block-', '');
    
    if (blockId && blockId !== prefectureBlockId) {
      // グループ化されたリストビューか確認
      const hasListView = blockElement.querySelector('.notion-list-view');
      const mightHaveGroups = blockElement.querySelector('[class*="group"]');
      
      if (hasListView && mightHaveGroups) {
        const result = diagnoseDatabase(blockId, blockElement);
        if (result.name !== 'Unknown') {
          diagnosis.otherDBs.push(result);
          console.log(`\n${result.name}:`);
          console.log(result);
        }
      }
    }
  });
  
  // 3. 違いを分析
  console.log('\n\n=== 診断結果の分析 ===');
  
  const differences = [];
  
  // グループクラスの違い
  const prefGroupClass = diagnosis.prefectureDB.groupClass;
  const otherGroupClasses = [...new Set(diagnosis.otherDBs.map(db => db.groupClass))];
  
  if (prefGroupClass && otherGroupClasses.length > 0) {
    if (!otherGroupClasses.includes(prefGroupClass)) {
      differences.push(`グループクラス: 都道府県="${prefGroupClass}", 他="${otherGroupClasses.join(', ')}"`);
    }
  }
  
  // 表示状態の違い
  if (diagnosis.prefectureDB.isVisible) {
    const invisibleDBs = diagnosis.otherDBs.filter(db => !db.isVisible);
    if (invisibleDBs.length > 0) {
      differences.push(`表示状態: 都道府県=表示, ${invisibleDBs.map(db => db.name).join(', ')}=非表示`);
    }
  }
  
  // レンダリングタイミングの違い
  const prefTiming = diagnosis.prefectureDB.renderTiming;
  const otherTimings = [...new Set(diagnosis.otherDBs.map(db => db.renderTiming))];
  
  if (otherTimings.length > 0 && !otherTimings.includes(prefTiming)) {
    differences.push(`レンダリング: 都道府県="${prefTiming}", 他="${otherTimings.join(', ')}"`);
  }
  
  // 親構造の違い
  const prefParentDepth = diagnosis.prefectureDB.parentStructure.length;
  const otherParentDepths = diagnosis.otherDBs.map(db => db.parentStructure.length);
  const avgOtherDepth = otherParentDepths.length > 0 
    ? otherParentDepths.reduce((a, b) => a + b, 0) / otherParentDepths.length 
    : 0;
  
  if (Math.abs(prefParentDepth - avgOtherDepth) > 1) {
    differences.push(`DOM階層: 都道府県=${prefParentDepth}層, 他平均=${avgOtherDepth.toFixed(1)}層`);
  }
  
  console.log('\n発見された主な違い:');
  differences.forEach((diff, i) => {
    console.log(`${i + 1}. ${diff}`);
  });
  
  // 4. 解決策の提案
  console.log('\n\n=== 推奨される解決策 ===');
  
  if (diagnosis.prefectureDB.groupClass !== diagnosis.otherDBs[0]?.groupClass) {
    console.log('1. CSSセレクタを両方のグループクラスに対応させる');
    console.log(`   - ${diagnosis.prefectureDB.groupClass}`);
    console.log(`   - ${[...new Set(diagnosis.otherDBs.map(db => db.groupClass))].join(', ')}`);
  }
  
  if (diagnosis.prefectureDB.isVisible && diagnosis.otherDBs.some(db => !db.isVisible)) {
    console.log('2. 非表示のグループを強制的に表示する');
    console.log('   - display: block !important');
    console.log('   - visibility: visible !important');
    console.log('   - opacity: 1 !important');
  }
  
  if (diagnosis.prefectureDB.renderTiming !== diagnosis.otherDBs[0]?.renderTiming) {
    console.log('3. レンダリング後の動的な修正が必要');
    console.log('   - MutationObserverで変更を監視');
    console.log('   - 複数回の修正試行');
  }
  
  // グローバル変数に診断結果を保存
  window.databaseDiagnosis = diagnosis;
  console.log('\n診断結果は window.databaseDiagnosis に保存されました');
  
  return diagnosis;
})();