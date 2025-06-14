import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

const notion = new NotionAPI({
  authToken: process.env.NOTION_TOKEN_V2,
  activeUser: process.env.NOTION_ACTIVE_USER || ''
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // FAQマスターのビューID
    const viewId = '212b802c-b0c6-80ff-9c41-000cec7d8204';
    const collectionId = '212b802c-b0c6-8046-b4ee-000b2833619c';
    
    // FAQマスターのrecordMapを取得
    const recordMap = await notion.getPage('1ceb802cb0c680f29369dba86095fb38');
    
    // ビューの現在の設定を確認
    const view = recordMap.collection_view?.[viewId]?.value;
    
    if (!view) {
      return res.status(404).json({ error: 'View not found' });
    }
    
    // 現在のフィルター設定を取得
    const currentFilter = view.format?.filter || {};
    
    // フィルターを削除または修正
    // フィルターを完全に削除して、すべてのアイテムを表示
    const updatedView = {
      ...view,
      format: {
        ...view.format,
        filter: {
          operator: 'and',
          filters: []  // 空のフィルター = すべて表示
        }
      }
    };
    
    res.status(200).json({
      message: 'Filter analysis',
      viewId,
      currentFilter,
      viewType: view.type,
      format: view.format,
      recommendation: 'フィルターを削除してすべてのFAQアイテムを表示することを推奨'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update filter' });
  }
}