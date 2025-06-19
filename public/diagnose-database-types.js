// Comprehensive diagnostic tool for database types and rendering issues
(function() {
  console.log('\n🔍 Database Type Diagnostic Tool\n');
  
  // Known database IDs
  const databases = {
    'Prefecture (Working)': '20fb802cb0c68027945beabe5f521e5a',
    'FAQ Master': 'YOUR_FAQ_MASTER_ID', // Replace with actual ID
    // Add other database IDs here
  };
  
  // Analyze each database
  Object.entries(databases).forEach(([name, blockId]) => {
    console.log(`\n=== ${name} (${blockId}) ===`);
    
    if (!window.recordMap) {
      console.error('recordMap not available');
      return;
    }
    
    const block = window.recordMap.block[blockId]?.value;
    if (!block) {
      console.warn('Block not found in recordMap');
      return;
    }
    
    // Basic block info
    console.log('Block type:', block.type);
    console.log('Has direct collection_id:', !!block.collection_id);
    console.log('Has view_ids:', !!block.view_ids);
    console.log('View count:', block.view_ids?.length || 0);
    
    // Determine database type
    const isLinkedDatabase = !block.collection_id && !!block.view_ids?.length;
    console.log('Database type:', isLinkedDatabase ? 'LINKED DATABASE' : 'REGULAR DATABASE');
    
    // Try to resolve collection ID
    let collectionId = block.collection_id;
    let collectionSource = 'direct';
    
    if (!collectionId && block.format?.collection_pointer?.id) {
      collectionId = block.format.collection_pointer.id;
      collectionSource = 'block.format.collection_pointer';
    }
    
    if (!collectionId && block.view_ids?.length > 0) {
      for (const viewId of block.view_ids) {
        const view = window.recordMap.collection_view?.[viewId]?.value;
        if (view?.format?.collection_pointer?.id) {
          collectionId = view.format.collection_pointer.id;
          collectionSource = `view[${viewId}].format.collection_pointer`;
          break;
        }
      }
    }
    
    console.log('Resolved collection_id:', collectionId || 'NOT FOUND');
    console.log('Collection source:', collectionSource);
    
    // Check if collection data exists
    if (collectionId) {
      const collection = window.recordMap.collection?.[collectionId]?.value;
      console.log('Collection exists in recordMap:', !!collection);
      
      if (collection) {
        console.log('Collection name:', collection.name?.[0]?.[0] || 'Unnamed');
        console.log('Collection schema properties:', Object.keys(collection.schema || {}).length);
      }
    }
    
    // Check views
    if (block.view_ids?.length > 0) {
      console.log('\nViews:');
      block.view_ids.forEach((viewId, index) => {
        const view = window.recordMap.collection_view?.[viewId]?.value;
        if (view) {
          console.log(`  View ${index} (${viewId}):`);
          console.log(`    Type: ${view.type}`);
          console.log(`    Name: ${view.name || 'Unnamed'}`);
          console.log(`    Has group_by: ${!!view.query2?.group_by}`);
          if (view.query2?.group_by) {
            console.log(`    Group by property: ${view.query2.group_by.property}`);
            console.log(`    Group by type: ${view.query2.group_by.type}`);
          }
        } else {
          console.log(`  View ${index} (${viewId}): NOT FOUND in recordMap`);
        }
      });
    }
    
    // Check DOM presence
    const domElement = document.querySelector(`.notion-block-${blockId}`);
    console.log('\nDOM Status:');
    console.log('  Element exists:', !!domElement);
    if (domElement) {
      const hasGroups = domElement.querySelector('.notion-collection-group, .notion-list-view-group');
      console.log('  Has group elements:', !!hasGroups);
      
      if (hasGroups) {
        const groups = domElement.querySelectorAll('.notion-collection-group, .notion-list-view-group');
        console.log('  Number of groups:', groups.length);
        
        // Check first group visibility
        if (groups.length > 0) {
          const style = window.getComputedStyle(groups[0]);
          console.log('  First group visibility:');
          console.log(`    display: ${style.display}`);
          console.log(`    visibility: ${style.visibility}`);
          console.log(`    opacity: ${style.opacity}`);
        }
      }
    }
  });
  
  console.log('\n\n💡 Summary:');
  console.log('- Regular databases have collection_id directly on the block');
  console.log('- Linked databases need to get collection_id from view.format.collection_pointer');
  console.log('- Both types need the collection data to be present in recordMap.collection');
  console.log('- Groups are rendered if the view has query2.group_by configuration');
  
  return 'Diagnostic complete';
})();