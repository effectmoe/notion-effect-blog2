// Force render grouped list views for databases
(function() {
  console.log('🚀 Force rendering grouped list views...');
  
  // Wait for React and Notion components to be ready
  function waitForNotion(callback) {
    if (window.recordMap && document.querySelector('.notion-collection')) {
      callback();
    } else {
      setTimeout(() => waitForNotion(callback), 500);
    }
  }
  
  function forceRenderGroupedLists() {
    // Find FAQ Master specifically
    const faqMasterBlock = document.querySelector('.notion-block-212b802cb0c680b3b04afec4203ee8d7');
    
    if (faqMasterBlock) {
      console.log('✅ Found FAQ Master block');
      
      // Check if it has the collection wrapper
      const collection = faqMasterBlock.querySelector('.notion-collection');
      if (!collection) {
        console.log('❌ No collection wrapper found');
        return;
      }
      
      // Check for view tabs
      const viewTabs = collection.querySelectorAll('.notion-collection-view-tabs-content-item');
      console.log(`Found ${viewTabs.length} view tabs`);
      
      // Look for list view tab and click it
      let listViewTab = null;
      viewTabs.forEach(tab => {
        const text = tab.textContent?.toLowerCase() || '';
        if (text.includes('list') || text.includes('リスト')) {
          listViewTab = tab;
        }
      });
      
      if (listViewTab && !listViewTab.classList.contains('notion-selected-nav-header')) {
        console.log('📋 Clicking list view tab...');
        listViewTab.click();
        
        // Wait for view to render
        setTimeout(() => {
          checkAndFixGroups(faqMasterBlock);
        }, 1000);
      } else {
        // Already on list view or no list view available
        checkAndFixGroups(faqMasterBlock);
      }
    }
    
    // Also check other databases
    const databases = [
      { name: 'Cafe Kinesi Gallery', id: '20fb802cb0c68057a57dcaa1e1172c0c' },
      { name: 'Cafe Kinesi List', id: '215b802cb0c6804a8858d72d4df6f128' }
    ];
    
    databases.forEach(({ name, id }) => {
      const cleanId = id.replace(/-/g, '');
      const block = document.querySelector(`.notion-block-${cleanId}`);
      if (block) {
        console.log(`✅ Found ${name} block`);
        checkAndFixGroups(block);
      }
    });
  }
  
  function checkAndFixGroups(blockElement) {
    const listView = blockElement.querySelector('.notion-list-view');
    
    if (!listView) {
      console.log('⚠️ No list view found in block');
      return;
    }
    
    // Check if we need to inject groups based on recordMap data
    const blockId = Array.from(blockElement.classList)
      .find(cls => cls.startsWith('notion-block-'))
      ?.replace('notion-block-', '');
    
    if (!blockId) return;
    
    // Try to find block in recordMap
    const possibleIds = [
      blockId,
      blockId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
      blockId.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
    ];
    
    let block = null;
    let recordMapId = null;
    
    for (const id of possibleIds) {
      if (window.recordMap?.block?.[id]) {
        block = window.recordMap.block[id].value;
        recordMapId = id;
        break;
      }
    }
    
    if (block && block.view_ids) {
      console.log(`📊 Found block in recordMap: ${recordMapId}`);
      
      // Check if any view has grouping
      let hasGrouping = false;
      
      for (const viewId of block.view_ids) {
        const view = window.recordMap.collection_view?.[viewId]?.value;
        if (view?.type === 'list' && (view.query2?.group_by || view.format?.list_properties_v2)) {
          hasGrouping = true;
          console.log(`✅ Found list view with grouping: ${viewId}`);
          
          // Force the view to render with groups
          forceGroupRendering(listView, view);
          break;
        }
      }
      
      if (!hasGrouping) {
        console.log('ℹ️ No grouped list view found in recordMap');
      }
    }
  }
  
  function forceGroupRendering(listViewElement, viewData) {
    console.log('🔧 Forcing group rendering...');
    
    // Check for existing groups
    const existingGroups = listViewElement.querySelectorAll('.notion-collection-group');
    if (existingGroups.length > 0) {
      console.log(`✅ Groups already exist: ${existingGroups.length}`);
      // Just ensure they're visible
      existingGroups.forEach(group => {
        group.style.display = 'block';
        group.style.visibility = 'visible';
        group.style.opacity = '1';
      });
      return;
    }
    
    // If no groups exist, we need to trigger a re-render
    console.log('⚠️ No groups found, attempting to trigger re-render...');
    
    // Try to find the React component and force update
    const reactKey = Object.keys(listViewElement).find(key => key.startsWith('__react'));
    if (reactKey) {
      const reactInstance = listViewElement[reactKey];
      console.log('Found React instance:', !!reactInstance);
      
      // Try to trigger re-render by dispatching events
      listViewElement.dispatchEvent(new Event('update', { bubbles: true }));
      listViewElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // As a last resort, try clicking the current view tab to refresh
    const currentTab = document.querySelector('.notion-collection-view-tabs-content-item.notion-selected-nav-header');
    if (currentTab) {
      console.log('🔄 Refreshing view by re-clicking tab...');
      currentTab.click();
    }
  }
  
  // Execute when ready
  waitForNotion(() => {
    forceRenderGroupedLists();
    
    // Run again after delays to catch late-loading content
    setTimeout(forceRenderGroupedLists, 2000);
    setTimeout(forceRenderGroupedLists, 4000);
  });
  
  // Expose for manual triggering
  window.forceRenderGroupedLists = forceRenderGroupedLists;
  
  console.log('💡 You can manually run window.forceRenderGroupedLists()');
})();