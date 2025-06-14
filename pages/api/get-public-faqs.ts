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
    
    // コレクションビューのデータを取得
    const collectionData = await notion.getCollectionData(
      collectionId,
      collectionViewId,
      {
        limit: 100
      }
    );
    
    // FAQアイテムを処理
    const items = collectionData.recordMap?.block || {};
    const collection = collectionData.recordMap?.collection?.[collectionId]?.value;
    const schema = collection?.schema || {};
    
    // スキーマからプロパティIDを取得
    let publicPropertyId = '@h}_'; // デフォルト値
    let categoryPropertyId = '\\TOf';
    let answerPropertyId = 'fJZ:';
    
    Object.entries(schema).forEach(([propId, prop]: [string, any]) => {
      if (prop.name === '公開') publicPropertyId = propId;
      if (prop.name === 'カテゴリ') categoryPropertyId = propId;
      if (prop.name === '回答') answerPropertyId = propId;
    });
    
    const faqItems = Object.entries(items)
      .map(([itemId, itemData]) => {
        const item = (itemData as any).value;
        const properties = item?.properties || {};
        
        // 公開チェックボックスの値を確認
        const isPublic = properties[publicPropertyId]?.[0]?.[0] === 'Yes';
        
        return {
          id: itemId,
          title: properties.title?.[0]?.[0] || '',
          answer: properties[answerPropertyId]?.[0]?.[0] || '',
          category: properties[categoryPropertyId]?.[0]?.[0] || '',
          isPublic,
          lastEdited: item?.last_edited_time ? new Date(item.last_edited_time).toISOString() : null
        };
      })
      .filter(item => item.isPublic && item.title) // 公開かつタイトルがあるもののみ
      .sort((a, b) => {
        // カテゴリでソート、次にタイトルでソート
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.title.localeCompare(b.title);
      });
    
    const result = {
      success: true,
      faqs: faqItems,
      total: faqItems.length,
      schema: Object.entries(schema).map(([id, prop]: [string, any]) => ({
        id,
        name: prop.name,
        type: prop.type
      }))
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