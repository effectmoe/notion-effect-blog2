import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_TOKEN_V2,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // CafeKinesiページのID
    const pageId = '1ceb802cb0c680f29369dba86095fb38';
    
    console.log('📋 Fetching CafeKinesi page for FAQ views analysis');
    
    const recordMap = await notion.getPage(pageId);
    
    // FAQマスターのリンクドビューブロックを探す
    const faqBlock = Object.entries(recordMap.block || {}).find(([blockId, blockData]) => {
      const block = (blockData as any).value;
      return block?.collection_id === '212b802c-b0c6-8046-b4ee-000b2833619c';
    });
    
    if (!faqBlock) {
      return res.status(404).json({ error: 'FAQ linked database block not found' });
    }
    
    const [blockId, blockData] = faqBlock;
    const block = (blockData as any).value;
    
    // ビューの詳細を取得
    const viewDetails = block.view_ids?.map((viewId: string) => {
      const view = recordMap.collection_view?.[viewId]?.value;
      return {
        viewId,
        name: view?.name || 'Unnamed',
        type: view?.type || 'unknown',
        query: view?.query2 || {},
        filter: view?.query2?.filter || null,
        sort: view?.query2?.sort || null,
        aggregations: view?.query2?.aggregations || null,
        properties: view?.format?.gallery_properties || view?.format?.table_properties || []
      };
    }) || [];
    
    // コレクションのスキーマも取得
    const collection = recordMap.collection?.[block.collection_id]?.value;
    const schema = collection?.schema || {};
    
    const result = {
      success: true,
      blockId,
      collectionId: block.collection_id,
      collectionName: collection?.name?.[0]?.[0] || 'Unknown',
      schema: Object.entries(schema).map(([propId, prop]: [string, any]) => ({
        id: propId,
        name: prop.name,
        type: prop.type
      })),
      views: viewDetails,
      rawBlock: block
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