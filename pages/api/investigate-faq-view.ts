// FAQマスターのビューIDを詳細に調査するAPIエンドポイント
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
    const pageId = '1ceb802cb0c680f29369dba86095fb38';
    
    // FAQマスターのデータベースID
    const faqMasterDatabaseId = '212b802c-b0c6-80ea-b7ed-ef4459f38819';
    
    // 調査対象のビューID（FAQマスターのリンクドビュー）
    const targetViewId = '212b802c-b0c6-80ff-9c41-000cec7d8204';
    
    console.log('📋 Fetching page data and FAQ master database');
    
    const recordMap = await notion.getPage(pageId);
    
    // FAQマスターデータベースのコレクション情報を取得
    const faqMasterCollection = recordMap.collection?.[faqMasterDatabaseId]?.value;
    const faqMasterSchema = faqMasterCollection?.schema || {};
    
    // スキーマの詳細を整理
    const schemaDetails = Object.entries(faqMasterSchema).map(([propId, prop]: [string, any]) => ({
      id: propId,
      name: prop.name,
      type: prop.type,
      options: prop.options,
      isPublic: prop.name === '公開'
    }));
    
    // ターゲットビューの詳細情報を取得
    const targetViewInfo = recordMap.collection_view?.[targetViewId]?.value;
    
    // FAQマスターデータベースの全ビューを取得
    const faqMasterViews: any[] = [];
    Object.entries(recordMap.collection_view || {}).forEach(([viewId, viewData]) => {
      const view = (viewData as any).value;
      const collectionId = view?.collection_id || view?.parent_id;
      
      if (collectionId === faqMasterDatabaseId) {
        faqMasterViews.push({
          viewId,
          viewName: view?.name || 'Unnamed',
          viewType: view?.type,
          query2: view?.query2,
          format: view?.format,
          isTargetView: viewId === targetViewId
        });
      }
    });
    
    // ページ内のリンクドデータベースビューを探す
    const linkedFAQBlocks: any[] = [];
    Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
      const block = (blockData as any).value;
      
      if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
        const collectionId = block.collection_id;
        
        // FAQマスターへのリンクかチェック
        if (collectionId === faqMasterDatabaseId || block.view_ids?.includes(targetViewId)) {
          linkedFAQBlocks.push({
            blockId,
            blockType: block.type,
            collectionId,
            viewIds: block.view_ids || [],
            parentId: block.parent_id,
            alive: block.alive !== false
          });
        }
      }
    });
    
    // targetViewIdでデータを取得してみる
    let viewData = null;
    let viewError = null;
    
    try {
      // ビューに関連するコレクションIDを特定
      let associatedCollectionId = targetViewInfo?.collection_id || targetViewInfo?.parent_id;
      
      // もしコレクションIDがない場合は、ブロックから探す
      if (!associatedCollectionId) {
        const linkedBlock = linkedFAQBlocks.find(b => b.viewIds.includes(targetViewId));
        if (linkedBlock) {
          associatedCollectionId = linkedBlock.collectionId;
        }
      }
      
      if (associatedCollectionId) {
        const collectionData = await notion.getCollectionData(
          associatedCollectionId,
          targetViewId,
          {
            limit: 10,
            searchQuery: '',
            userTimeZone: 'Asia/Tokyo'
          }
        );
        
        viewData = {
          collectionId: associatedCollectionId,
          totalItems: collectionData.result?.blockIds?.length || 0,
          hasData: (collectionData.result?.blockIds?.length || 0) > 0,
          sampleItems: []
        };
        
        // サンプルアイテムを取得
        if (collectionData.result?.blockIds) {
          for (const blockId of collectionData.result.blockIds.slice(0, 5)) {
            const block = collectionData.recordMap?.block?.[blockId]?.value;
            if (block) {
              viewData.sampleItems.push({
                id: blockId,
                title: block.properties?.title?.[0]?.[0] || 'Untitled',
                properties: Object.keys(block.properties || {})
              });
            }
          }
        }
      }
    } catch (error) {
      viewError = error instanceof Error ? error.message : 'Failed to fetch view data';
    }
    
    // 他のコンテンツデータベースのビュー設定と比較
    const otherDatabaseViews: any[] = [];
    Object.entries(recordMap.collection_view || {}).forEach(([viewId, viewData]) => {
      const view = (viewData as any).value;
      const collectionId = view?.collection_id || view?.parent_id;
      
      if (collectionId && collectionId !== faqMasterDatabaseId) {
        const collection = recordMap.collection?.[collectionId]?.value;
        const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
        
        if (collectionName.includes('カフェキネシ') || collectionName.includes('コンテンツ')) {
          otherDatabaseViews.push({
            viewId,
            collectionId,
            collectionName,
            viewName: view?.name || 'Unnamed',
            viewType: view?.type,
            hasFilter: !!view?.query2?.filter,
            filterDetails: view?.query2?.filter
          });
        }
      }
    });
    
    const result = {
      success: true,
      targetViewId,
      faqMasterDatabaseId,
      
      faqMasterInfo: {
        exists: !!faqMasterCollection,
        name: faqMasterCollection?.name?.[0]?.[0] || 'Unknown',
        schemaPropertiesCount: Object.keys(faqMasterSchema).length,
        schema: schemaDetails
      },
      
      targetViewDetails: {
        exists: !!targetViewInfo,
        viewName: targetViewInfo?.name || 'Unknown',
        viewType: targetViewInfo?.type,
        collectionId: targetViewInfo?.collection_id || targetViewInfo?.parent_id,
        query2: targetViewInfo?.query2,
        format: targetViewInfo?.format
      },
      
      faqMasterViews: {
        count: faqMasterViews.length,
        views: faqMasterViews
      },
      
      linkedFAQBlocks: {
        count: linkedFAQBlocks.length,
        blocks: linkedFAQBlocks
      },
      
      viewDataResult: viewData || { error: viewError },
      
      comparison: {
        otherDatabaseViewsCount: otherDatabaseViews.length,
        otherDatabaseViews
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