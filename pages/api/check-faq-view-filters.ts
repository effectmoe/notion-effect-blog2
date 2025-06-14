// FAQマスターのNotionビューフィルターをチェックするスクリプト
import { NextApiRequest, NextApiResponse } from 'next';
import { notion } from '@/lib/notion-api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // メインページのID
    const pageId = process.env.NOTION_PAGE_ID || '1ceb802cb0c680f29369dba86095fb38';
    
    console.log('Fetching page data...');
    const pageData = await notion.getPage(pageId);
    
    // すべてのコレクションビューを確認
    const collectionViews = Object.entries(pageData.collection_view || {});
    const faqViews = [];
    
    for (const [viewId, viewData] of collectionViews) {
      const view = viewData.value;
      // collection_idはビューの型によって異なる場所にある可能性がある
      const collectionId = (view as any)?.collection_id || (view as any)?.parent_id;
      
      if (collectionId) {
        const collection = pageData.collection?.[collectionId]?.value;
        const collectionName = collection?.name?.[0]?.[0] || '';
        
        // FAQマスターを探す
        if (collectionName.includes('FAQ') || collectionName.includes('よくある') || collectionName.includes('質問')) {
          const schema = collection?.schema || {};
          
          // 公開プロパティのIDを探す
          let publicPropertyId = null;
          Object.entries(schema).forEach(([propId, prop]: [string, any]) => {
            if (prop.name === '公開' && prop.type === 'checkbox') {
              publicPropertyId = propId;
            }
          });
          
          // ビューのフィルター設定を確認
          const viewFilters = (view as any).query2?.filter?.filters || [];
          const publicFilter = viewFilters.find((f: any) => f.property === publicPropertyId);
          
          faqViews.push({
            viewId,
            collectionId,
            collectionName,
            viewType: view.type,
            publicPropertyId,
            hasFilters: viewFilters.length > 0,
            publicFilter: publicFilter ? {
              type: publicFilter.filter?.type,
              operator: publicFilter.filter?.operator,
              value: publicFilter.filter?.value?.type || publicFilter.filter?.value
            } : null,
            allFilters: viewFilters.map((f: any) => ({
              property: f.property,
              propertyName: (schema as any)[f.property]?.name,
              type: f.filter?.type,
              operator: f.filter?.operator,
              value: f.filter?.value
            }))
          });
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      pageId,
      totalViews: collectionViews.length,
      faqViews,
      message: faqViews.length === 0 ? 'FAQデータベースが見つかりませんでした' : 'FAQデータベースの情報を取得しました'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
