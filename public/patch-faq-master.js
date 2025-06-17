// Patch to force FAQ Master to display correctly
(function() {
  console.log('🔧 Patching FAQ Master display...');
  
  // Wait for page to be ready
  function waitForReady(callback) {
    if (window.recordMap && document.readyState !== 'loading') {
      callback();
    } else {
      setTimeout(() => waitForReady(callback), 500);
    }
  }
  
  function patchFAQMaster() {
    // Find the FAQ Master block
    const faqMasterId = '212b802cb0c680b3b04afec4203ee8d7';
    const faqBlock = document.querySelector(`.notion-block-${faqMasterId}`);
    
    if (!faqBlock || faqBlock.innerHTML.trim() !== '') {
      console.log('FAQ Master already has content or not found');
      return;
    }
    
    console.log('📝 FAQ Master block found but empty, attempting to populate...');
    
    // Get FAQ Master data from recordMap (ID with hyphens)
    const recordMapId = '212b802c-b0c6-80b3-b04a-fec4203ee8d7';
    const block = window.recordMap?.block?.[recordMapId]?.value;
                  
    if (!block) {
      console.error('❌ FAQ Master not found in recordMap');
      return;
    }
    
    // Get collection data
    const collectionId = block.collection_id;
    const collection = window.recordMap?.collection?.[collectionId]?.value;
    
    if (!collection) {
      console.error('❌ Collection data not found');
      return;
    }
    
    console.log('✅ Found collection:', collection.name?.[0]?.[0]);
    
    // Create a simple list view structure
    const listHTML = `
      <div class="notion-collection-view-tabs-content">
        <div class="notion-collection-view-tabs-content-item notion-selected-nav-header">
          <svg viewBox="0 0 14 14" class="notion-collection-view-type-icon">
            <path d="M 2,3.5 C 2,3.22386 2.22386,3 2.5,3 L 11.5,3 C 11.7761,3 12,3.22386 12,3.5 12,3.77614 11.7761,4 11.5,4 L 2.5,4 C 2.22386,4 2,3.77614 2,3.5 Z M 2,7 C 2,6.72386 2.22386,6.5 2.5,6.5 L 11.5,6.5 C 11.7761,6.5 12,6.72386 12,7 12,7.27614 11.7761,7.5 11.5,7.5 L 2.5,7.5 C 2.22386,7.5 2,7.27614 2,7 Z M 2.5,10 C 2.22386,10 2,10.2239 2,10.5 2,10.7761 2.22386,11 2.5,11 L 11.5,11 C 11.7761,11 12,10.7761 12,10.5 12,10.2239 11.7761,10 11.5,10 L 2.5,10 Z"></path>
          </svg>
          <span>List view</span>
        </div>
        <div class="notion-collection-view-tabs-content-item">
          <svg viewBox="0 0 14 14" class="notion-collection-view-type-icon">
            <path d="M 4,3 C 4,2.44772 4.44772,2 5,2 L 9,2 C 9.55228,2 10,2.44772 10,3 L 10,4 C 10,4.55228 9.55228,5 9,5 L 5,5 C 4.44772,5 4,4.55228 4,4 L 4,3 Z M 4,10 C 4,9.44772 4.44772,9 5,9 L 9,9 C 9.55228,9 10,9.44772 10,10 L 10,11 C 10,11.5523 9.55228,12 9,12 L 5,12 C 4.44772,12 4,11.5523 4,11 L 4,10 Z M 1,3 C 1,2.44772 1.44772,2 2,2 L 2,2 C 2.55228,2 3,2.44772 3,3 L 3,4 C 3,4.55228 2.55228,5 2,5 L 2,5 C 1.44772,5 1,4.55228 1,4 L 1,3 Z M 1,10 C 1,9.44772 1.44772,9 2,9 L 2,9 C 2.55228,9 3,9.44772 3,10 L 3,11 C 3,11.5523 2.55228,12 2,12 L 2,12 C 1.44772,12 1,11.5523 1,11 L 1,10 Z M 11,3 C 11,2.44772 11.4477,2 12,2 L 12,2 C 12.5523,2 13,2.44772 13,3 L 13,4 C 13,4.55228 12.5523,5 12,5 L 12,5 C 11.4477,5 11,4.55228 11,4 L 11,3 Z M 11,10 C 11,9.44772 11.4477,9 12,9 L 12,9 C 12.5523,9 13,9.44772 13,10 L 13,11 C 13,11.5523 12.5523,12 12,12 L 12,12 C 11.4477,12 11,11.5523 11,11 L 11,10 Z M 1,6.5 C 1,6.22386 1.22386,6 1.5,6 L 12.5,6 C 12.7761,6 13,6.22386 13,6.5 L 13,7.5 C 13,7.77614 12.7761,8 12.5,8 L 1.5,8 C 1.22386,8 1,7.77614 1,7.5 L 1,6.5 Z"></path>
          </svg>
          <span>Table view</span>
        </div>
        <div class="notion-collection-view-tabs-content-item">
          <svg viewBox="0 0 14 14" class="notion-collection-view-type-icon">
            <path d="M 2,4.5 C 2,3.11929 3.11929,2 4.5,2 5.88071,2 7,3.11929 7,4.5 7,5.88071 5.88071,7 4.5,7 3.11929,7 2,5.88071 2,4.5 Z M 7,4.5 C 7,3.11929 8.11929,2 9.5,2 10.8807,2 12,3.11929 12,4.5 12,5.88071 10.8807,7 9.5,7 8.11929,7 7,5.88071 7,4.5 Z M 4.5,7 C 3.11929,7 2,8.11929 2,9.5 2,10.8807 3.11929,12 4.5,12 5.88071,12 7,10.8807 7,9.5 7,8.11929 5.88071,7 4.5,7 Z M 9.5,7 C 8.11929,7 7,8.11929 7,9.5 7,10.8807 8.11929,12 9.5,12 10.8807,12 12,10.8807 12,9.5 12,8.11929 10.8807,7 9.5,7 Z"></path>
          </svg>
          <span>Gallery view</span>
        </div>
      </div>
      <div class="notion-collection-content">
        <div class="notion-list-view">
          <div class="notion-list-collection">
            <div class="notion-collection-item-placeholder">
              <p>FAQマスターのデータを読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Insert the structure
    faqBlock.innerHTML = listHTML;
    
    // Try to trigger React to recognize the change
    const event = new Event('change', { bubbles: true });
    faqBlock.dispatchEvent(event);
    
    console.log('✅ FAQ Master structure inserted');
    
    // Now try to populate with actual data if available
    setTimeout(() => populateFAQData(faqBlock, collection, collectionId), 500);
  }
  
  function populateFAQData(faqBlock, collection, collectionId) {
    console.log('📊 Attempting to populate FAQ data...');
    
    // Get all pages in the collection
    const pages = [];
    
    if (window.recordMap?.block) {
      Object.entries(window.recordMap.block).forEach(([blockId, blockData]) => {
        const block = blockData.value;
        if (block && block.type === 'page' && block.parent_id === collectionId) {
          pages.push(block);
        }
      });
    }
    
    console.log(`Found ${pages.length} FAQ items`);
    
    if (pages.length === 0) {
      console.log('⚠️ No FAQ items found in recordMap');
      return;
    }
    
    // Group pages by category
    const grouped = {};
    const categoryProperty = 'oa:|'; // The category property ID from the console log
    
    pages.forEach(page => {
      const category = page.properties?.[categoryProperty]?.[0]?.[0] || 'その他';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(page);
    });
    
    console.log('Grouped FAQs:', Object.keys(grouped));
    
    // Build the HTML
    let listHTML = '<div class="notion-list-collection">';
    
    Object.entries(grouped).forEach(([category, items]) => {
      listHTML += `
        <div class="notion-collection-group">
          <summary class="notion-collection-group-title">
            <div>${category}</div>
          </summary>
          <div class="notion-list-collection">
      `;
      
      items.forEach(item => {
        const title = item.properties?.title?.[0]?.[0] || 'Untitled';
        const icon = item.format?.page_icon || '❓';
        
        listHTML += `
          <div class="notion-list-item notion-page-link">
            <a class="notion-page-link" href="/${item.id.replace(/-/g, '')}">
              <div class="notion-list-item-title">
                <span class="notion-page-icon">${icon}</span>
                <span class="notion-page-title-text">${title}</span>
              </div>
            </a>
          </div>
        `;
      });
      
      listHTML += `
          </div>
        </div>
      `;
    });
    
    listHTML += '</div>';
    
    // Replace the placeholder
    const listView = faqBlock.querySelector('.notion-list-view');
    if (listView) {
      listView.innerHTML = listHTML;
      console.log('✅ FAQ Master populated with grouped data');
    }
  }
  
  // Execute
  waitForReady(() => {
    patchFAQMaster();
    
    // Also add click handlers for view tabs
    setTimeout(() => {
      const faqBlock = document.querySelector('.notion-block-212b802cb0c680b3b04afec4203ee8d7');
      if (faqBlock) {
        const tabs = faqBlock.querySelectorAll('.notion-collection-view-tabs-content-item');
        tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => {
            // Remove selected class from all tabs
            tabs.forEach(t => t.classList.remove('notion-selected-nav-header'));
            // Add to clicked tab
            tab.classList.add('notion-selected-nav-header');
            
            // Show appropriate view (for now just show a message)
            const viewTypes = ['list', 'table', 'gallery'];
            console.log(`Switched to ${viewTypes[index]} view`);
          });
        });
      }
    }, 1000);
  });
  
  // Expose for debugging
  window.patchFAQMaster = patchFAQMaster;
})();