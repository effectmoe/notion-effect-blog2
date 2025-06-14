import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // CafeKinesiページ内で「FAQマスター」というタイトルのリンクドビューを探す
    const searchQuery = {
      query: 'FAQマスター',
      ancestorId: '1ceb802cb0c680f29369dba86095fb38',
      limit: 50
    };
    
    console.log('🔍 Searching for FAQ views in CafeKinesi page');
    
    // 検索を実行
    const searchResults = await notion.search(searchQuery);
    
    // FAQマスターに関連するブロックを探す
    const faqBlocks = searchResults.results?.filter((result: any) => {
      const title = result.properties?.title?.[0]?.[0] || '';
      return title.includes('FAQ') || title.includes('よくある質問');
    }) || [];
    
    // CafeKinesiページを直接取得してFAQビューを探す
    const pageId = '1ceb802cb0c680f29369dba86095fb38';
    const recordMap = await notion.getPage(pageId);
    
    // ページ内のすべてのリンクドデータベースを探す
    const linkedDatabases: any[] = [];
    Object.entries(recordMap.block || {}).forEach(([blockId, blockData]) => {
      const block = (blockData as any).value;
      
      if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
        const collectionId = block.collection_id;
        const collection = recordMap.collection?.[collectionId]?.value;
        const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
        
        if (collectionName.includes('FAQ')) {
          // ビューの詳細を取得
          const viewIds = block.view_ids || [];
          const views = viewIds.map((viewId: string) => {
            const view = recordMap.collection_view?.[viewId]?.value;
            return {
              viewId,
              name: view?.name || 'Unnamed',
              type: view?.type || 'unknown',
              hasFilter: !!view?.query2?.filter,
              filter: view?.query2?.filter
            };
          });
          
          linkedDatabases.push({
            blockId,
            blockType: block.type,
            collectionId,
            collectionName,
            parentId: block.parent_id,
            parentTable: block.parent_table,
            views
          });
        }
      }
    });
    
    const result = {
      success: true,
      searchResults: faqBlocks.length,
      linkedFaqDatabases: linkedDatabases,
      pageId
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