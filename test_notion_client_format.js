// notion-clientライブラリのデータ形式をテスト
const { NotionAPI } = require('notion-client');

async function testNotionClient() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_TOKEN || 'v03%3AeyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..LB1_tXvFt6AliP9NcPVnDQ.fbaTG1bNytjOVS57mdhZ8WcRsogkjy--RcgdMoQgxYiOa_5pINIuVTv11EYCvBCz-zPBBcvbwGoLwztlIvsJWMAI-2mEkifvFI1secC26YqsING8TANneSTfAUZbRgoh1xEjPLPKfRNl27KC42b6hKcO1XpTQ4E9cMyMXR3ep38GaG0uFGRc-9I3r5rJMkgInJOh3fgE8c5W9NxaQNg88wEcEzZDCFlBIRcbh-leT2kZhf21vHyiXY9vnR2tOr3e77yl5B8yTHwI6kfQxnM2MRgUcxYg22jqp1PkX0wb_ZwR9m_1lri8MAIjjGemkOk6FLRSNGE3QX0boAHokWdLchX4jSUXOVOeXqQvOn_Xn3LgKn6LanfCde6kYfbLwncMlLJaa51LcfmcBx4-PDlLJDRZBZphcRKW87thOHXC8N0.CCmBq7o-i-GRTe3nY0-T2_SSkURxAFzYqcqPQisc-wov03%3AeyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..LB1_tXvFt6AliP9NcPVnDQ.fbaTG1bNytjOVS57mdhZ8WcRsogkjy--RcgdMoQgxYiOa_5pINIuVTv11EYCvBCz-zPBBcvbwGoLwztlIvsJWMAI-2mEkifvFI1secC26YqsING8TANneSTfAUZbRgoh1xEjPLPKfRNl27KC42b6hKcO1XpTQ4E9cMyMXR3ep38GaG0uFGRc-9I3r5rJMkgInJOh3fgE8c5W9NxaQNg88wEcEzZDCFlBIRcbh-leT2kZhf21vHyiXY9vnR2tOr3e77yl5B8yTHwI6kfQxnM2MRgUcxYg22jqp1PkX0wb_ZwR9m_1lri8MAIjjGemkOk6FLRSNGE3QX0boAHokWdLchX4jSUXOVOeXqQvOn_Xn3LgKn6LanfCde6kYfbLwncMlLJaa51LcfmcBx4-PDlLJDRZBZphcRKW87thOHXC8N0.CCmBq7o-i-GRTe3nY0-T2_SSkURxAFzYqcqPQisc-wo',
    activeUser: '91b6494e-7ede-45b2-99f9-402ae7d7fcee',
    userTimeZone: 'Asia/Tokyo'
  });

  const databaseId = '212b802c-b0c6-80ea-b7ed-ef4459f38819';
  
  try {
    console.log('FAQマスターデータベースを取得中...');
    
    // データベースを取得
    const recordMap = await notion.getPage(databaseId);
    
    const collectionId = Object.keys(recordMap.collection || {})[0];
    const collectionViewId = Object.keys(recordMap.collection_view || {})[0];
    
    if (!collectionId || !collectionViewId) {
      console.log('データベースが見つかりません');
      return;
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
    for (const [propId, prop] of Object.entries(schema)) {
      if (prop.name === '公開' && prop.type === 'checkbox') {
        publicPropertyId = propId;
        console.log('公開プロパティID:', propId);
        break;
      }
    }
    
    // 最初の3つのアイテムでチェックボックスの値を確認
    if (collectionData.result?.blockIds) {
      console.log('\n=== アイテムのチェックボックス値を確認 ===');
      
      for (let i = 0; i < Math.min(3, collectionData.result.blockIds.length); i++) {
        const blockId = collectionData.result.blockIds[i];
        const block = collectionData.recordMap?.block?.[blockId]?.value;
        
        if (block && block.properties) {
          console.log(`\n--- アイテム ${i + 1} (${blockId}) ---`);
          
          // タイトルを取得
          const title = block.properties.title?.[0]?.[0] || '(タイトルなし)';
          console.log('タイトル:', title);
          
          // 公開プロパティの値を確認
          if (publicPropertyId && block.properties[publicPropertyId]) {
            const publicProp = block.properties[publicPropertyId];
            console.log('公開プロパティの完全な値:', JSON.stringify(publicProp));
            console.log('[0]の値:', publicProp[0]);
            console.log('[0][0]の値:', publicProp[0]?.[0]);
            
            // 様々な判定方法を試す
            console.log('判定結果:');
            console.log('  - [0][0] === "Yes":', publicProp[0]?.[0] === 'Yes');
            console.log('  - [0][0] === true:', publicProp[0]?.[0] === true);
            console.log('  - [0][0] === "true":', publicProp[0]?.[0] === 'true');
            console.log('  - [0] === ["Yes"]:', JSON.stringify(publicProp[0]) === JSON.stringify(['Yes']));
            console.log('  - プロパティが存在する:', !!publicProp);
            console.log('  - プロパティの長さ > 0:', publicProp.length > 0);
          } else {
            console.log('公開プロパティが存在しません');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

testNotionClient();