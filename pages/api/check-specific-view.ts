import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    const pageId = '1ceb802cb0c680f29369dba86095fb38'; // CafeKinesiページ
    const targetViewId = '212b802cb0c680eab7edef4459f38819'; // TOPページのビューID
    
    console.log('📋 Checking specific view in CafeKinesi page');
    
    const recordMap = await notion.getPage(pageId);
    
    // 指定されたIDでブロックを探す
    const targetBlock = recordMap.block?.[targetViewId]?.value;
    
    // コレクションビューとしても探す
    const targetView = recordMap.collection_view?.[targetViewId]?.value;
    
    // このIDを持つすべてのブロックを探す
    const blocksWithCollection: any[] = [];
    Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
      const block = (blockData as any).value;
      if (block?.view_ids?.includes(targetViewId) || blockId === targetViewId) {
        blocksWithCollection.push({
          blockId,
          type: block.type,
          collectionId: block.collection_id,
          viewIds: block.view_ids,
          parentId: block.parent_id,
          alive: block.alive !== false
        });
      }
    });
    
    // CafeKinesiページ内のすべてのFAQ関連ブロックを探す
    const faqRelatedBlocks: any[] = [];
    Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
      const block = (blockData as any).value;
      if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
        const collectionId = block.collection_id;
        const collection = recordMap.collection?.[collectionId]?.value;
        const collectionName = collection?.name?.[0]?.[0] || '';
        
        if (collectionName.includes('FAQ') || blockId === targetViewId) {
          faqRelatedBlocks.push({
            blockId,
            type: block.type,
            collectionId,
            collectionName,
            viewIds: block.view_ids,
            parentId: block.parent_id,
            alive: block.alive !== false,
            isTargetView: blockId === targetViewId
          });
        }
      }
    });
    
    const result = {
      success: true,
      targetViewId,
      blockFound: !!targetBlock,
      viewFound: !!targetView,
      blockDetails: targetBlock ? {
        type: targetBlock.type,
        collectionId: targetBlock.collection_id,
        viewIds: targetBlock.view_ids,
        parentId: targetBlock.parent_id,
        alive: targetBlock.alive !== false
      } : null,
      viewDetails: targetView ? {
        name: targetView.name,
        type: targetView.type,
        collectionId: targetView.collection_id,
        query: targetView.query2
      } : null,
      blocksReferencingThisView: blocksWithCollection,
      allFaqRelatedBlocks: faqRelatedBlocks
    };
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}