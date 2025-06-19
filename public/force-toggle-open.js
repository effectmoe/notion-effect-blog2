// Force toggles with gallery views to be open
(function() {
  function openTogglesWithGalleries() {
    // Wait for Notion content to load
    setTimeout(() => {
      // Find all toggle elements
      const toggles = document.querySelectorAll('details.notion-toggle');
      
      toggles.forEach(toggle => {
        // Check if this toggle contains a collection view
        const hasCollection = toggle.querySelector('.notion-collection, .notion-collection-view, .notion-gallery');
        
        if (hasCollection) {
          // Force the toggle to be open
          toggle.setAttribute('open', '');
          console.log('Forced open toggle with collection:', toggle);
        }
      });
      
      // Also try to find any collection views that might be hidden
      const hiddenCollections = document.querySelectorAll('.notion-collection[style*="display: none"], .notion-collection-view[style*="display: none"]');
      hiddenCollections.forEach(collection => {
        collection.style.display = 'block';
        collection.style.visibility = 'visible';
        console.log('Forced visible collection:', collection);
      });
    }, 1000); // Wait 1 second for content to load
  }
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openTogglesWithGalleries);
  } else {
    openTogglesWithGalleries();
  }
  
  // Also run on route changes (for Next.js)
  if (typeof window !== 'undefined') {
    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(history, arguments);
      setTimeout(openTogglesWithGalleries, 500);
    };
    
    window.addEventListener('popstate', () => {
      setTimeout(openTogglesWithGalleries, 500);
    });
  }
})();