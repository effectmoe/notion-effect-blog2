// Deep dive into FAQ Master DOM structure
(function() {
  console.log('\n🔍 FAQ Master DOM Structure Analysis\n');
  
  const faqMasterId = '212b802cb0c680b3b04afec4203ee8d7';
  const faqElement = document.querySelector(`.notion-block-${faqMasterId}`);
  
  if (!faqElement) {
    console.error('❌ FAQ Master block not found');
    return;
  }
  
  console.log('✅ FAQ Master block found');
  console.log('Element tag:', faqElement.tagName);
  console.log('Element classes:', faqElement.className);
  
  // Check inner HTML structure
  console.log('\n📄 Inner HTML preview:');
  console.log(faqElement.innerHTML.substring(0, 500) + '...');
  
  // Check if it's just an empty container
  if (faqElement.innerHTML.trim() === '') {
    console.log('\n⚠️ FAQ Master block is empty!');
    
    // Check if there's a placeholder or error message
    const placeholder = faqElement.querySelector('.notion-collection-placeholder');
    const error = faqElement.querySelector('.notion-collection-error');
    
    if (placeholder) {
      console.log('Found placeholder:', placeholder.textContent);
    }
    if (error) {
      console.log('Found error:', error.textContent);
    }
  }
  
  // Check parent structure
  console.log('\n🌳 Parent structure:');
  let parent = faqElement.parentElement;
  let depth = 0;
  while (parent && depth < 5) {
    console.log(`  ${' '.repeat(depth * 2)}Parent ${depth}: ${parent.className}`);
    parent = parent.parentElement;
    depth++;
  }
  
  // Look for any collection-related elements nearby
  console.log('\n🔎 Searching for collection elements in siblings...');
  const siblings = faqElement.parentElement?.children || [];
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling.className.includes('collection')) {
      console.log(`  Sibling ${i}: ${sibling.className}`);
    }
  }
  
  // Check if React component is attached
  const reactKeys = Object.keys(faqElement).filter(key => key.startsWith('__react'));
  console.log('\n⚛️ React integration:');
  console.log('React keys found:', reactKeys.length > 0 ? reactKeys : 'None');
  
  // Check data attributes
  console.log('\n📊 Data attributes:');
  Array.from(faqElement.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      console.log(`  ${attr.name}: ${attr.value}`);
    }
  });
  
  // Check for any notion-specific attributes
  console.log('\n🎯 Notion-specific checks:');
  console.log('Has notion-block class:', faqElement.classList.contains('notion-block'));
  console.log('Has block ID in class:', Array.from(faqElement.classList).some(cls => cls.match(/notion-block-[a-f0-9-]+/)));
  
  // Try to find the actual collection view in a different location
  console.log('\n🔍 Searching entire page for FAQ Master collection...');
  const allCollections = document.querySelectorAll('.notion-collection');
  let faqCollection = null;
  
  allCollections.forEach((col, index) => {
    // Check if this collection might be FAQ Master
    const title = col.querySelector('.notion-collection-header-title')?.textContent;
    const hasListView = col.querySelector('.notion-list-view');
    const items = col.querySelectorAll('.notion-list-item');
    
    // Look for FAQ-specific content
    const hasFAQContent = Array.from(items).some(item => {
      const text = item.textContent || '';
      return text.includes('カフェキネシ') || text.includes('講座') || text.includes('受講');
    });
    
    if (hasFAQContent || title?.includes('FAQ')) {
      console.log(`\n📦 Potential FAQ collection found (index ${index}):`);
      console.log('  Title:', title || 'No title');
      console.log('  Has list view:', !!hasListView);
      console.log('  Item count:', items.length);
      console.log('  Parent classes:', col.parentElement?.className);
      faqCollection = col;
    }
  });
  
  if (faqCollection) {
    console.log('\n✅ Found a collection that might be FAQ Master');
    console.log('Distance from FAQ block:', 
      faqCollection.compareDocumentPosition(faqElement) & Node.DOCUMENT_POSITION_CONTAINS ? 'Inside FAQ block' : 'Outside FAQ block'
    );
  }
  
  return 'Analysis complete';
})();