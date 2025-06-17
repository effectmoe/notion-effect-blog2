import { NotionAPI } from 'notion-client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function checkAllCollections() {
  const notion = new NotionAPI({
    authToken: process.env.NOTION_API_SECRET,
    activeUser: process.env.NOTION_ACTIVE_USER,
    userTimeZone: 'Asia/Tokyo'
  })
  
  try {
    const pageId = '1ceb802cb0c680f29369dba86095fb38'
    console.log('📋 全データベースのcollection_idをチェックします...\n')
    
    const recordMap = await notion.getPage(pageId)
    
    const results = []
    let totalDatabases = 0
    let withCollectionId = 0
    let withoutCollectionId = 0
    
    // 全ブロックをチェック
    for (const [blockId, blockData] of Object.entries(recordMap.block)) {
      const block = blockData?.value
      
      if (block?.type === 'collection_view' || block?.type === 'collection_view_page') {
        totalDatabases++
        
        const hasCollectionId = !!block.collection_id
        if (hasCollectionId) {
          withCollectionId++
        } else {
          withoutCollectionId++
        }
        
        // タイトルを取得
        let title = 'タイトル不明'
        if (block.properties?.title) {
          title = block.properties.title[0]?.[0] || 'タイトル不明'
        }
        
        // ビュー情報を取得
        const views = []
        if (block.view_ids) {
          for (const viewId of block.view_ids) {
            const view = recordMap.collection_view?.[viewId]?.value
            if (view) {
              views.push({
                id: viewId,
                type: view.type,
                name: view.name
              })
            }
          }
        }
        
        const result = {
          blockId,
          title,
          type: block.type,
          hasCollectionId,
          collectionId: block.collection_id || null,
          viewCount: block.view_ids?.length || 0,
          views,
          status: hasCollectionId ? '✅ 正常' : '❌ collection_id欠落'
        }
        
        results.push(result)
        
        // コンソールに出力
        console.log(`${hasCollectionId ? '✅' : '❌'} ${title}`)
        console.log(`   ブロックID: ${blockId}`)
        console.log(`   collection_id: ${block.collection_id || '❌ なし'}`)
        console.log(`   ビュー数: ${views.length}`)
        if (views.length > 0) {
          console.log(`   ビュータイプ: ${views.map(v => v.type).join(', ')}`)
        }
        console.log('')
      }
    }
    
    // サマリー
    console.log('='.repeat(60))
    console.log('📊 サマリー:')
    console.log(`総データベース数: ${totalDatabases}`)
    console.log(`✅ collection_idあり: ${withCollectionId}`)
    console.log(`❌ collection_idなし: ${withoutCollectionId}`)
    
    if (withoutCollectionId > 0) {
      console.log('\n⚠️  collection_idが欠落しているデータベース:')
      results.filter(r => !r.hasCollectionId).forEach(r => {
        console.log(`- ${r.title} (${r.blockId})`)
      })
    }
    
    // 結果をファイルに保存
    fs.writeFileSync(
      'all-collections-check.json',
      JSON.stringify(results, null, 2)
    )
    
    console.log('\n✅ 詳細な結果は all-collections-check.json に保存されました')
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkAllCollections()