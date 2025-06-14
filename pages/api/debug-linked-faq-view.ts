// CafeKinesiページ内のFAQリンクドデータベースビューを調査
import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // CafeKinesiページのID
    const cafeKinesiPageId = '1ceb802cb0c680f29369dba86095fb38';
    
    console.log('📋 Fetching CafeKinesi page with FAQ linked view');
    
    const recordMap = await notion.getPage(cafeKinesiPageId);
    
    // FAQリンクドデータベースビューのブロックを探す
    const linkedFAQBlocks: any[] = [];
    
    Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
      const block = (blockData as any).value;
      
      // 特定のブロックIDのビューを調査
      if (blockId === '212b802c-b0c6-80be-aa3a-e91428cbde58') {
        console.log('Found FAQ linked view block:', blockId);
        
        // このブロックのコレクションIDを確認
        const viewId = block.view_ids?.[0];
        const collectionView = recordMap.collection_view?.[viewId]?.value;
        
        linkedFAQBlocks.push({
          blockId,
          type: block.type,
          viewIds: block.view_ids,
          collectionId: block.collection_id,
          viewDetails: collectionView ? {
            viewId,
            viewName: collectionView.name || 'Unnamed',
            viewType: collectionView.type,
            hasFilters: !!collectionView.query2?.filter,
            filters: collectionView.query2?.filter
          } : null
        });
      }
    });
    
    // FAQリンクドビューのデータを取得
    const viewDataResults: any[] = [];
    
    for (const linkedBlock of linkedFAQBlocks) {
      if (linkedBlock.viewDetails) {
        try {
          // ビューを通じてコレクションIDを取得
          const viewId = linkedBlock.viewDetails.viewId;
          const collectionView = recordMap.collection_view?.[viewId]?.value;
          const collectionId = collectionView?.collection_id || collectionView?.parent_id;
          
          if (collectionId) {
            // コレクションデータを取得
            const collectionData = await notion.getCollectionData(
              collectionId,
              viewId,
              {
                limit: 20,
                searchQuery: '',
                userTimeZone: 'Asia/Tokyo'
              }
            );
            
            const items = [];
            if (collectionData.result?.blockIds) {
              // スキーマを取得
              const collection = recordMap.collection?.[collectionId]?.value || 
                               collectionData.recordMap?.collection?.[collectionId]?.value;
              const schema = collection?.schema || {};
              
              // 公開プロパティのIDを探す
              let publicPropId = null;
              Object.entries(schema).forEach(([id, prop]: [string, any]) => {
                if (prop.name === '公開' && prop.type === 'checkbox') {
                  publicPropId = id;
                }
              });
              
              for (const blockId of collectionData.result.blockIds.slice(0, 10)) {
                const block = collectionData.recordMap?.block?.[blockId]?.value;
                if (block) {
                  const isPublic = publicPropId ? 
                    block.properties?.[publicPropId]?.[0]?.[0] === 'Yes' : null;
                  
                  items.push({
                    id: blockId,
                    title: block.properties?.title?.[0]?.[0] || 'Untitled',
                    category: block.properties?.['\\y^V']?.[0]?.[0] || 'その他',
                    isPublic,
                    properties: Object.keys(block.properties || {})
                  });
                }
              }
            }
            
            viewDataResults.push({
              viewId,
              collectionId,
              collectionName: recordMap.collection?.[collectionId]?.value?.name?.[0]?.[0] || 
                            collectionData.recordMap?.collection?.[collectionId]?.value?.name?.[0]?.[0] || 
                            'Unknown',
              totalItems: collectionData.result?.blockIds?.length || 0,
              publicPropertyId: publicPropId,
              items
            });
          }
        } catch (error) {
          viewDataResults.push({
            viewId: linkedBlock.viewDetails.viewId,
            error: error instanceof Error ? error.message : 'Failed to fetch data'
          });
        }
      }
    }
    
    // ビューIDから直接データを取得してみる
    const directViewId = '212b802c-b0c6-80ff-9c41-000cec7d8204';
    let directViewData = null;
    
    try {
      // ビューの情報を取得
      const viewInfo = recordMap.collection_view?.[directViewId]?.value;
      if (viewInfo) {
        const collectionId = viewInfo.collection_id || viewInfo.parent_id;
        
        if (collectionId) {
          const collectionData = await notion.getCollectionData(
            collectionId,
            directViewId,
            {
              limit: 10,
              searchQuery: '',
              userTimeZone: 'Asia/Tokyo'
            }
          );
          
          directViewData = {
            viewId: directViewId,
            collectionId,
            viewInfo: {
              name: viewInfo.name,
              type: viewInfo.type,
              hasFilters: !!viewInfo.query2?.filter
            },
            totalItems: collectionData.result?.blockIds?.length || 0,
            hasData: (collectionData.result?.blockIds?.length || 0) > 0
          };
        }
      }
    } catch (error) {
      directViewData = {
        viewId: directViewId,
        error: error instanceof Error ? error.message : 'Failed to fetch'
      };
    }
    
    const result = {
      success: true,
      pageId: cafeKinesiPageId,
      linkedFAQBlocks,
      viewDataResults,
      directViewData,
      summary: {
        linkedFAQBlocksFound: linkedFAQBlocks.length,
        totalItemsInViews: viewDataResults.reduce((sum, view) => sum + (view.totalItems || 0), 0)
      }
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