// データベース表示のデバッグスクリプト
// このスクリプトをブラウザのコンソールで実行してください

(function debugDatabase() {
  console.log('=== Database Debug Info ===');
  
  // グローバル変数の確認
  if (window.recordMap) {
    console.log('RecordMap found:', window.recordMap);
    
    // Collection viewsを探す
    const collectionViews = Object.entries(window.recordMap.block || {})
      .filter(([_, b]) => b.value?.type === 'collection_view' || b.value?.type === 'collection_view_page')
      .map(([id, b]) => ({
        id,
        type: b.value.type,
        collection_id: b.value.collection_id,
        view_ids: b.value.view_ids,
        format: b.value.format,
        properties: b.value.properties
      }));
    
    console.log('Collection Views found:', collectionViews.length);
    console.log('Collection Views details:', collectionViews);
    
    // Collectionsの確認
    if (window.recordMap.collection) {
      console.log('Collections:', Object.keys(window.recordMap.collection).length);
      console.log('Collection IDs:', Object.keys(window.recordMap.collection));
    } else {
      console.error('No collections found in recordMap!');
    }
    
    // Collection query resultsの確認
    if (window.recordMap.collection_query) {
      console.log('Collection query results:', Object.keys(window.recordMap.collection_query).length);
      Object.entries(window.recordMap.collection_query).forEach(([key, value]) => {
        console.log(`Query ${key}:`, value);
      });
    } else {
      console.error('No collection_query found in recordMap!');
    }
    
    // Collection viewsの確認
    if (window.recordMap.collection_view) {
      console.log('Collection views config:', Object.keys(window.recordMap.collection_view).length);
    } else {
      console.error('No collection_view found in recordMap!');
    }
    
  } else {
    console.error('window.recordMap not found!');
  }
  
  // React Notion Xコンポーネントの確認
  const collectionElements = document.querySelectorAll('[data-block-id]');
  console.log('Elements with data-block-id:', collectionElements.length);
  
  const collectionViewElements = document.querySelectorAll('.notion-collection-view');
  console.log('Collection view elements:', collectionViewElements.length);
  
  // エラーメッセージの確認
  const errorElements = document.querySelectorAll('.notion-error');
  if (errorElements.length > 0) {
    console.error('Error elements found:', errorElements);
  }
  
  // データベース読み込み中の要素を確認
  const loadingElements = document.querySelectorAll('div:has(> p:contains("Loading database view"))');
  console.log('Loading elements:', loadingElements.length);
  
  console.log('=== End Database Debug Info ===');
})();