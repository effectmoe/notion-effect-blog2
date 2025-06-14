import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_TOKEN,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });

  try {
    // CafeKinesiページを取得
    const pageId = '1ceb802cb0c680f29369dba86095fb38';
    const recordMap = await notion.getPage(pageId);
    
    // すべてのcollection_viewブロックを探す
    const collectionViews = [];
    
    for (const [blockId, blockData] of Object.entries(recordMap.block)) {
      const block = (blockData as any).value;
      if (block && block.type === 'collection_view') {
        const viewId = block.view_ids?.[0];
        const view = viewId ? recordMap.collection_view[viewId]?.value : null;
        
        // タイトルを取得（ヘッダーブロックから）
        let title = 'Unknown';
        if (block.parent_id) {
          // 前のブロックを探す（通常はヘッダー）
          const blocks = Object.values(recordMap.block).map((b: any) => b.value);
          const parentIndex = blocks.findIndex(b => b.id === block.parent_id);
          if (parentIndex > 0) {
            // 同じ親を持つヘッダーブロックを探す
            for (let i = parentIndex - 1; i >= 0; i--) {
              const prevBlock = blocks[i];
              if (prevBlock && prevBlock.parent_id === block.parent_id && 
                  (prevBlock.type === 'header' || prevBlock.type === 'sub_header')) {
                title = prevBlock.properties?.title?.[0]?.[0] || title;
                break;
              }
            }
          }
        }
        
        // ブロックIDから判別
        if (blockId === '212b802c-b0c6-80be-aa3a-e91428cbde58') {
          title = 'FAQマスター';
        } else if (blockId === '20db802c-b0c6-80e2-93d4-fc46bf2dd823') {
          title = 'カフェキネシコンテンツ';
        } else if (blockId === '20fb802c-b0c6-8027-945b-eabe5f521e5a') {
          title = '公認インストラクター';
        }
        
        const collectionId = block.collection_id || view?.format?.collection_pointer?.id;
        
        collectionViews.push({
          title,
          blockId,
          type: block.type,
          hasCollectionId: !!block.collection_id,
          hasFormat: !!block.format,
          collectionIdLocation: block.collection_id ? 'block' : (view?.format?.collection_pointer?.id ? 'view' : 'none'),
          collectionId,
          viewType: view?.type,
          viewName: view?.name
        });
      }
    }
    
    // 結果を表示順にソート
    collectionViews.sort((a, b) => {
      const order = ['カフェキネシコンテンツ', '公認インストラクター', 'FAQマスター'];
      return order.indexOf(a.title) - order.indexOf(b.title);
    });
    
    return res.status(200).json({
      success: true,
      databases: collectionViews,
      summary: {
        total: collectionViews.length,
        withBlockCollectionId: collectionViews.filter(v => v.hasCollectionId).length,
        withViewCollectionId: collectionViews.filter(v => v.collectionIdLocation === 'view').length,
        withoutCollectionId: collectionViews.filter(v => v.collectionIdLocation === 'none').length
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}