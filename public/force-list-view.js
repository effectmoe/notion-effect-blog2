// Force list view for all databases
(function() {
  function forceListView() {
    // Find all collection view tab buttons
    const viewTabs = document.querySelectorAll('.notion-collection-view-tabs');
    
    viewTabs.forEach(tabContainer => {
      // Find the list view tab
      const listTab = Array.from(tabContainer.querySelectorAll('.notion-collection-view-tab-button'))
        .find(tab => tab.textContent?.toLowerCase().includes('list'));
      
      if (listTab && !listTab.classList.contains('notion-collection-view-tab-active')) {
        // Click the list view tab
        listTab.click();
      }
    });
    
    // Also ensure list views are visible
    const listViews = document.querySelectorAll('.notion-collection-view-type-list');
    listViews.forEach(view => {
      view.style.display = 'block';
    });
  }
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceListView);
  } else {
    forceListView();
  }
  
  // Run again after dynamic content loads
  setTimeout(forceListView, 1000);
  setTimeout(forceListView, 2000);
  
  // Watch for new collections being added
  const observer = new MutationObserver((mutations) => {
    const hasNewCollection = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => 
        node.nodeType === 1 && (
          node.classList?.contains('notion-collection-view') ||
          node.querySelector?.('.notion-collection-view')
        )
      );
    });
    
    if (hasNewCollection) {
      setTimeout(forceListView, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();