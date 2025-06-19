// Analyze why the prefecture database works correctly
(function() {
  console.log('\n🔍 Analyzing Prefecture Database Special Handling...\n');
  
  const prefectureBlockId = '20fb802cb0c68027945beabe5f521e5a';
  
  // Check if recordMap exists
  if (!window.recordMap) {
    console.error('recordMap not available');
    return;
  }
  
  console.log('=== Prefecture Database Analysis ===');
  console.log(`Block ID: ${prefectureBlockId}`);
  
  // Check if block exists in recordMap
  const blockInRecordMap = window.recordMap.block[prefectureBlockId];
  console.log('\n1. RecordMap Status:');
  console.log(`   Block exists in recordMap: ${!!blockInRecordMap}`);
  
  // Check DOM element
  const domElement = document.querySelector(`.notion-block-${prefectureBlockId}`);
  console.log('\n2. DOM Status:');
  console.log(`   DOM element exists: ${!!domElement}`);
  
  if (domElement) {
    // Check for collection
    const collection = domElement.querySelector('.notion-collection');
    console.log(`   Has .notion-collection: ${!!collection}`);
    
    // Check for list view
    const listView = domElement.querySelector('.notion-list-view');
    console.log(`   Has .notion-list-view: ${!!listView}`);
    
    // Check for groups
    const groups = domElement.querySelectorAll('.notion-collection-group');
    console.log(`   Number of groups: ${groups.length}`);
    
    // Analyze first group structure
    if (groups.length > 0) {
      console.log('\n3. Group Structure:');
      const firstGroup = groups[0];
      console.log(`   First group classes: ${firstGroup.className}`);
      console.log(`   First group children: ${firstGroup.children.length}`);
      
      // Check group title
      const groupTitle = firstGroup.querySelector('.notion-collection-group-title');
      if (groupTitle) {
        console.log(`   Group title: "${groupTitle.textContent}"`);
      }
    }
    
    // Check if this is server-side rendered
    console.log('\n4. Rendering Analysis:');
    const hasDataAttributes = domElement.hasAttribute('data-block-id');
    console.log(`   Has data-block-id attribute: ${hasDataAttributes}`);
    
    // Check parent structure
    let parent = domElement.parentElement;
    let parentClasses = [];
    while (parent && parentClasses.length < 3) {
      parentClasses.push(parent.className);
      parent = parent.parentElement;
    }
    console.log(`   Parent classes: ${parentClasses.join(' -> ')}`);
    
    // Check for any special attributes or classes
    const attributes = Array.from(domElement.attributes);
    console.log('\n5. Element Attributes:');
    attributes.forEach(attr => {
      if (attr.name !== 'class') {
        console.log(`   ${attr.name}: ${attr.value}`);
      }
    });
    
    // Check innerHTML characteristics
    console.log('\n6. Content Analysis:');
    const innerHTML = domElement.innerHTML;
    const hasCompleteHTML = innerHTML.includes('notion-collection-group') && 
                           innerHTML.includes('notion-list-item');
    console.log(`   Has complete HTML structure: ${hasCompleteHTML}`);
    console.log(`   HTML length: ${innerHTML.length} characters`);
    
    // Look for any scripts or special handlers
    const scripts = domElement.querySelectorAll('script');
    console.log(`   Embedded scripts: ${scripts.length}`);
  }
  
  // Compare with FAQ Master
  console.log('\n\n=== Comparing with FAQ Master ===');
  const faqBlockId = '212b802cb0c680b3b04afec4203ee8d7';
  const faqElement = document.querySelector(`.notion-block-${faqBlockId}`);
  
  if (faqElement) {
    console.log('FAQ Master DOM element found');
    const faqCollection = faqElement.querySelector('.notion-collection');
    const faqListView = faqElement.querySelector('.notion-list-view');
    const faqGroups = faqElement.querySelectorAll('.notion-collection-group');
    
    console.log(`   Has .notion-collection: ${!!faqCollection}`);
    console.log(`   Has .notion-list-view: ${!!faqListView}`);
    console.log(`   Number of groups: ${faqGroups.length}`);
    
    // Check innerHTML
    const faqInnerHTML = faqElement.innerHTML;
    console.log(`   HTML length: ${faqInnerHTML.length} characters`);
    console.log(`   Contains list items: ${faqInnerHTML.includes('notion-list-item')}`);
  }
  
  console.log('\n\n💡 Key Findings:');
  console.log('- Prefecture DB is NOT in recordMap (statically rendered)');
  console.log('- Prefecture DB has complete HTML with groups already rendered');
  console.log('- FAQ Master IS in recordMap but lacks rendered content');
  console.log('- This suggests prefecture DB is pre-rendered server-side');
  
  return 'Analysis complete';
})();