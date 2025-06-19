import { getPage } from './lib/notion.js';
import { getBlockCollectionId } from 'notion-utils';

// 調査対象
const WORKING_DB = '20db802cb0c680e293d4fc46bf2dd823'; // カフェキネシコンテンツ（動作する）
const FAQ_DB = '212b802cb0c680888f8dc056b3a26cb9'; // FAQ（動作しない）

async function investigate(pageId, label) {
  console.log(`\n========== ${label} ==========`);
  
  const recordMap = await getPage(pageId);
  const blocks = recordMap.block || {};
  
  // データベースビューを探す
  for (const [blockId, blockData] of Object.entries(blocks)) {
    const block = blockData?.value;
    if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
      console.log(`\nBlock ID: ${blockId}`);
      console.log(`Type: ${block.type}`);
      console.log(`collection_id: ${block.collection_id || 'NULL'}`);
      
      // collection_idを探す場所
      console.log('\n--- collection_idの場所を探索 ---');
      console.log(`1. block.collection_id: ${block.collection_id || 'なし'}`);
      console.log(`2. block.format.collection_pointer.id: ${block.format?.collection_pointer?.id || 'なし'}`);
      
      // viewsをチェック
      if (block.view_ids?.[0]) {
        const view = recordMap.collection_view?.[block.view_ids[0]]?.value;
        console.log(`3. view.format.collection_pointer.id: ${view?.format?.collection_pointer?.id || 'なし'}`);
      }
      
      // notion-utilsの結果
      const utilsResult = getBlockCollectionId(block, recordMap);
      console.log(`\nnotion-utils結果: ${utilsResult || 'NULL'}`);
      
      // コレクションの存在確認
      const collectionId = utilsResult || block.collection_id;
      if (collectionId) {
        const exists = !!recordMap.collection?.[collectionId];
        console.log(`コレクションは存在する？: ${exists ? 'はい' : 'いいえ'}`);
        
        // collection_queryをチェック
        const hasQuery = !!recordMap.collection_query?.[collectionId];
        console.log(`collection_queryは存在する？: ${hasQuery ? 'はい' : 'いいえ'}`);
      }
    }
  }
}

console.log('=== Notion データベース構造調査 ===\n');
console.log('問題: FAQデータベースが表示されない');
console.log('目的: Notion APIの問題か、react-notion-xの問題かを特定する');

await investigate(WORKING_DB, '動作するデータベース（カフェキネシコンテンツ）');
await investigate(FAQ_DB, '動作しないデータベース（FAQ）');

console.log('\n\n=== 結論 ===');
console.log('上記の結果から、問題の原因が判明します。');