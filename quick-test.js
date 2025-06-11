// Notion API接続テスト
// node quick-test.js で実行

const { Client } = require('@notionhq/client');

// 環境変数から読み込むか、直接指定
const apiKey = process.env.NOTION_SEARCH_API_SECRET || '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';

const notion = new Client({
  auth: apiKey
});

async function testConnection() {
  try {
    console.log('🔍 Notion API接続テスト中...');
    
    // ユーザー情報を取得
    const response = await notion.users.me();
    console.log('✅ 接続成功！');
    console.log('ユーザー:', response);
    
    // データベースを検索
    console.log('\n📚 データベースを検索中...');
    const search = await notion.search({
      filter: {
        property: 'object',
        value: 'database'
      },
      page_size: 5
    });
    
    console.log(`見つかったデータベース: ${search.results.length}件`);
    search.results.forEach((db, i) => {
      console.log(`${i + 1}. ${db.title?.[0]?.plain_text || 'Untitled'}`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.log('\n対処法:');
    console.log('1. Notionでインテグレーションのアクセス権限を設定してください');
    console.log('2. APIキーが正しいか確認してください');
  }
}

testConnection();