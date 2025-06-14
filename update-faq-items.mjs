import { Client } from '@notionhq/client';

// Notion APIクライアントを初期化
const notion = new Client({
  auth: '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'
});

async function updateAllFAQItems() {
  try {
    // FAQデータベースのID（FAQマスターデータベースのページID）
    const databaseId = '212b802c-b0c6-80ea-b7ed-ef4459f38819';
    
    console.log('FAQデータベースからすべてのアイテムを取得中...');
    
    // すべてのFAQアイテムを取得
    const response = await notion.databases.query({
      database_id: databaseId
    });
    
    console.log(`合計 ${response.results.length} 件のFAQアイテムが見つかりました`);
    
    // 各アイテムを公開に設定
    for (const page of response.results) {
      try {
        const title = page.properties['title']?.title?.[0]?.plain_text || 
                     page.properties['Question']?.title?.[0]?.plain_text || 
                     'タイトルなし';
        
        console.log(`更新中: ${title}`);
        
        // ページを更新して公開フラグをONにする
        await notion.pages.update({
          page_id: page.id,
          properties: {
            '@h}_': {  // 公開プロパティのID
              checkbox: true
            }
          }
        });
        
        console.log(`✓ ${title} を公開に設定しました`);
      } catch (error) {
        console.error(`エラー: ${page.id}`, error.message);
      }
    }
    
    console.log('\n✅ 完了: すべてのFAQアイテムを公開に設定しました！');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行
updateAllFAQItems();