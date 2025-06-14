import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';
import { getBlockCollectionId } from 'notion-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { pageId, blockId } = req.query;
    
    if (!pageId || typeof pageId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'ページIDが指定されていません' 
      });
    }

    const notion = new NotionAPI({
      authToken: process.env.NOTION_TOKEN,
      activeUser: process.env.NOTION_ACTIVE_USER,
      userTimeZone: 'Asia/Tokyo'
    });

    console.log('🔍 Investigating FAQ Master on page:', pageId);
    
    // ページ全体のrecordMapを取得
    const recordMap = await notion.getPage(pageId);
    
    // FAQマスターに関連するブロックを探す
    const faqBlocks = [];
    
    for (const [id, blockData] of Object.entries(recordMap.block || {})) {
      const block = blockData.value;
      if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
        const collectionId = block.collection_id || getBlockCollectionId(block, recordMap);
        const collection = recordMap.collection?.[collectionId]?.value;
        const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
        
        // FAQマスターかどうかを判定
        if (collectionName.includes('FAQ') || collectionName.includes('よくある')) {
          console.log(`✅ Found FAQ block: ${collectionName} (${id})`);
          
          // ビュー情報を詳しく取得
          const viewIds = block.view_ids || [];
          const viewDetails = [];
          
          for (const viewId of viewIds) {
            const view = recordMap.collection_view?.[viewId]?.value;
            
            // コレクションデータを取得してアイテム数を確認
            let itemCount = 0;
            let sampleItems = [];
            
            try {
              const collectionData = await notion.getCollectionData(
                collectionId,
                viewId,
                {
                  limit: 10,
                  searchQuery: '',
                  userTimeZone: 'Asia/Tokyo'
                }
              );
              
              itemCount = collectionData.result?.total || 0;
              const blockIds = collectionData.result?.blockIds || [];
              
              // サンプルアイテムを取得
              for (let i = 0; i < Math.min(3, blockIds.length); i++) {
                const itemBlock = collectionData.recordMap?.block?.[blockIds[i]]?.value;
                if (itemBlock) {
                  sampleItems.push({
                    id: blockIds[i],
                    title: itemBlock.properties?.title?.[0]?.[0] || 'Untitled',
                    properties: Object.entries(collection?.schema || {}).reduce((acc, [propId, prop]: [string, any]) => {
                      const value = itemBlock.properties?.[propId];
                      acc[prop.name] = value?.[0]?.[0] || null;
                      return acc;
                    }, {} as any)
                  });
                }
              }
            } catch (err) {
              console.error(`Error fetching collection data for view ${viewId}:`, err);
            }
            
            viewDetails.push({
              id: viewId,
              name: view?.name || 'Unnamed View',
              type: view?.type,
              hasPropertyFilters: !!view?.format?.property_filters,
              hasQuery2Filters: !!view?.query2?.filter,
              propertyFilters: view?.format?.property_filters || [],
              query2: view?.query2,
              itemCount,
              sampleItems
            });
          }
          
          // コレクションクエリの情報も取得
          const viewId = viewIds[0];
          const collectionQuery = recordMap.collection_query?.[collectionId]?.[viewId];
          
          faqBlocks.push({
            blockId: id,
            blockType: block.type,
            collectionId,
            collectionName,
            viewIds,
            viewDetails,
            schema: Object.entries(collection?.schema || {}).map(([propId, prop]: [string, any]) => ({
              id: propId,
              name: prop.name,
              type: prop.type
            })),
            queryResult: collectionQuery ? {
              total: collectionQuery.total,
              blockIdsCount: collectionQuery.collection_group_results?.blockIds?.length || 0,
              hasMore: collectionQuery.collection_group_results?.hasMore
            } : null,
            blockDetails: {
              parent_id: block.parent_id,
              parent_table: block.parent_table,
              alive: block.alive,
              created_time: block.created_time,
              last_edited_time: block.last_edited_time
            }
          });
        }
      }
    }
    
    // 特定のblockIdが指定されている場合、そのブロックの更に詳しい情報を取得
    let targetBlockAnalysis = null;
    if (blockId && typeof blockId === 'string') {
      const targetBlock = recordMap.block?.[blockId]?.value;
      if (targetBlock) {
        targetBlockAnalysis = {
          raw_block: targetBlock,
          // recordMapの関連部分も含める
          related_collections: Object.keys(recordMap.collection || {}),
          related_views: Object.keys(recordMap.collection_view || {}),
          related_queries: Object.keys(recordMap.collection_query || {})
        };
      }
    }
    
    return res.status(200).json({
      success: true,
      pageId,
      faqBlocksFound: faqBlocks.length,
      faqBlocks,
      targetBlockAnalysis,
      summary: {
        totalCollections: Object.keys(recordMap.collection || {}).length,
        totalViews: Object.keys(recordMap.collection_view || {}).length,
        totalBlocks: Object.keys(recordMap.block || {}).length
      }
    });
    
  } catch (error) {
    console.error('Error investigating FAQ Master:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'FAQ Master調査中にエラーが発生しました' 
    });
  }
}