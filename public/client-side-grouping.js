/**
 * Client-side grouping implementation for Notion databases
 * This script groups database items on the client side since react-notion-x doesn't support grouped list views
 */

(function() {
  'use strict';
  
  console.log('🔧 Client-side grouping script loaded');
  
  function groupDatabaseItems() {
    // FAQ Master specific implementation
    const faqMasterBlock = document.querySelector('.notion-block-212b802cb0c680b3b04afec4203ee8d7');
    
    if (faqMasterBlock) {
      console.log('📋 Processing FAQ Master database');
      
      // Check if it's already grouped (to avoid re-grouping)
      if (faqMasterBlock.querySelector('.client-grouped')) {
        return;
      }
      
      // Find all list items
      const listItems = faqMasterBlock.querySelectorAll('.notion-list-item, .notion-gallery-card');
      
      if (listItems.length > 0) {
        console.log(`Found ${listItems.length} items to group`);
        
        // Extract items and their categories
        const itemsByCategory = {};
        
        listItems.forEach(item => {
          // Try to find category from the item's content
          // This will need adjustment based on actual DOM structure
          const categoryElement = item.querySelector('[class*="property"][class*="select"]');
          const category = categoryElement?.textContent?.trim() || 'その他';
          
          if (!itemsByCategory[category]) {
            itemsByCategory[category] = [];
          }
          
          itemsByCategory[category].push(item);
        });
        
        // Create grouped structure
        const groupedContainer = document.createElement('div');
        groupedContainer.className = 'client-grouped notion-list-view';
        
        Object.entries(itemsByCategory).forEach(([category, items]) => {
          // Create group container
          const groupDiv = document.createElement('div');
          groupDiv.className = 'notion-collection-group client-side-group';
          
          // Create group title
          const groupTitle = document.createElement('summary');
          groupTitle.className = 'notion-collection-group-title';
          groupTitle.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5em;">
              <svg width="12" height="12" viewBox="0 0 12 12" style="transition: transform 200ms ease-out;">
                <path d="M6.02734 8.80274C6.27148 8.80274 6.47168 8.71484 6.66211 8.51465L10.2803 4.82324C10.4268 4.67676 10.5 4.49609 10.5 4.28125C10.5 3.85156 10.1484 3.5 9.72363 3.5C9.50879 3.5 9.30859 3.58789 9.15234 3.74902L6.03223 6.9668L2.90722 3.74902C2.74609 3.58789 2.55078 3.5 2.33105 3.5C1.90137 3.5 1.55469 3.85156 1.55469 4.28125C1.55469 4.49609 1.62793 4.67676 1.77441 4.82324L5.39258 8.51465C5.58789 8.71484 5.78808 8.80274 6.02734 8.80274Z" fill="currentColor"></path>
              </svg>
              <span>${category}</span>
              <span style="opacity: 0.5; font-size: 0.9em;">(${items.length})</span>
            </div>
          `;
          
          // Create items container
          const itemsContainer = document.createElement('div');
          itemsContainer.className = 'notion-list-collection';
          
          // Move items to the group
          items.forEach(item => {
            itemsContainer.appendChild(item.cloneNode(true));
          });
          
          groupDiv.appendChild(groupTitle);
          groupDiv.appendChild(itemsContainer);
          groupedContainer.appendChild(groupDiv);
          
          // Add toggle functionality
          groupTitle.addEventListener('click', function() {
            const isOpen = itemsContainer.style.display !== 'none';
            itemsContainer.style.display = isOpen ? 'none' : 'block';
            const svg = groupTitle.querySelector('svg');
            if (svg) {
              svg.style.transform = isOpen ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
          });
        });
        
        // Replace original content with grouped content
        const originalContainer = faqMasterBlock.querySelector('.notion-collection-view-body');
        if (originalContainer) {
          originalContainer.innerHTML = '';
          originalContainer.appendChild(groupedContainer);
        }
        
        console.log('✅ Client-side grouping applied successfully');
      }
    }
  }
  
  // Apply grouping with multiple attempts
  function applyGrouping() {
    groupDatabaseItems();
    
    // Retry after content loads
    setTimeout(groupDatabaseItems, 1000);
    setTimeout(groupDatabaseItems, 2000);
    setTimeout(groupDatabaseItems, 3000);
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGrouping);
  } else {
    applyGrouping();
  }
  
  // Also listen for dynamic content changes
  const observer = new MutationObserver(function(mutations) {
    const hasDatabaseChanges = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        return node.nodeType === 1 && (
          node.classList?.contains('notion-collection') ||
          node.querySelector?.('.notion-collection')
        );
      });
    });
    
    if (hasDatabaseChanges) {
      setTimeout(groupDatabaseItems, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();