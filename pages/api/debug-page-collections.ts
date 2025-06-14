// ページ内のすべてのコレクションを調査するAPIエンドポイント
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
    
    console.log('📋 Fetching CafeKinesi page:', pageId);
    
    const recordMap = await notion.getPage(pageId);
    
    // ページの基本情報
    const page = recordMap.block[pageId]?.value;
    const pageInfo = page ? {
      title: page.properties?.title?.[0]?.[0] || 'Untitled',
      type: page.type,
      created: new Date(page.created_time).toLocaleString(),
      lastEdited: new Date(page.last_edited_time).toLocaleString()
    } : null;
    
    // すべてのコレクションを確認
    const collections = Object.entries(recordMap.collection || {}).map(([collectionId, collectionData]) => {
      const collection = (collectionData as any).value;
      const name = collection?.name?.[0]?.[0] || 'Untitled';
      
      const schema = collection?.schema || {};
      const schemaProps = Object.entries(schema).map(([propId, prop]: [string, any]) => ({
        id: propId,
        name: prop.name,
        type: prop.type
      }));
      
      return {
        id: collectionId,
        name,
        parentId: collection?.parent_id,
        schemaPropertiesCount: Object.keys(schema).length,
        schema: schemaProps,
        isFAQ: name.includes('FAQ') || name.includes('よくある') || name.includes('質問')
      };
    });
    
    // すべてのコレクションビューを確認
    const collectionViews = Object.entries(recordMap.collection_view || {}).map(([viewId, viewData]) => {
      const view = (viewData as any).value;
      const collectionId = view?.collection_id;
      let collectionName = 'Unknown';
      
      if (collectionId) {
        const collection = recordMap.collection?.[collectionId]?.value;
        collectionName = collection?.name?.[0]?.[0] || 'Unknown';
      }
      
      return {
        id: viewId,
        type: view?.type,
        name: view?.name,
        collectionId,
        collectionName,
        parentId: view?.parent_id,
        hasFilters: !!view?.query2?.filter,
        filters: view?.query2?.filter
      };
    });
    
    // ページ内のブロックを確認（リンクドデータベースを探す）
    const linkedDatabases: any[] = [];
    const pageBlocks = Object.entries(recordMap.block || {});
    
    pageBlocks.forEach(([blockId, blockData]) => {
      const block = (blockData as any).value;
      
      // collection_viewタイプのブロックを探す
      if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
        const collectionId = block.collection_id;
        let collectionName = 'Unknown';
        let isFAQ = false;
        
        if (collectionId) {
          const collection = recordMap.collection?.[collectionId]?.value;
          collectionName = collection?.name?.[0]?.[0] || 'Unknown';
          isFAQ = collectionName.includes('FAQ') || collectionName.includes('よくある');
        }
        
        linkedDatabases.push({
          blockId,
          type: block.type,
          collectionId,
          collectionName,
          viewIds: block.view_ids,
          isFAQ
        });
      }
    });
    
    // FAQマスターデータベースのIDを探す
    const faqMasterDatabaseId = '212b802cb0c680eab7edef4459f38819';
    const faqMasterFound = collections.find(col => col.id === faqMasterDatabaseId);
    
    const result = {
      success: true,
      pageId,
      pageInfo,
      summary: {
        totalCollections: collections.length,
        totalViews: collectionViews.length,
        linkedDatabasesCount: linkedDatabases.length,
        faqDatabasesFound: linkedDatabases.filter(db => db.isFAQ).length
      },
      faqMaster: {
        expectedId: faqMasterDatabaseId,
        found: !!faqMasterFound,
        details: faqMasterFound || null
      },
      collections,
      collectionViews,
      linkedDatabases,
      faqDatabases: linkedDatabases.filter(db => db.isFAQ)
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