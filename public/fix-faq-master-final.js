// Final fix for FAQ Master grouped display
(function() {
  console.log('🎯 Final FAQ Master fix starting...');
  
  let attemptCount = 0;
  const maxAttempts = 10;
  
  function checkAndFixFAQMaster() {
    attemptCount++;
    console.log(`Attempt ${attemptCount} to fix FAQ Master...`);
    
    const faqMasterId = '212b802cb0c680b3b04afec4203ee8d7';
    const faqBlock = document.querySelector(`.notion-block-${faqMasterId}`);
    
    if (!faqBlock) {
      console.log('FAQ Master block not found yet');
      if (attemptCount < maxAttempts) {
        setTimeout(checkAndFixFAQMaster, 1000);
      }
      return;
    }
    
    // Check if React has rendered the collection
    const hasCollection = faqBlock.querySelector('.notion-collection-content');
    const hasListItems = faqBlock.querySelectorAll('.notion-list-item').length > 0;
    const hasGroups = faqBlock.querySelectorAll('.notion-collection-group').length > 0;
    
    console.log(`FAQ Master state: hasCollection=${!!hasCollection}, hasItems=${hasListItems}, hasGroups=${hasGroups}`);
    
    // If it has items but no groups, we need to reorganize
    if (hasListItems && !hasGroups) {
      console.log('📝 FAQ Master has items but no groups. Reorganizing...');
      reorganizeFAQIntoGroups(faqBlock);
    } else if (!hasListItems && !hasGroups) {
      // If completely empty, wait a bit more
      if (attemptCount < maxAttempts) {
        setTimeout(checkAndFixFAQMaster, 1000);
      }
    } else if (hasGroups) {
      console.log('✅ FAQ Master already has groups!');
    }
  }
  
  function reorganizeFAQIntoGroups(faqBlock) {
    // Get all list items
    const listItems = Array.from(faqBlock.querySelectorAll('.notion-list-item'));
    if (listItems.length === 0) return;
    
    // Extract items with their categories
    const itemsByCategory = {};
    
    listItems.forEach(item => {
      // Try to find category from the item's content or properties
      let category = 'その他'; // Default category
      
      // Look for category in various places
      const pageLink = item.querySelector('a');
      if (pageLink) {
        const href = pageLink.getAttribute('href');
        const text = item.textContent || '';
        
        // Category detection based on content
        if (text.includes('カフェキネシとは') || text.includes('何ですか')) {
          category = '基本情報';
        } else if (text.includes('講座') || text.includes('受講')) {
          category = '講座について';
        } else if (text.includes('資格') || text.includes('有効期限')) {
          category = '資格について';
        } else if (text.includes('金') || text.includes('料金') || text.includes('いくら')) {
          category = '費用について';
        }
      }
      
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item.cloneNode(true));
    });
    
    console.log('Categories found:', Object.keys(itemsByCategory));
    
    // Find the list container
    const listContainer = faqBlock.querySelector('.notion-list-collection') || 
                         faqBlock.querySelector('.notion-list-view');
    
    if (!listContainer) {
      console.error('List container not found');
      return;
    }
    
    // Clear existing items
    listContainer.innerHTML = '';
    
    // Create grouped structure
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'notion-collection-group';
      
      const groupTitle = document.createElement('summary');
      groupTitle.className = 'notion-collection-group-title';
      groupTitle.innerHTML = `<div>${category}</div>`;
      
      const groupContent = document.createElement('div');
      groupContent.className = 'notion-list-collection';
      
      items.forEach(item => {
        groupContent.appendChild(item);
      });
      
      groupDiv.appendChild(groupTitle);
      groupDiv.appendChild(groupContent);
      listContainer.appendChild(groupDiv);
    });
    
    console.log('✅ FAQ Master reorganized into groups');
    
    // Add click handlers for group titles
    const groupTitles = listContainer.querySelectorAll('.notion-collection-group-title');
    groupTitles.forEach(title => {
      title.style.cursor = 'pointer';
      title.addEventListener('click', function() {
        const group = this.parentElement;
        const content = group.querySelector('.notion-list-collection');
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      });
    });
  }
  
  // Start checking
  setTimeout(checkAndFixFAQMaster, 1000);
  
  // Also watch for changes
  const observer = new MutationObserver((mutations) => {
    const faqBlock = document.querySelector('.notion-block-212b802cb0c680b3b04afec4203ee8d7');
    if (faqBlock) {
      const hasItems = faqBlock.querySelectorAll('.notion-list-item').length > 0;
      const hasGroups = faqBlock.querySelectorAll('.notion-collection-group').length > 0;
      
      if (hasItems && !hasGroups) {
        console.log('🔄 FAQ Master changed, reorganizing...');
        reorganizeFAQIntoGroups(faqBlock);
        observer.disconnect(); // Stop observing after fix
      }
    }
  });
  
  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  } else {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Expose for manual triggering
  window.fixFAQMasterFinal = checkAndFixFAQMaster;
})();