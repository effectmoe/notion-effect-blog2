import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_SECRET || 'secret_fgmTVCObvhRJP9YPKgXZ4WnJOJcQS8tYwX5sS0Rc9LC'
});

async function fixFAQFilter() {
  try {
    // FAQデータベースのID
    const databaseId = '212b802c-b0c6-8046-b4ee-000b2833619c';
    
    // すべてのFAQアイテムを取得（フィルターなし）
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: undefined // フィルターを削除
    });
    
    console.log(`Total FAQ items: ${response.results.length}`);
    
    // 各アイテムの公開ステータスを確認
    for (const page of response.results) {
      const title = page.properties['Question']?.title?.[0]?.plain_text || 'No title';
      const isPublic = page.properties['公開']?.checkbox || false;
      
      console.log(`- ${title}: 公開=${isPublic}`);
      
      // もし公開がfalseなら、trueに更新
      if (!isPublic) {
        await notion.pages.update({
          page_id: page.id,
          properties: {
            '公開': {
              checkbox: true
            }
          }
        });
        console.log(`  → 公開に変更しました`);
      }
    }
    
    console.log('\n完了：すべてのFAQアイテムを公開に設定しました');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixFAQFilter();