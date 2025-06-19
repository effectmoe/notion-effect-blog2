// FAQマスターの修正をテスト
import { NotionAPI } from 'notion-client';

async function testFixFAQ() {
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
    const faqMasterBlock = recordMap.block[faqMasterBlockId];
    
    if (faqMasterBlock && faqMasterBlock.value) {
      console.log('\n=== 修正前のFAQマスターブロック ===');
      console.log('collection_id:', faqMasterBlock.value.collection_id);
      console.log('format:', faqMasterBlock.value.format);
      
      // ビューからcollection IDを取得
      const viewId = faqMasterBlock.value.view_ids?.[0];
      const view = recordMap.collection_view?.[viewId]?.value;
      const collectionId = view?.format?.collection_pointer?.id;
      
      if (collectionId && !faqMasterBlock.value.collection_id) {
        console.log('\n=== 修正を適用 ===');
        console.log('View collection ID:', collectionId);
        
        // ブロックにcollection_idとformatを追加
        faqMasterBlock.value.collection_id = collectionId;
        faqMasterBlock.value.format = {
          collection_pointer: {
            id: collectionId,
            table: "collection",
            spaceId: view.format.collection_pointer.spaceId
          }
        };
        
        console.log('\n=== 修正後のFAQマスターブロック ===');
        console.log('collection_id:', faqMasterBlock.value.collection_id);
        console.log('format:', JSON.stringify(faqMasterBlock.value.format, null, 2));
        
        // recordMapが修正されたか確認
        console.log('\n=== 修正が適用されたか確認 ===');
        const updatedBlock = recordMap.block[faqMasterBlockId]?.value;
        console.log('Updated collection_id:', updatedBlock.collection_id);
        console.log('Updated format:', updatedBlock.format);
      }
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

testFixFAQ();