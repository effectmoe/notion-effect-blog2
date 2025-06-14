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

    console.log('Fetching page:', pageId);
    
    // ページ全体のrecordMapを取得
    const recordMap = await notion.getPage(pageId);
    
    // collection_viewとcollection_view_pageブロックを探す
    const collectionBlocks = [];
    
    for (const [id, blockData] of Object.entries(recordMap.block || {})) {
      const block = blockData.value;
      if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
        const collectionId = block.collection_id || getBlockCollectionId(block, recordMap);
        const collection = recordMap.collection?.[collectionId]?.value;
        const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
        
        // ビュー情報を取得
        const viewIds = block.view_ids || [];
        const views = viewIds.map((viewId: string) => {
          const view = recordMap.collection_view?.[viewId]?.value;
          return {
            id: viewId,
            name: view?.name || 'Unnamed View',
            type: view?.type,
            format: view?.format
          };
        });
        
        collectionBlocks.push({
          id,
          type: block.type,
          collection_id: collectionId,
          collection_name: collectionName,
          view_ids: viewIds,
          views: views,
          parent_id: block.parent_id,
          parent_table: block.parent_table,
          alive: block.alive,
          created_time: block.created_time,
          last_edited_time: block.last_edited_time
        });
      }
    }
    
    // 特定のblockIdが指定されている場合、そのブロックの詳細情報を取得
    let targetBlockDetail = null;
    if (blockId && typeof blockId === 'string') {
      const targetBlock = recordMap.block?.[blockId]?.value;
      if (targetBlock) {
        const collectionId = targetBlock.collection_id || getBlockCollectionId(targetBlock, recordMap);
        const collection = recordMap.collection?.[collectionId]?.value;
        
        // コレクションのクエリ情報を取得
        const viewId = targetBlock.view_ids?.[0];
        const collectionQuery = recordMap.collection_query?.[collectionId]?.[viewId];
        
        targetBlockDetail = {
          block: {
            id: blockId,
            type: targetBlock.type,
            collection_id: collectionId,
            view_ids: targetBlock.view_ids,
            parent_id: targetBlock.parent_id,
            parent_table: targetBlock.parent_table
          },
          collection: {
            id: collectionId,
            name: collection?.name?.[0]?.[0],
            schema: collection?.schema
          },
          view: viewId ? recordMap.collection_view?.[viewId]?.value : null,
          query_result: collectionQuery ? {
            total: collectionQuery.total,
            block_count: collectionQuery.collection_group_results?.blockIds?.length || 0,
            has_more: collectionQuery.collection_group_results?.hasMore
          } : null
        };
      }
    }
    
    return res.status(200).json({
      success: true,
      page_id: pageId,
      collection_blocks: collectionBlocks,
      total_collection_blocks: collectionBlocks.length,
      target_block_detail: targetBlockDetail,
      collections_count: Object.keys(recordMap.collection || {}).length,
      collection_views_count: Object.keys(recordMap.collection_view || {}).length
    });
    
  } catch (error) {
    console.error('Error debugging FAQ block:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'デバッグ中にエラーが発生しました' 
    });
  }
}