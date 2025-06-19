// Comprehensive fix for database rendering issues
(function() {
  console.log('🔧 Starting comprehensive database rendering fix...');
  
  // Target databases that need fixing - using the correct IDs from recordMap
  const problematicDatabases = {
    'FAQ Master': '212b802c-b0c6-80b3-b04a-fec4203ee8d7',
    'Cafe Kinesi Gallery': '20fb802c-b0c6-8057-a57d-caa1e1172c0c',
    'Cafe Kinesi List': '215b802c-b0c6-804a-8858-d72d4df6f128'
  };
  
  function forceRenderDatabase(name, blockId) {
    console.log(`\n🔨 Forcing render for ${name}...`);
    
    // Try both with and without hyphens
    const domElement = document.querySelector(`.notion-block-${blockId}`) || 
                      document.querySelector(`.notion-block-${blockId.replace(/-/g, '')}`);
    if (!domElement) {
      console.log(`❌ ${name} not found in DOM`);
      return;
    }
    
    // Check if we have recordMap data
    if (!window.recordMap) {
      console.log('❌ recordMap not available');
      return;
    }
    
    const block = window.recordMap.block[blockId]?.value || 
                  window.recordMap.block[blockId.replace(/-/g, '')]?.value;
    
    if (!block) {
      console.log(`❌ ${name} not found in recordMap`);
      // Try to at least fix visibility
      fixVisibility(domElement);
      return;
    }
    
    // Find the collection element
    const collection = domElement.querySelector('.notion-collection');
    if (!collection) {
      console.log(`❌ No collection element found for ${name}`);
      return;
    }
    
    // Check current view
    const hasListView = collection.querySelector('.notion-list-view');
    const hasGalleryView = collection.querySelector('.notion-gallery-view');
    
    if (!hasListView && !hasGalleryView) {
      console.log(`⚠️ No views rendered for ${name}`);
      
      // Try to switch to list view
      const viewTabs = collection.querySelectorAll('.notion-collection-view-tabs-content-item');
      let listViewFound = false;
      
      viewTabs.forEach(tab => {
        const tabText = tab.textContent?.toLowerCase() || '';
        if (tabText.includes('list') || tabText.includes('リスト')) {
          console.log('📋 Clicking list view tab...');
          tab.click();
          listViewFound = true;
        }
      });
      
      if (!listViewFound) {
        console.log('❌ No list view tab found');
      }
    }
    
    // Force visibility after a delay
    setTimeout(() => {
      const updatedListView = collection.querySelector('.notion-list-view');
      if (updatedListView) {
        console.log(`✅ List view found for ${name}, ensuring groups are visible...`);
        ensureGroupsVisible(updatedListView, name);
      } else {
        console.log(`⚠️ Still no list view for ${name}`);
        // Try one more time to fix any view that exists
        fixVisibility(domElement);
      }
    }, 1000);
  }
  
  function ensureGroupsVisible(container, name) {
    // Find all group elements (both old and new class names)
    const groups = container.querySelectorAll(
      '.notion-collection-group, .notion-list-view-group'
    );
    
    if (groups.length > 0) {
      console.log(`✅ Found ${groups.length} groups in ${name}`);
      
      groups.forEach((group, index) => {
        // Force visibility
        group.style.display = 'block';
        group.style.visibility = 'visible';
        group.style.opacity = '1';
        group.style.height = 'auto';
        group.style.overflow = 'visible';
        
        // Also fix group titles
        const groupTitle = group.querySelector('.notion-collection-group-title');
        if (groupTitle) {
          groupTitle.style.display = 'list-item';
          groupTitle.style.visibility = 'visible';
          groupTitle.style.opacity = '1';
        }
        
        // Fix items within groups
        const items = group.querySelectorAll('.notion-list-item');
        items.forEach(item => {
          item.style.display = 'block';
          item.style.visibility = 'visible';
          item.style.opacity = '1';
        });
      });
      
      // Also ensure the parent containers are visible
      let parent = container.parentElement;
      while (parent && !parent.classList.contains('notion-page-content')) {
        parent.style.display = 'block';
        parent.style.visibility = 'visible';
        parent.style.opacity = '1';
        parent = parent.parentElement;
      }
    } else {
      console.log(`⚠️ No groups found in ${name}`);
    }
  }
  
  function fixVisibility(element) {
    // Brute force visibility fix for any content
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.className && typeof el.className === 'string') {
        if (el.className.includes('notion-') && 
            (el.className.includes('group') || 
             el.className.includes('list') || 
             el.className.includes('collection'))) {
          el.style.display = 'block';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        }
      }
    });
  }
  
  function injectGlobalStyles() {
    const styleId = 'database-rendering-fixes';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Force all database groups to be visible */
      .notion-collection-group,
      .notion-list-view-group,
      .notion-collection-group-title {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        height: auto !important;
        overflow: visible !important;
      }
      
      .notion-collection-group-title {
        display: list-item !important;
        padding: 8px 0 !important;
        font-weight: 600 !important;
      }
      
      /* Ensure list items are visible */
      .notion-list-collection .notion-list-item,
      .notion-collection-group .notion-list-item {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Fix container visibility */
      .notion-collection-view-type-list {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Ensure proper spacing */
      .notion-collection-group + .notion-collection-group {
        margin-top: 16px !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Global styles injected');
  }
  
  // Main execution
  function fixAllDatabases() {
    console.log('\n🚀 Fixing all problematic databases...');
    
    // First inject global styles
    injectGlobalStyles();
    
    // Then fix each database
    Object.entries(problematicDatabases).forEach(([name, blockId]) => {
      forceRenderDatabase(name, blockId);
    });
  }
  
  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(fixAllDatabases, 1000);
    });
  } else {
    setTimeout(fixAllDatabases, 500);
  }
  
  // Run multiple times to catch late-loading content
  setTimeout(fixAllDatabases, 2000);
  setTimeout(fixAllDatabases, 3000);
  setTimeout(fixAllDatabases, 5000);
  
  // Expose for manual triggering
  window.fixDatabaseRendering = fixAllDatabases;
  
  console.log('💡 You can manually run window.fixDatabaseRendering() if needed');
})();