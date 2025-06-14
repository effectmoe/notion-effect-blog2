import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  });
  
  try {
    // FAQマスターデータベースのコレクションID
    const collectionId = '212b802c-b0c6-8046-b4ee-000b2833619c';
    const collectionViewId = '212b802c-b0c6-8026-8290-000cee82ffad'; // 公開FAQビュー
    
    console.log('📋 Fetching FAQ database data');
    
    // コレクションビューのデータを取得
    const collectionData = await notion.getCollectionData(
      collectionId,
      collectionViewId,
      {
        limit: 50
      }
    );
    
    // FAQアイテムの詳細を取得
    const items = collectionData.recordMap?.block || {};
    const faqItems = Object.entries(items).map(([itemId, itemData]) => {
      const item = (itemData as any).value;
      const properties = item?.properties || {};
      
      return {
        id: itemId,
        title: properties.title?.[0]?.[0] || 'Untitled',
        isPublic: properties['@h}_']?.[0]?.[0] === 'Yes', // 公開チェックボックス
        category: properties['\\TOf']?.[0]?.[0] || '',
        tags: properties['kP@s'] || [],
        lastEdited: item?.last_edited_time ? new Date(item.last_edited_time).toLocaleString() : 'Unknown'
      };
    });
    
    // 公開設定されているアイテムをフィルタ
    const publicItems = faqItems.filter(item => item.isPublic);
    
    const result = {
      success: true,
      collectionId,
      collectionViewId,
      totalItems: faqItems.length,
      publicItems: publicItems.length,
      items: faqItems.slice(0, 10), // 最初の10件のみ表示
      summary: {
        hasData: faqItems.length > 0,
        hasPublicData: publicItems.length > 0,
        categories: [...new Set(faqItems.map(item => item.category).filter(Boolean))],
        message: publicItems.length === 0 ? 
          'データは存在しますが、公開設定されているアイテムがありません' : 
          `${publicItems.length}件の公開FAQアイテムがあります`
      }
    };
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    });
  }
}