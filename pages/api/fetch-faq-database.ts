import { NextApiRequest, NextApiResponse } from 'next';
import { NotionAPI } from 'notion-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { databaseId } = req.query;
    
    if (!databaseId || typeof databaseId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'データベースIDが指定されていません' 
      });
    }

    const notion = new NotionAPI({
      authToken: process.env.NOTION_TOKEN,
      activeUser: process.env.NOTION_ACTIVE_USER,
      userTimeZone: 'Asia/Tokyo'
    });

    console.log('Fetching FAQ database:', databaseId);
    
    // データベースを取得
    const recordMap = await notion.getPage(databaseId);
    
    // コレクションとビューを確認
    const collectionId = Object.keys(recordMap.collection || {})[0];
    const collectionViewId = Object.keys(recordMap.collection_view || {})[0];
    
    if (!collectionId || !collectionViewId) {
      return res.status(404).json({ 
        success: false, 
        error: 'データベースが見つかりません' 
      });
    }

    // コレクションデータを取得
    const collectionData = await notion.getCollectionData(
      collectionId,
      collectionViewId,
      {
        limit: 999,
        searchQuery: '',
        userTimeZone: 'Asia/Tokyo'
      }
    );

    const collection = recordMap.collection[collectionId]?.value;
    const schema = collection?.schema || {};
    
    // スキーマから公開プロパティのIDを探す
    let publicPropertyId = null;
    let questionPropertyId = null;
    let answerPropertyId = null;
    let categoryPropertyId = null;
    
    for (const [propId, prop] of Object.entries(schema) as [string, any][]) {
      if (prop.name === '公開' && prop.type === 'checkbox') {
        publicPropertyId = propId;
      } else if (prop.name === '質問' || prop.name === 'Question') {
        questionPropertyId = propId;
      } else if (prop.name === '回答' || prop.name === 'Answer') {
        answerPropertyId = propId;
      } else if (prop.name === 'カテゴリ' || prop.name === 'Category') {
        categoryPropertyId = propId;
      }
    }
    
    console.log('Property IDs:', {
      public: publicPropertyId,
      question: questionPropertyId,
      answer: answerPropertyId,
      category: categoryPropertyId
    });
    

    // FAQアイテムを処理
    const faqItems = [];
    
    // blockIdsの場所を確認して取得
    const blockIds = collectionData.result?.blockIds || 
                    collectionData.result?.reducerResults?.collection_group_results?.blockIds || 
                    [];
    
    
    if (blockIds.length > 0) {
      for (const blockId of blockIds) {
        const block = collectionData.recordMap?.block?.[blockId]?.value;
        
        if (block && block.properties) {
          
          // 公開フラグを確認
          // notion-clientでは、チェックボックスがオンの場合は [["Yes"]]、オフの場合は undefined または []
          const publicProp = publicPropertyId ? block.properties[publicPropertyId] : undefined;
          let isPublic = false;
          
          if (publicProp && publicProp.length > 0 && publicProp[0] && publicProp[0].length > 0) {
            // 値が存在する場合、'Yes' をチェック
            isPublic = publicProp[0][0] === 'Yes';
          }
          
          
          // 公開されているアイテムのみ処理
          if (isPublic) {
            const question = questionPropertyId 
              ? block.properties[questionPropertyId]?.[0]?.[0] || block.properties.title?.[0]?.[0] || ''
              : block.properties.title?.[0]?.[0] || '';
              
            const answer = answerPropertyId 
              ? block.properties[answerPropertyId]?.[0]?.[0] || ''
              : '';
              
            const category = categoryPropertyId 
              ? block.properties[categoryPropertyId]?.[0]?.[0] || 'その他'
              : 'その他';
            
            faqItems.push({
              id: blockId,
              question,
              answer,
              category,
              isPublic: true
            });
          }
        }
      }
    }
    
    console.log(`Found ${faqItems.length} public FAQ items`);
    
    return res.status(200).json({
      success: true,
      items: faqItems,
      totalItems: blockIds.length,
      publicItems: faqItems.length
    });
    
  } catch (error) {
    console.error('Error fetching FAQ database:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'FAQデータの取得中にエラーが発生しました' 
    });
  }
}
