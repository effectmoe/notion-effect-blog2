// Universal fix for all database grouped list views
(function() {
  'use strict';
  
  console.log('🔧 Universal Database View Fix Started');
  
  // Function to fix all grouped list views
  function fixAllGroupedListViews() {
    // Find all collection views with list view type
    const listViews = document.querySelectorAll('.notion-collection-view-type-list');
    
    listViews.forEach(view => {
      // Check if this is a grouped view by looking for group elements
      const hasGroups = view.querySelector('.notion-collection-group, .notion-list-view-group');
      
      if (hasGroups) {
        console.log('📊 Found grouped list view, applying fixes...');
        
        // Fix new-style groups (.notion-collection-group)
        const newGroups = view.querySelectorAll('.notion-collection-group');
        newGroups.forEach(group => {
          // Force visibility
          group.style.display = 'block';
          group.style.visibility = 'visible';
          group.style.opacity = '1';
          
          // Fix group title
          const groupTitle = group.querySelector('.notion-collection-group-title');
          if (groupTitle) {
            groupTitle.style.display = 'block';
            groupTitle.style.visibility = 'visible';
            groupTitle.style.opacity = '1';
            groupTitle.style.padding = '12px 0';
            groupTitle.style.fontWeight = '600';
          }
          
          // Fix items within group
          const items = group.querySelectorAll('.notion-list-item');
          items.forEach(item => {
            item.style.display = 'flex';
            item.style.visibility = 'visible';
            item.style.opacity = '1';
          });
        });
        
        // Fix old-style groups (.notion-list-view-group)
        const oldGroups = view.querySelectorAll('.notion-list-view-group');
        oldGroups.forEach(group => {
          // Force visibility
          group.style.display = 'block';
          group.style.visibility = 'visible';
          group.style.opacity = '1';
          
          // Fix group header
          const groupHeader = group.querySelector('.notion-list-view-group-header');
          if (groupHeader) {
            groupHeader.style.display = 'flex';
            groupHeader.style.visibility = 'visible';
            groupHeader.style.opacity = '1';
            groupHeader.style.padding = '12px 0';
            groupHeader.style.fontWeight = '600';
          }
          
          // Fix group items container
          const itemsContainer = group.querySelector('.notion-list-view-group-items');
          if (itemsContainer) {
            itemsContainer.style.display = 'block';
            itemsContainer.style.visibility = 'visible';
            itemsContainer.style.opacity = '1';
            itemsContainer.style.paddingLeft = '16px';
          }
          
          // Fix individual items
          const items = group.querySelectorAll('.notion-list-item');
          items.forEach(item => {
            item.style.display = 'flex';
            item.style.visibility = 'visible';
            item.style.opacity = '1';
          });
        });
        
        // Ensure the list view container is visible
        const listViewContainer = view.querySelector('.notion-list-view');
        if (listViewContainer) {
          listViewContainer.style.display = 'block';
          listViewContainer.style.visibility = 'visible';
          listViewContainer.style.opacity = '1';
          listViewContainer.style.minHeight = '100px';
        }
        
        // Fix any toggle containers that might be hiding the content
        const toggle = view.closest('details.notion-toggle');
        if (toggle) {
          toggle.setAttribute('open', '');
          console.log('✅ Opened toggle containing grouped list view');
        }
        
        console.log('✅ Fixed grouped list view');
      }
    });
    
    // Also fix any collections that might be hidden
    const hiddenCollections = document.querySelectorAll(
      '.notion-collection[style*="display: none"], ' +
      '.notion-collection[style*="visibility: hidden"], ' +
      '.notion-collection-view[style*="display: none"], ' +
      '.notion-collection-view[style*="visibility: hidden"]'
    );
    
    hiddenCollections.forEach(collection => {
      collection.style.display = 'block';
      collection.style.visibility = 'visible';
      collection.style.opacity = '1';
      console.log('✅ Made hidden collection visible');
    });
  }
  
  // Apply fixes with multiple attempts to ensure everything loads
  function applyFixesWithRetry() {
    // Initial fix
    fixAllGroupedListViews();
    
    // Retry after short delays to catch dynamically loaded content
    setTimeout(fixAllGroupedListViews, 500);
    setTimeout(fixAllGroupedListViews, 1000);
    setTimeout(fixAllGroupedListViews, 2000);
  }
  
  // Run on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixesWithRetry);
  } else {
    applyFixesWithRetry();
  }
  
  // Monitor for dynamic changes
  const observer = new MutationObserver((mutations) => {
    // Check if any mutation affects collection views
    const hasRelevantChange = mutations.some(mutation => {
      // Check the mutated element and its children
      const target = mutation.target;
      return target.classList?.contains('notion-collection') ||
             target.classList?.contains('notion-collection-view') ||
             target.querySelector?.('.notion-collection-view') ||
             target.closest?.('.notion-collection-view');
    });
    
    if (hasRelevantChange) {
      console.log('🔄 Collection view changed, reapplying fixes...');
      setTimeout(fixAllGroupedListViews, 100);
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  // Handle tab changes in collection views
  document.addEventListener('click', (e) => {
    const target = e.target;
    // Check if a collection view tab was clicked
    if (target.closest('.notion-collection-view-tab-button')) {
      console.log('📑 Tab clicked, reapplying fixes...');
      setTimeout(fixAllGroupedListViews, 300);
    }
  });
  
  // Handle route changes (for Next.js)
  if (typeof window !== 'undefined') {
    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(history, arguments);
      setTimeout(applyFixesWithRetry, 500);
    };
    
    window.addEventListener('popstate', () => {
      setTimeout(applyFixesWithRetry, 500);
    });
  }
  
  // Expose function for manual testing
  window.fixGroupedListViews = fixAllGroupedListViews;
  console.log('💡 Use window.fixGroupedListViews() to manually fix grouped views');
})();