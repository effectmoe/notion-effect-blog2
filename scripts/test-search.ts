/**
 * 検索機能のテストスクリプト
 */

import { SearchEngine } from '../lib/search/search-engine.js'
import { SearchIndexer } from '../lib/search/indexer.js'
import { HybridNotionAPI } from '../lib/search/hybrid-api.js'

async function testSearch() {
  console.log('🔍 検索機能テスト開始...\n')
  
  try {
    // 1. ハイブリッドAPIのテスト
    console.log('1️⃣ ハイブリッドAPIテスト')
    const hybridAPI = new HybridNotionAPI()
    // テスト用のページIDを指定（実際のページIDに置き換えてください）
    const testPageId = '1ceb802cb0c680f29369dba86095fb38'
    
    console.log(`  ページデータ取得中: ${testPageId}`)
    const pageData = await hybridAPI.getEnrichedPageData(testPageId)
    console.log('  ✅ ページデータ取得成功')
    console.log(`  - タイトル: ${pageData.title}`)
    console.log(`  - タグ: ${pageData.tags?.join(', ') || 'なし'}`)
    console.log(`  - カテゴリ: ${pageData.category || 'なし'}`)
    console.log(`  - キーワード: ${pageData.keywords.slice(0, 5).join(', ')}...`)
    console.log()
    
    // 2. インデックスのテスト
    console.log('2️⃣ インデックステスト')
    const indexer = new SearchIndexer()
    
    // インデックスの統計情報を取得
    const stats = await indexer.getIndexStats()
    console.log('  インデックス統計:')
    console.log(`  - 総ページ数: ${stats.totalPages}`)
    console.log(`  - 公式APIページ: ${stats.officialApiPages}`)
    console.log(`  - ハイブリッドページ: ${stats.hybridPages}`)
    console.log()
    
    // 3. 検索エンジンのテスト
    console.log('3️⃣ 検索エンジンテスト')
    const searchEngine = new SearchEngine()
    
    // テスト検索クエリ
    const testQueries = [
      { query: 'React', type: 'all' },
      { query: '#React', type: 'metadata' },
      { query: 'category:技術記事', type: 'metadata' },
      { query: 'Notion', type: 'content' }
    ]
    
    for (const test of testQueries) {
      console.log(`\n  検索: "${test.query}" (${test.type})`)
      const results = await searchEngine.search(test.query, {
        searchType: test.type as any,
        limit: 3
      })
      
      console.log(`  - 結果数: ${results.total}`)
      console.log(`  - 検索時間: ${results.searchTime}ms`)
      
      if (results.results.length > 0) {
        console.log('  - トップ3の結果:')
        results.results.slice(0, 3).forEach((result, index) => {
          console.log(`    ${index + 1}. ${result.title} (スコア: ${result.relevanceScore})`)
        })
      }
    }
    
    // 4. パフォーマンステスト
    console.log('\n4️⃣ パフォーマンステスト')
    const performanceQueries = ['JavaScript', 'プログラミング', 'ブログ']
    const times: number[] = []
    
    for (const query of performanceQueries) {
      const start = Date.now()
      await searchEngine.search(query)
      const duration = Date.now() - start
      times.push(duration)
      console.log(`  "${query}": ${duration}ms`)
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    console.log(`  平均検索時間: ${avgTime.toFixed(2)}ms`)
    
    console.log('\n✅ すべてのテストが完了しました！')
    
  } catch (error) {
    console.error('\n❌ テスト中にエラーが発生しました:', error)
  }
}

// CLIから実行可能にする
if (require.main === module) {
  testSearch().catch(console.error)
}

export { testSearch }