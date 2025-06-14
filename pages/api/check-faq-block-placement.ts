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
    const faqBlockId = '212b802c-b0c6-80be-aa3a-e91428cbde58'; // スクリーンショットから取得したブロックID
    
    console.log('📋 Checking FAQ block placement in CafeKinesi page');
    
    const recordMap = await notion.getPage(pageId);
    
    // FAQブロックを探す
    const faqBlock = recordMap.block?.[faqBlockId]?.value;
    
    if (!faqBlock) {
      // 別のIDで探す
      const alternativeBlockId = '212b802c-b0c6-80ea-b7ed-ef4459f38819';
      const altBlock = recordMap.block?.[alternativeBlockId]?.value;
      
      return res.status(200).json({
        success: true,
        primaryBlockId: faqBlockId,
        primaryBlockFound: false,
        alternativeBlockId,
        alternativeBlockFound: !!altBlock,
        alternativeBlockDetails: altBlock ? {
          type: altBlock.type,
          collectionId: altBlock.collection_id,
          parentId: altBlock.parent_id,
          parentTable: altBlock.parent_table,
          viewIds: altBlock.view_ids
        } : null
      });
    }
    
    // FAQブロックの親ブロックを確認
    const parentBlock = faqBlock.parent_id ? recordMap.block?.[faqBlock.parent_id]?.value : null;
    
    // ビューの詳細を取得
    const viewDetails = (faqBlock.view_ids || []).map((viewId: string) => {
      const view = recordMap.collection_view?.[viewId]?.value;
      return {
        viewId,
        name: view?.name || 'Unnamed',
        type: view?.type || 'unknown',
        query: view?.query2 || {}
      };
    });
    
    const result = {
      success: true,
      blockId: faqBlockId,
      blockFound: true,
      blockDetails: {
        type: faqBlock.type,
        collectionId: faqBlock.collection_id,
        parentId: faqBlock.parent_id,
        parentTable: faqBlock.parent_table,
        viewIds: faqBlock.view_ids,
        alive: faqBlock.alive !== false,
        createdTime: faqBlock.created_time ? new Date(faqBlock.created_time).toLocaleString() : 'Unknown',
        lastEditedTime: faqBlock.last_edited_time ? new Date(faqBlock.last_edited_time).toLocaleString() : 'Unknown'
      },
      parentBlock: parentBlock ? {
        id: faqBlock.parent_id,
        type: parentBlock.type,
        title: parentBlock.properties?.title?.[0]?.[0] || 'Untitled'
      } : null,
      views: viewDetails,
      collectionName: recordMap.collection?.[faqBlock.collection_id]?.value?.name?.[0]?.[0] || 'Unknown'
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