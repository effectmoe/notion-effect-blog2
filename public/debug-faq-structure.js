// Debug script to check FAQ Master data structure
(function() {
  console.log('\n🔍 FAQ Master Data Structure Debug\n');
  
  const faqMasterBlockId = '212b802c-b0c6-80b3-b04a-fec4203ee8d7';
  const faqMasterCollectionId = '212b802c-b0c6-8014-9263-000b71bd252e';
  
  if (!window.recordMap) {
    console.error('recordMap not available');
    return;
  }
  
  // Check block
  const block = window.recordMap.block[faqMasterBlockId]?.value;
  if (!block) {
    console.error('FAQ Master block not found');
    return;
  }
  
  console.log('✅ FAQ Master block found');
  console.log('View IDs:', block.view_ids);
  
  // Check each view
  if (block.view_ids) {
    block.view_ids.forEach((viewId, index) => {
      console.log(`\n=== View ${index + 1} (${viewId}) ===`);
      
      const view = window.recordMap.collection_view?.[viewId]?.value;
      if (!view) {
        console.log('❌ View not found');
        return;
      }
      
      console.log('View type:', view.type);
      console.log('Has format:', !!view.format);
      console.log('Has format.collection_group_by:', !!view.format?.collection_group_by);
      console.log('Has format.collection_groups:', !!view.format?.collection_groups);
      
      if (view.format?.collection_groups) {
        console.log('Number of groups:', view.format.collection_groups.length);
        view.format.collection_groups.forEach((group, i) => {
          console.log(`  Group ${i + 1}:`, group.value?.value || 'No value');
        });
      }
      
      console.log('Has query2:', !!view.query2);
      console.log('Has query2.group_by:', !!view.query2?.group_by);
      
      // Check collection_query
      const collectionQuery = window.recordMap.collection_query?.[faqMasterCollectionId]?.[viewId];
      if (collectionQuery) {
        console.log('\nCollection Query Data:');
        console.log('Keys:', Object.keys(collectionQuery));
        
        Object.entries(collectionQuery).forEach(([key, value]) => {
          if (key.startsWith('results:')) {
            console.log(`  ${key}: ${value.blockIds?.length || 0} items`);
          }
        });
      } else {
        console.log('❌ No collection_query data');
      }
    });
  }
  
  // Check DOM
  console.log('\n=== DOM Status ===');
  const domElement = document.querySelector(`.notion-block-${faqMasterBlockId}`);
  if (domElement) {
    console.log('✅ DOM element exists');
    const collection = domElement.querySelector('.notion-collection');
    console.log('Has .notion-collection:', !!collection);
    
    const listView = domElement.querySelector('.notion-list-view');
    console.log('Has .notion-list-view:', !!listView);
    
    const groups = domElement.querySelectorAll('.notion-collection-group');
    console.log('Number of .notion-collection-group:', groups.length);
    
    const items = domElement.querySelectorAll('.notion-list-item');
    console.log('Number of .notion-list-item:', items.length);
    
    // Check if empty
    if (collection && collection.innerHTML.trim().length < 100) {
      console.log('⚠️ Collection appears to be empty or minimal');
      console.log('InnerHTML length:', collection.innerHTML.length);
    }
  } else {
    console.log('❌ DOM element not found');
  }
  
  return 'Debug complete';
})();