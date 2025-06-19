// FAQマスターの構造を詳しく調査
import { NotionAPI } from 'notion-client';

async function testFAQStructure() {
  const notion = new NotionAPI({
    authToken: 'v03%3AeyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..LB1_tXvFt6AliP9NcPVnDQ.fbaTG1bNytjOVS57mdhZ8WcRsogkjy--RcgdMoQgxYiOa_5pINIuVTv11EYCvBCz-zPBBcvbwGoLwztlIvsJWMAI-2mEkifvFI1secC26YqsING8TANneSTfAUZbRgoh1xEjPLPKfRNl27KC42b6hKcO1XpTQ4E9cMyMXR3ep38GaG0uFGRc-9I3r5rJMkgInJOh3fgE8c5W9NxaQNg88wEcEzZDCFlBIRcbh-leT2kZhf21vHyiXY9vnR2tOr3e77yl5B8yTHwI6kfQxnM2MRgUcxYg22jqp1PkX0wb_ZwR9m_1lri8MAIjjGemkOk6FLRSNGE3QX0boAHokWdLchX4jSUXOVOeXqQvOn_Xn3LgKn6LanfCde6kYfbLwncMlLJaa51LcfmcBx4-PDlLJDRZBZphcRKW87thOHXC8N0.CCmBq7o-i-GRTe3nY0-T2_SSkURxAFzYqcqPQisc-wo',
    activeUser: '91b6494e-7ede-45b2-99f9-402ae7d7fcee',
    userTimeZone: 'Asia/Tokyo'
  });

  try {
    // CafeKinesiページを取得
    const pageId = '1ceb802cb0c680f29369dba86095fb38';
    console.log('CafeKinesiページを取得中...');
    const recordMap = await notion.getPage(pageId);
    
    // FAQマスターのブロックを探す
    const faqMasterBlockId = '212b802c-b0c6-80be-aa3a-e91428cbde58';
    const faqMasterBlock = recordMap.block[faqMasterBlockId]?.value;
    
    if (faqMasterBlock) {
      console.log('\n=== FAQマスターブロック ===');
      console.log('Type:', faqMasterBlock.type);
      console.log('ID:', faqMasterBlock.id);
      console.log('collection_id:', faqMasterBlock.collection_id);
      console.log('view_ids:', faqMasterBlock.view_ids);
      console.log('format:', JSON.stringify(faqMasterBlock.format, null, 2));
      
      // ビューの情報を確認
      if (faqMasterBlock.view_ids && faqMasterBlock.view_ids.length > 0) {
        const viewId = faqMasterBlock.view_ids[0];
        const view = recordMap.collection_view?.[viewId]?.value;
        
        if (view) {
          console.log('\n=== FAQマスタービュー ===');
          console.log('View ID:', viewId);
          console.log('Type:', view.type);
          console.log('Name:', view.name);
          console.log('format.collection_pointer:', JSON.stringify(view.format?.collection_pointer, null, 2));
          
          // コレクションIDを取得
          const collectionId = view.format?.collection_pointer?.id;
          if (collectionId) {
            console.log('\nCollection ID found in view:', collectionId);
            
            // コレクションが存在するか確認
            const collection = recordMap.collection?.[collectionId]?.value;
            if (collection) {
              console.log('Collection found:', collection.name?.[0]?.[0] || 'No name');
              console.log('Collection icon:', collection.icon);
            } else {
              console.log('Collection NOT found in recordMap!');
            }
          }
        }
      }
    }
    
    // 比較のため、他のデータベース（カフェキネシコンテンツ）も確認
    const otherDbBlockId = '20db802c-b0c6-80e2-93d4-fc46bf2dd823';
    const otherDbBlock = recordMap.block[otherDbBlockId]?.value;
    
    if (otherDbBlock) {
      console.log('\n\n=== カフェキネシコンテンツブロック（比較用） ===');
      console.log('Type:', otherDbBlock.type);
      console.log('ID:', otherDbBlock.id);
      console.log('collection_id:', otherDbBlock.collection_id);
      console.log('view_ids:', otherDbBlock.view_ids);
      console.log('format:', JSON.stringify(otherDbBlock.format, null, 2));
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

testFAQStructure();