// Fix for grouped list views not displaying properly
(function() {
  'use strict';
  
  // Function to fix grouped list views
  function fixGroupedListViews() {
    // Find all collection views
    const collectionViews = document.querySelectorAll('.notion-collection-view');
    
    collectionViews.forEach(view => {
      // Check if it's a list view
      const listView = view.querySelector('.notion-list-view');
      if (!listView) return;
      
      // Look for hidden groups (new class names)
      const hiddenGroups = view.querySelectorAll('.notion-collection-group[style*="display: none"], .notion-collection-group[style*="visibility: hidden"]');
      
      hiddenGroups.forEach(group => {
        // Force display
        group.style.display = 'block';
        group.style.visibility = 'visible';
        group.style.opacity = '1';
      });
      
      // Fix group titles (new class)
      const groupTitles = view.querySelectorAll('.notion-collection-group-title');
      groupTitles.forEach(title => {
        title.style.display = 'list-item';
        title.style.visibility = 'visible';
        title.style.opacity = '1';
      });
      
      // Also check for old class names
      const oldHiddenGroups = listView.querySelectorAll('.notion-list-view-group[style*="display: none"], .notion-list-view-group[style*="visibility: hidden"]');
      oldHiddenGroups.forEach(group => {
        group.style.display = 'block';
        group.style.visibility = 'visible';
        group.style.opacity = '1';
      });
      
      // Ensure the list view itself is visible
      listView.style.display = 'block';
      listView.style.visibility = 'visible';
      listView.style.opacity = '1';
    });
  }
  
  // Function to check if we're on a page with problematic databases
  function shouldApplyFix() {
    const pageContent = document.body.textContent;
    return pageContent.includes('カフェキネシラバーズ') || 
           pageContent.includes('Cafe Kinesi') ||
           // Add more database names here if needed
           false;
  }
  
  // Apply fix with delay to ensure DOM is ready
  function applyFix() {
    if (shouldApplyFix()) {
      fixGroupedListViews();
      console.log('✅ Applied grouped list view fix');
    }
  }
  
  // Initial fix
  setTimeout(applyFix, 1000);
  
  // Monitor for dynamic content changes
  const observer = new MutationObserver((mutations) => {
    const relevantChange = mutations.some(mutation => {
      return mutation.target.classList?.contains('notion-collection-view') ||
             mutation.target.closest('.notion-collection-view');
    });
    
    if (relevantChange) {
      setTimeout(applyFix, 100);
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  // Also fix on view tab changes
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('.notion-collection-view-tab-button')) {
      setTimeout(applyFix, 300);
    }
  });
})();