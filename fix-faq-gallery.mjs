import { Client } from '@notionhq/client';

// Notion APIクライアントを初期化
const notion = new Client({
  auth: process.env.NOTION_API_SECRET || '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'
});

async function fixFAQGalleryView() {
  try {
    // FAQマスターデータベースのID
    const databaseId = '212b802c-b0c6-80ea-b7ed-ef4459f38819';
    
    console.log('FAQマスターデータベースの情報を取得中...');
    
    // データベース情報を取得
    const database = await notion.databases.retrieve({ database_id: databaseId });
    console.log('データベース名:', database.title[0]?.plain_text || 'タイトルなし');
    
    // プロパティの構造を確認
    console.log('\nデータベースのプロパティ:');
    for (const [key, prop] of Object.entries(database.properties)) {
      console.log(`  ${key}: ${prop.type}`);
    }
    
    // データベース内のアイテムを取得
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100
    });
    
    console.log(`\n${response.results.length}件のアイテムが見つかりました`);
    
    // 各アイテムの公開状態を確認と更新
    for (const page of response.results) {
      // タイトルを取得
      let title = 'タイトルなし';
      for (const [key, prop] of Object.entries(page.properties)) {
        if (prop.type === 'title' && prop.title?.length > 0) {
          title = prop.title[0].plain_text;
          break;
        }
      }
      
      // 公開プロパティを探す
      let publicKey = null;
      let isPublic = false;
      
      for (const [key, prop] of Object.entries(page.properties)) {
        if (prop.type === 'checkbox' && (key === '公開' || key.includes('公開'))) {
          publicKey = key;
          isPublic = prop.checkbox;
          break;
        }
      }
      
      console.log(`- ${title}: 公開=${isPublic} (key: ${publicKey})`);
      
      // 公開されていないアイテムを公開に設定
      if (publicKey && !isPublic) {
        await notion.pages.update({
          page_id: page.id,
          properties: {
            [publicKey]: { checkbox: true }
          }
        });
        console.log(`  ✓ ${title} を公開に設定しました`);
      }
    }
    
    console.log('\n✅ 完了');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    if (error.code === 'object_not_found') {
      console.log('\nヒント: ページIDが正しいか確認してください');
    }
  }
}

// 実行
fixFAQGalleryView();