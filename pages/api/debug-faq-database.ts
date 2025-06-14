// FAQデータベースの詳細調査
import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // FAQマスターのコレクションID（正しいID）
    const faqCollectionId = '212b802c-b0c6-8046-b4ee-000b2833619c';
    // FAQマスターのブロックID
    const faqBlockId = '212b802c-b0c6-80ea-b7ed-ef4459f38819';
    
    console.log('📋 Fetching FAQ Master Database');
    console.log('Collection ID:', faqCollectionId);
    console.log('Block ID:', faqBlockId);
    
    // FAQデータベースページを取得
    const recordMap = await notion.getPage(faqBlockId);
    
    // コレクションの詳細を確認
    const collection = recordMap.collection?.[faqCollectionId]?.value;
    const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
    
    // ビューの詳細を確認
    const views = Object.entries(recordMap.collection_view || {}).map(([viewId, viewData]) => {
      const view = (viewData as any).value;
      
      // フィルター設定の詳細
      let filterDetails = null;
      if (view?.query2?.filter) {
        const filters = view.query2.filter.filters || [];
        filterDetails = {
          operator: view.query2.filter.operator,
          filters: filters.map((f: any) => {
            const propSchema = collection?.schema?.[f.property];
            return {
              propertyId: f.property,
              propertyName: propSchema?.name || 'Unknown',
              propertyType: propSchema?.type || 'Unknown',
              filterOperator: f.filter?.operator,
              filterValue: f.filter?.value
            };
          })
        };
      }
      
      return {
        viewId,
        viewName: view?.name || 'Unnamed',
        viewType: view?.type,
        hasFilters: !!view?.query2?.filter,
        filterDetails
      };
    });
    
    // データを取得してフィルタリングをテスト
    const viewResults: any[] = [];
    
    for (const view of views) {
      try {
        const collectionData = await notion.getCollectionData(
          faqCollectionId,
          view.viewId,
          {
            limit: 10,
            searchQuery: '',
            userTimeZone: 'Asia/Tokyo'
          }
        );
        
        const items = [];
        if (collectionData.result?.blockIds) {
          for (const blockId of collectionData.result.blockIds.slice(0, 5)) {
            const block = collectionData.recordMap?.block?.[blockId]?.value;
            if (block) {
              const publicPropId = '@h}_'; // 公開プロパティのID
              const isPublic = block.properties?.[publicPropId]?.[0]?.[0] === 'Yes';
              
              items.push({
                id: blockId,
                title: block.properties?.title?.[0]?.[0] || 'Untitled',
                isPublic,
                publicRawValue: block.properties?.[publicPropId]
              });
            }
          }
        }
        
        viewResults.push({
          viewId: view.viewId,
          viewName: view.viewName,
          totalItems: collectionData.result?.blockIds?.length || 0,
          sampleItems: items
        });
      } catch (error) {
        viewResults.push({
          viewId: view.viewId,
          viewName: view.viewName,
          error: error instanceof Error ? error.message : 'Failed to fetch data'
        });
      }
    }
    
    const result = {
      success: true,
      database: {
        collectionId: faqCollectionId,
        blockId: faqBlockId,
        name: collectionName,
        schema: Object.entries(collection?.schema || {}).map(([id, prop]: [string, any]) => ({
          id,
          name: prop.name,
          type: prop.type
        }))
      },
      views,
      viewResults,
      publicPropertyInfo: {
        id: '@h}_',
        name: '公開',
        type: 'checkbox',
        found: !!collection?.schema?.['@h}_']
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