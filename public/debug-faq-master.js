// Debug script specifically for FAQ Master database
(function() {
  console.log('\n🔍 FAQ Master Debug Analysis\n');
  
  const faqMasterId = '212b802cb0c680b3b04afec4203ee8d7';
  
  // Find FAQ Master in DOM
  const faqElement = document.querySelector(`.notion-block-${faqMasterId}`);
  if (!faqElement) {
    console.error('❌ FAQ Master not found in DOM');
    return;
  }
  
  console.log('✅ FAQ Master found in DOM');
  
  // Check for collection
  const collection = faqElement.querySelector('.notion-collection');
  console.log('Has .notion-collection:', !!collection);
  
  // Check views
  const listView = faqElement.querySelector('.notion-list-view');
  const galleryView = faqElement.querySelector('.notion-gallery-view');
  const tableView = faqElement.querySelector('.notion-table-view');
  
  console.log('\nViews:');
  console.log('- List view:', !!listView);
  console.log('- Gallery view:', !!galleryView);
  console.log('- Table view:', !!tableView);
  
  // Check for groups in list view
  if (listView) {
    const groups = listView.querySelectorAll('.notion-collection-group, .notion-list-view-group');
    console.log('\nGroups in list view:', groups.length);
    
    // Check if items are directly in list view (not grouped)
    const directItems = listView.querySelectorAll(':scope > .notion-list-item');
    console.log('Direct items (not grouped):', directItems.length);
    
    // Check view tabs
    const viewTabs = collection?.querySelectorAll('.notion-collection-view-tabs-content-item');
    if (viewTabs) {
      console.log('\nView tabs:');
      viewTabs.forEach((tab, i) => {
        console.log(`  Tab ${i}: "${tab.textContent?.trim()}"`);
      });
    }
  }
  
  // Check recordMap data
  if (window.recordMap) {
    console.log('\n📊 RecordMap Data:');
    
    // Try different ID formats
    const blockIds = [
      faqMasterId,
      faqMasterId.replace(/-/g, ''),
      '212b802c-b0c6-80b3-b04a-fec4203ee8d7'
    ];
    
    let block = null;
    let foundId = null;
    
    for (const id of blockIds) {
      if (window.recordMap.block[id]) {
        block = window.recordMap.block[id].value;
        foundId = id;
        break;
      }
    }
    
    if (block) {
      console.log(`✅ Found in recordMap with ID: ${foundId}`);
      console.log('Block type:', block.type);
      console.log('View IDs:', block.view_ids);
      
      // Check views for grouping
      if (block.view_ids) {
        console.log('\nView Analysis:');
        block.view_ids.forEach((viewId, i) => {
          const view = window.recordMap.collection_view?.[viewId]?.value;
          if (view) {
            console.log(`\nView ${i} (${viewId}):`);
            console.log('  Type:', view.type);
            console.log('  Name:', view.name || 'Unnamed');
            console.log('  Has query2:', !!view.query2);
            console.log('  Has group_by:', !!view.query2?.group_by);
            
            if (view.query2?.group_by) {
              console.log('  Group by config:', JSON.stringify(view.query2.group_by, null, 2));
            }
            
            // Check format for grouping
            if (view.format?.list_properties) {
              console.log('  Has list properties:', true);
            }
          } else {
            console.log(`\nView ${i} (${viewId}): NOT FOUND`);
          }
        });
      }
      
      // Check collection data
      const collectionId = block.collection_id;
      if (collectionId) {
        const collection = window.recordMap.collection?.[collectionId]?.value;
        if (collection) {
          console.log('\nCollection data:');
          console.log('  Name:', collection.name?.[0]?.[0]);
          console.log('  Schema properties:', Object.keys(collection.schema || {}).length);
          
          // Check for category property
          if (collection.schema) {
            const categoryProps = Object.entries(collection.schema).filter(([id, prop]) => 
              prop.name?.toLowerCase().includes('category') || 
              prop.name?.toLowerCase().includes('カテゴリ')
            );
            
            if (categoryProps.length > 0) {
              console.log('\nCategory properties found:');
              categoryProps.forEach(([id, prop]) => {
                console.log(`  ${prop.name} (${id}): type=${prop.type}`);
              });
            }
          }
        }
      }
    } else {
      console.log('❌ NOT found in recordMap with any ID format');
    }
  }
  
  // Try to manually check if this is supposed to be grouped
  console.log('\n🔧 Manual grouping check:');
  
  // Look for any signs of grouping in the current view
  const activeTab = collection?.querySelector('.notion-collection-view-tabs-content-item.notion-selected-nav-header');
  if (activeTab) {
    console.log('Active tab:', activeTab.textContent?.trim());
  }
  
  // Check if we're looking at the wrong view
  const allTabs = collection?.querySelectorAll('.notion-collection-view-tabs-content-item');
  if (allTabs && allTabs.length > 1) {
    console.log('\n💡 Multiple views available. Try switching views to see if one has grouping.');
  }
  
  return 'FAQ Master debug complete';
})();