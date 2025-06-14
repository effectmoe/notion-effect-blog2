import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { collectionId, viewId } = req.query;
    
    if (!collectionId || typeof collectionId !== 'string' || !viewId || typeof viewId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'コレクションIDとビューIDが必要です' 
      });
    }

    const notion = new NotionAPI({
      authToken: process.env.NOTION_TOKEN,
      activeUser: process.env.NOTION_ACTIVE_USER,
      userTimeZone: 'Asia/Tokyo'
    });

    console.log('Fetching collection data:', { collectionId, viewId });
    
    // コレクションデータを取得
    const collectionData = await notion.getCollectionData(
      collectionId,
      viewId,
      {
        limit: 50, // 最初の50件を取得
        searchQuery: '',
        userTimeZone: 'Asia/Tokyo'
      }
    );
    
    // recordMapからコレクション情報を取得
    const collection = collectionData.recordMap?.collection?.[collectionId]?.value;
    const view = collectionData.recordMap?.collection_view?.[viewId]?.value;
    
    // スキーマ情報を整理
    const schema = collection?.schema || {};
    const schemaInfo = Object.entries(schema).map(([propId, prop]: [string, any]) => ({
      id: propId,
      name: prop.name,
      type: prop.type,
      options: prop.options
    }));
    
    // ブロックデータを整理（最初の5件のみ）
    const blocks = [];
    const blockIds = collectionData.result?.blockIds || [];
    
    for (let i = 0; i < Math.min(5, blockIds.length); i++) {
      const blockId = blockIds[i];
      const block = collectionData.recordMap?.block?.[blockId]?.value;
      
      if (block) {
        const properties: any = {};
        
        // 各プロパティの値を取得
        for (const [propId, propInfo] of Object.entries(schema) as [string, any][]) {
          const value = block.properties?.[propId];
          properties[propInfo.name] = {
            raw: value,
            formatted: value?.[0]?.[0] || null
          };
        }
        
        blocks.push({
          id: blockId,
          title: block.properties?.title?.[0]?.[0] || 'Untitled',
          properties
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      collection: {
        id: collectionId,
        name: collection?.name?.[0]?.[0] || 'Unknown',
        description: collection?.description?.[0]?.[0] || null
      },
      view: {
        id: viewId,
        name: view?.name || 'Unknown',
        type: view?.type,
        format: view?.format
      },
      schema: schemaInfo,
      query_result: {
        total: collectionData.result?.total || 0,
        block_ids_count: blockIds.length,
        has_more: collectionData.result?.hasMore || false
      },
      sample_blocks: blocks,
      raw_data: {
        collection_raw: collection,
        view_raw: view
      }
    });
    
  } catch (error) {
    console.error('Error fetching collection data:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'コレクションデータの取得中にエラーが発生しました' 
    });
  }
}