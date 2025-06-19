// Analyze runtime recordMap to understand database issues
(function() {
  console.log('\n🔍 Runtime RecordMap Analysis\n');
  
  if (!window.recordMap) {
    console.error('❌ recordMap not available');
    return;
  }
  
  // Analyze recordMap structure
  console.log('📊 RecordMap Structure:');
  console.log(`  Total blocks: ${Object.keys(window.recordMap.block || {}).length}`);
  console.log(`  Total collections: ${Object.keys(window.recordMap.collection || {}).length}`);
  console.log(`  Total collection views: ${Object.keys(window.recordMap.collection_view || {}).length}`);
  
  // Known database IDs
  const targetDatabases = {
    'Prefecture (Working)': '20fb802cb0c68027945beabe5f521e5a',
    'FAQ Master': '212b802cb0c680b3b04afec4203ee8d7',
    'Cafe Kinesi Gallery': '20fb802cb0c68057a57dcaa1e1172c0c',
    'Cafe Kinesi List': '215b802cb0c6804a8858d72d4df6f128'
  };
  
  console.log('\n🔎 Searching for target databases in recordMap...\n');
  
  // Check each target database
  Object.entries(targetDatabases).forEach(([name, blockId]) => {
    const block = window.recordMap.block[blockId]?.value;
    console.log(`${name} (${blockId}):`);
    console.log(`  In recordMap: ${!!block}`);
    
    if (!block) {
      // Try to find it with different ID formats
      const cleanId = blockId.replace(/-/g, '');
      const block2 = window.recordMap.block[cleanId]?.value;
      if (block2) {
        console.log(`  ✅ Found with clean ID: ${cleanId}`);
      }
    }
  });
  
  // Find all collection_view blocks
  console.log('\n📁 All Collection View Blocks in RecordMap:\n');
  const collectionViewBlocks = [];
  
  Object.entries(window.recordMap.block || {}).forEach(([blockId, blockData]) => {
    const block = blockData?.value;
    if (block && (block.type === 'collection_view' || block.type === 'collection_view_page')) {
      // Get collection name
      let collectionName = 'Unknown';
      const collectionId = block.collection_id;
      
      if (collectionId && window.recordMap.collection?.[collectionId]) {
        const collection = window.recordMap.collection[collectionId].value;
        collectionName = collection.name?.[0]?.[0] || 'Unnamed';
      }
      
      // Check for linked database
      let linkedCollectionId = null;
      if (!collectionId && block.view_ids?.length > 0) {
        for (const viewId of block.view_ids) {
          const view = window.recordMap.collection_view?.[viewId]?.value;
          if (view?.format?.collection_pointer?.id) {
            linkedCollectionId = view.format.collection_pointer.id;
            const linkedCollection = window.recordMap.collection?.[linkedCollectionId]?.value;
            if (linkedCollection) {
              collectionName = linkedCollection.name?.[0]?.[0] || 'Linked Database';
            }
            break;
          }
        }
      }
      
      collectionViewBlocks.push({
        blockId,
        name: collectionName,
        type: block.type,
        hasDirectCollectionId: !!block.collection_id,
        linkedCollectionId,
        viewCount: block.view_ids?.length || 0
      });
    }
  });
  
  // Display found blocks
  if (collectionViewBlocks.length > 0) {
    collectionViewBlocks.forEach(({ blockId, name, type, hasDirectCollectionId, linkedCollectionId, viewCount }) => {
      console.log(`Block: ${blockId}`);
      console.log(`  Name: ${name}`);
      console.log(`  Type: ${type}`);
      console.log(`  Direct collection: ${hasDirectCollectionId}`);
      if (linkedCollectionId) {
        console.log(`  Linked to: ${linkedCollectionId}`);
      }
      console.log(`  Views: ${viewCount}`);
      
      // Check if this matches any of our targets
      const matchingTarget = Object.entries(targetDatabases).find(([name, id]) => 
        id === blockId || id.replace(/-/g, '') === blockId || blockId === id.replace(/-/g, '')
      );
      if (matchingTarget) {
        console.log(`  ⭐ This is: ${matchingTarget[0]}`);
      }
      
      console.log('');
    });
  } else {
    console.log('No collection view blocks found in recordMap');
  }
  
  // Check DOM for databases
  console.log('\n🌐 DOM Database Analysis:\n');
  
  Object.entries(targetDatabases).forEach(([name, blockId]) => {
    const domElement = document.querySelector(`.notion-block-${blockId}`);
    if (domElement) {
      console.log(`✅ ${name} found in DOM`);
      
      // Check for groups
      const groups = domElement.querySelectorAll('.notion-collection-group');
      const listView = domElement.querySelector('.notion-list-view');
      const galleryView = domElement.querySelector('.notion-gallery-view');
      
      console.log(`  Has list view: ${!!listView}`);
      console.log(`  Has gallery view: ${!!galleryView}`);
      console.log(`  Number of groups: ${groups.length}`);
      
      // Check if content is empty
      if (listView || galleryView) {
        const viewElement = listView || galleryView;
        const hasContent = viewElement.children.length > 0;
        console.log(`  Has content: ${hasContent}`);
      }
    } else {
      console.log(`❌ ${name} NOT found in DOM`);
    }
    console.log('');
  });
  
  console.log('\n💡 Summary:');
  console.log('- Databases may have different ID formats (with/without hyphens)');
  console.log('- Some databases are linked (collection_id in view.format.collection_pointer)');
  console.log('- Prefecture DB appears to be server-side rendered (not in recordMap)');
  console.log('- Other databases need proper data loading or view switching');
  
  return 'Analysis complete';
})();