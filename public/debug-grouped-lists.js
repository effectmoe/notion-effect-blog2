// Client-side debugger for grouped list views
(function() {
  console.log('🔍 Grouped List View Debugger Started');
  
  // Function to find and analyze grouped list views
  function analyzeGroupedListViews() {
    console.log('\n📊 Analyzing Grouped List Views...');
    
    // Look for collection views
    const collectionViews = document.querySelectorAll('.notion-collection-view');
    
    collectionViews.forEach((view, index) => {
      console.log(`\n--- Collection View ${index + 1} ---`);
      
      // Get the collection title
      const titleElement = view.closest('.notion-collection')?.querySelector('.notion-collection-header-title');
      const title = titleElement?.textContent || 'Unknown';
      console.log(`Title: ${title}`);
      
      // Check if it's a list view
      const listView = view.querySelector('.notion-list-view');
      const isListView = !!listView;
      console.log(`Is List View: ${isListView}`);
      
      if (isListView) {
        // Check for grouping
        const groups = view.querySelectorAll('.notion-list-view-group');
        const isGrouped = groups.length > 0;
        console.log(`Is Grouped: ${isGrouped}`);
        console.log(`Number of Groups: ${groups.length}`);
        
        if (isGrouped) {
          // Analyze each group
          groups.forEach((group, gIndex) => {
            const groupHeader = group.querySelector('.notion-list-view-group-header');
            const groupTitle = groupHeader?.textContent || 'No title';
            const groupItems = group.querySelectorAll('.notion-list-item');
            
            console.log(`  Group ${gIndex + 1}: "${groupTitle}"`);
            console.log(`    Items: ${groupItems.length}`);
            console.log(`    Visible: ${group.style.display !== 'none'}`);
            console.log(`    Classes: ${Array.from(group.classList).join(', ')}`);
          });
        } else {
          // Check for any hidden elements that might contain groups
          const hiddenElements = view.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
          console.log(`Hidden elements found: ${hiddenElements.length}`);
          
          // Check view type from classes
          const viewClasses = Array.from(view.classList);
          console.log(`View classes: ${viewClasses.join(', ')}`);
        }
      }
    });
    
    // Check for specific database indicators
    checkSpecificDatabases();
  }
  
  // Function to check for specific databases
  function checkSpecificDatabases() {
    console.log('\n🔎 Checking for specific databases...');
    
    // Look for text containing database names
    const pageContent = document.body.textContent;
    const hasCafeKinesi = pageContent.includes('カフェキネシラバーズ') || pageContent.includes('Cafe Kinesi');
    const hasFAQMaster = pageContent.includes('FAQマスター') || pageContent.includes('FAQ');
    
    console.log(`Contains "カフェキネシラバーズ": ${hasCafeKinesi}`);
    console.log(`Contains "FAQマスター": ${hasFAQMaster}`);
    
    // Check recordMap if available
    if (window.recordMap) {
      console.log('\n📦 Checking recordMap...');
      
      // Look for collections
      const collections = window.recordMap.collection || {};
      Object.entries(collections).forEach(([id, data]) => {
        const collection = data.value;
        if (collection && collection.name) {
          const name = collection.name[0]?.[0] || '';
          if (name.includes('カフェキネシラバーズ') || name.includes('FAQマスター')) {
            console.log(`\nFound collection: ${name}`);
            console.log(`  ID: ${id}`);
            console.log(`  Schema properties: ${Object.keys(collection.schema || {}).join(', ')}`);
            
            // Check for grouping property
            Object.entries(collection.schema || {}).forEach(([propId, prop]) => {
              if (prop.type === 'select' || prop.type === 'multi_select') {
                console.log(`  Groupable property: ${prop.name} (${prop.type})`);
              }
            });
          }
        }
      });
      
      // Look for collection views
      const collectionViews = window.recordMap.collection_view || {};
      Object.entries(collectionViews).forEach(([id, data]) => {
        const view = data.value;
        if (view) {
          console.log(`\nCollection View: ${id}`);
          console.log(`  Type: ${view.type}`);
          console.log(`  Name: ${view.name}`);
          
          // Check for grouping in query
          if (view.query2?.group_by || view.query?.group_by) {
            const groupBy = view.query2?.group_by || view.query?.group_by;
            console.log(`  ✅ Has grouping: ${JSON.stringify(groupBy)}`);
          }
        }
      });
    }
  }
  
  // Function to monitor DOM changes
  function monitorChanges() {
    const observer = new MutationObserver((mutations) => {
      const relevantChange = mutations.some(mutation => {
        return mutation.target.classList?.contains('notion-collection-view') ||
               mutation.target.closest('.notion-collection-view');
      });
      
      if (relevantChange) {
        console.log('📝 Collection view changed, re-analyzing...');
        setTimeout(analyzeGroupedListViews, 500);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }
  
  // Initial analysis
  setTimeout(analyzeGroupedListViews, 1000);
  
  // Start monitoring
  monitorChanges();
  
  // Expose debug function
  window.debugGroupedLists = analyzeGroupedListViews;
  
  console.log('💡 Use window.debugGroupedLists() to manually analyze grouped list views');
})();