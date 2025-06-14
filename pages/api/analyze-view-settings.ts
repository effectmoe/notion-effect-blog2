// 特定のビューIDの設定を詳細に分析するAPIエンドポイント
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
    
    console.log('📋 Fetching page data for view analysis');
    
    const recordMap = await notion.getPage(pageId);
    
    // 調査対象のビューID（FAQマスターのリンクドビュー）
    const targetViewId = '212b802c-b0c6-80ff-9c41-000cec7d8204';
    
    // 比較用の他のビューを収集
    const allViews: any[] = [];
    
    // すべてのコレクションビューを確認
    Object.entries(recordMap.collection_view || {}).forEach(([viewId, viewData]) => {
      const view = (viewData as any).value;
      const collectionId = view?.collection_id || view?.parent_id;
      
      if (collectionId) {
        const collection = recordMap.collection?.[collectionId]?.value;
        let collectionName = collection?.name?.[0]?.[0] || 'Unknown';
        
        // ブロックから直接コレクションIDを取得してみる
        if (collectionName === 'Unknown') {
          // collection_viewブロックを探す
          Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
            const block = (blockData as any).value;
            if (block?.collection_id === collectionId && block?.view_ids?.includes(viewId)) {
              // 親ブロックのコレクションを確認
              const parentCollection = recordMap.collection?.[block.collection_id]?.value;
              if (parentCollection) {
                collectionName = parentCollection.name?.[0]?.[0] || collectionName;
              }
            }
          });
        }
        
        // ビューの詳細設定を抽出
        const viewSettings = {
          viewId,
          collectionId,
          collectionName,
          viewType: view?.type,
          viewName: view?.name,
          isTargetView: viewId === targetViewId,
          
          // クエリ設定
          query2: {
            hasFilter: !!view?.query2?.filter,
            filterOperator: view?.query2?.filter?.operator,
            filtersCount: view?.query2?.filter?.filters?.length || 0,
            filters: view?.query2?.filter?.filters || [],
            
            // ソート設定
            hasSort: !!view?.query2?.sort,
            sorts: view?.query2?.sort || [],
            
            // グループ設定
            hasGroup: !!view?.query2?.group,
            groups: view?.query2?.group || [],
            
            // 集計設定
            hasAggregations: !!view?.query2?.aggregations,
            aggregations: view?.query2?.aggregations || []
          },
          
          // フォーマット設定
          format: {
            propertyVisibility: view?.format?.property_visibility,
            tableWrap: view?.format?.table_wrap,
            hideLinkedPageProp: view?.format?.hide_linked_collection_name,
            boardColumns: view?.format?.board_columns,
            boardGroups: view?.format?.board_groups,
            galleryColumns: view?.format?.gallery_columns
          },
          
          // その他の設定
          pageSort: view?.page_sort || [],
          parentTable: view?.parent_table,
          alive: view?.alive !== false
        };
        
        // スキーマ情報も追加
        if (collection?.schema) {
          const schemaProps = Object.entries(collection.schema).map(([propId, prop]: [string, any]) => ({
            id: propId,
            name: prop.name,
            type: prop.type,
            options: prop.options
          }));
          
          viewSettings.schema = schemaProps;
        }
        
        allViews.push(viewSettings);
      }
    });
    
    // ターゲットビューの詳細
    const targetView = allViews.find(v => v.isTargetView);
    
    // FAQデータベースのビューを特定
    const faqViews = allViews.filter(v => 
      v.collectionName.includes('FAQ') || 
      v.collectionName.includes('よくある') ||
      v.collectionName.includes('質問')
    );
    
    // カフェキネシコンテンツのビューを特定
    const contentViews = allViews.filter(v => 
      v.collectionName.includes('カフェキネシ') && 
      !v.collectionName.includes('FAQ')
    );
    
    // ビュー設定の比較
    const comparison = {
      targetView: targetView || { error: 'Target view not found', viewId: targetViewId },
      
      faqViews: {
        count: faqViews.length,
        withFilters: faqViews.filter(v => v.query2.hasFilter).length,
        views: faqViews.map(v => ({
          viewId: v.viewId,
          collectionName: v.collectionName,
          hasFilter: v.query2.hasFilter,
          filtersCount: v.query2.filtersCount,
          filterDetails: v.query2.filters.map((f: any) => ({
            property: f.property,
            operator: f.filter?.operator,
            value: f.filter?.value
          }))
        }))
      },
      
      contentViews: {
        count: contentViews.length,
        withFilters: contentViews.filter(v => v.query2.hasFilter).length,
        views: contentViews.map(v => ({
          viewId: v.viewId,
          collectionName: v.collectionName,
          hasFilter: v.query2.hasFilter,
          filtersCount: v.query2.filtersCount,
          filterDetails: v.query2.filters.map((f: any) => ({
            property: f.property,
            operator: f.filter?.operator,
            value: f.filter?.value
          }))
        }))
      },
      
      summary: {
        totalViews: allViews.length,
        viewsWithFilters: allViews.filter(v => v.query2.hasFilter).length,
        targetViewFound: !!targetView,
        targetViewHasFilter: targetView?.query2?.hasFilter || false
      }
    };
    
    return res.status(200).json({
      success: true,
      targetViewId,
      comparison,
      allViewsDetailed: allViews
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}