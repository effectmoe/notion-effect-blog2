import { ExtendedRecordMap } from 'notion-types';

export function debugCollectionView(recordMap: ExtendedRecordMap, blockId: string) {
  const block = recordMap.block[blockId];
  
  if (!block || !block.value) {
    console.log(`Block ${blockId} not found`);
    return;
  }

  console.log(`\n=== Collection View Debug for ${blockId} ===`);
  console.log('Block type:', block.value.type);
  
  if (block.value.type === 'collection_view') {
    const collectionId = (block.value as any).collection_id;
    const viewIds = (block.value as any).view_ids || [];
    
    console.log('Collection ID:', collectionId);
    console.log('View IDs:', viewIds);
    
    // Check collection
    if (collectionId && recordMap.collection && recordMap.collection[collectionId]) {
      const collection = recordMap.collection[collectionId].value;
      console.log('Collection name:', collection.name);
      console.log('Collection schema keys:', Object.keys(collection.schema || {}));
    } else {
      console.log('Collection not found in recordMap');
    }
    
    // Check views
    viewIds.forEach((viewId: string) => {
      if (recordMap.collection_view && recordMap.collection_view[viewId]) {
        const view = recordMap.collection_view[viewId].value;
        console.log(`\nView ${viewId}:`);
        console.log('- Type:', view.type);
        console.log('- Name:', view.name);
        console.log('- Has format:', !!view.format);
        if (view.format) {
          console.log('- Has filter:', !!(view.format as any).filter);
          console.log('- Gallery properties:', (view.format as any).gallery_properties);
        }
      } else {
        console.log(`View ${viewId} not found in recordMap`);
      }
    });
    
    // Check collection query
    const hasQuery = !!(recordMap.collection_query && recordMap.collection_query[collectionId]);
    console.log('\nHas collection_query:', hasQuery);
    
    if (hasQuery) {
      const queries = recordMap.collection_query[collectionId];
      Object.keys(queries).forEach(queryKey => {
        const query = queries[queryKey];
        console.log(`Query ${queryKey}:`, {
          hasBlockIds: !!(query.collection_group_results?.blockIds),
          blockCount: query.collection_group_results?.blockIds?.length || 0,
          total: query.total
        });
      });
    }
  }
  
  console.log('=================================\n');
}