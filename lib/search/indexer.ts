/**
 * 検索インデックスの構築と管理
 */

import fs from 'fs/promises'
import path from 'path'
import { HybridNotionAPI } from './hybrid-api'
import { isValidBlogPage } from './search-filter'
import { shouldIndexPage, isValidBlogPageId } from './page-validator'
import { memoryCache } from './memory-cache'
import { getAllPageIds } from './batch-page-fetcher'
import { filterSearchablePages } from './searchable-checker'
import { SEARCHABLE_PAGE_IDS } from './static-searchable-pages'
import { getSearchablePagesFromOfficialAPI } from './official-api-checker'
import type { SearchIndexItem, IndexStats } from './types'
// import { getSiteMap } from '../get-site-map'

export class SearchIndexer {
  private hybridAPI: HybridNotionAPI
  private indexPath: string
  private indexCache: Map<string, SearchIndexItem> = new Map()
  
  constructor() {
    this.hybridAPI = new HybridNotionAPI()
    // Vercel環境では/tmpディレクトリを使用
    this.indexPath = process.env.VERCEL
      ? path.join('/tmp', 'search-index.json')
      : path.join(process.cwd(), 'data', 'search-index.json')
  }
  
  /**
   * 全ページをクロールしてインデックスを構築
   */
  async buildFullIndex(): Promise<IndexStats> {
    console.log('Building search index...')
    const startTime = Date.now()
    
    try {
      // まず全ページIDを取得
      const rootPageId = '1ceb802cb0c680f29369dba86095fb38'
      console.log('Getting all page IDs...')
      
      // 手動で定義された全ページID（バックアップ用）
      const allPageIds = [
        // メインページ
        '1ceb802cb0c680f29369dba86095fb38', // ホームページ
        '20db802cb0c6809a9c4be362113bc3fa', // 都道府県リスト
        '208b802cb0c6802db085d73f792a895f', // カフェキネシ構造
        '1ceb802cb0c681068bbdd7b2107891f5', // 星ユカリ
        '1ceb802cb0c681b89b3ac07b70b7f37f', // 講座一覧
        '1d3b802cb0c680519714ffd510528bc0', // カフェキネシ公認インストラクター
        '1d3b802cb0c680569ac6e94e37eebfbf', // ブログ
        '1d3b802cb0c6805f959ec180966b2a45', // アロマ購入
        '1d3b802cb0c680b78f23e50d60a8fe4b', // カレンダー
        '1d3b802cb0c680d5a093f49cfd1c675c', // カテゴリー
        '1d3b802cb0c680e48557cffb5e357161', // カフェキネシラバーズ
      ]
      
      // 公式APIで検索対象ページを取得
      console.log('Fetching searchable pages from official API...')
      const officialApiPages = await getSearchablePagesFromOfficialAPI()
      
      // 静的リストと組み合わせ（重複を除去）
      const combinedPageIds = [...new Set([...officialApiPages, ...SEARCHABLE_PAGE_IDS])]
      console.log(`Found ${officialApiPages.length} pages from API, ${SEARCHABLE_PAGE_IDS.length} static pages`)
      
      // 公式APIで取得したページを優先的に使用
      const pageIds = officialApiPages.length > 0 ? officialApiPages : SEARCHABLE_PAGE_IDS
      
      console.log(`Found ${pageIds.length} searchable pages`)
      
      console.log(`\n=== Indexing ${pageIds.length} pages ===`)
      pageIds.forEach(id => console.log(`- ${id}`))
      
      // バッチ処理でインデックスを構築（小さめのバッチサイズでタイムアウト回避）
      const batchSize = 3
      const indexItems: SearchIndexItem[] = []
      
      for (let i = 0; i < pageIds.length; i += batchSize) {
        const batch = pageIds.slice(i, i + batchSize)
        const batchPromises = batch.map(pageId => 
          this.indexPage(pageId).catch(err => {
            console.error(`Failed to index page ${pageId}:`, err)
            return null
          })
        )
        
        const batchResults = await Promise.all(batchPromises)
        indexItems.push(...batchResults.filter((item): item is SearchIndexItem => item !== null))
        
        console.log(`Indexed ${i + batch.length}/${pageIds.length} pages`)
      }
      
      // インデックスを保存
      await this.saveIndex(indexItems)
      
      const stats: IndexStats = {
        totalPages: indexItems.length,
        lastUpdated: new Date().toISOString(),
        officialApiPages: indexItems.filter(item => item.metadata.properties).length,
        unofficialApiPages: indexItems.length,
        hybridPages: indexItems.filter(item => 
          item.metadata.properties && item.content
        ).length
      }
      
      const duration = Date.now() - startTime
      console.log(`Index built successfully in ${duration}ms`)
      console.log(`Stats:`, stats)
      
      return stats
    } catch (error) {
      console.error('Error building index:', error)
      throw error
    }
  }
  
  /**
   * 単一ページをインデックス
   */
  async indexPage(pageId: string): Promise<SearchIndexItem | null> {
    try {
      console.log(`\nIndexing page: ${pageId}`)
      
      const indexItem = await this.hybridAPI.buildSearchIndexItem(pageId)
      
      // ブログページとして有効かチェック
      if (!shouldIndexPage(indexItem.pageId, indexItem.title)) {
        console.log(`\nSkipping non-blog page:`)
        console.log(`  ID: ${indexItem.pageId}`)
        console.log(`  Title: ${indexItem.title}`)
        console.log(`  Reason: Not in whitelist or invalid title`);
        return null;
      }
      
      console.log(`\nIndexing page:`)
      console.log(`  ID: ${indexItem.pageId}`)
      console.log(`  Title: ${indexItem.title}`)
      
      this.indexCache.set(pageId, indexItem)
      return indexItem
    } catch (error) {
      console.error(`Error indexing page ${pageId}:`, error)
      return null
    }
  }
  
  /**
   * インクリメンタル更新（単一ページ）
   */
  async updatePageIndex(pageId: string): Promise<void> {
    try {
      // 既存のインデックスを読み込み
      const index = await this.loadIndex()
      
      // ページを再インデックス
      const updatedItem = await this.indexPage(pageId)
      if (!updatedItem) return
      
      // インデックスを更新
      const existingIndex = index.findIndex(item => item.pageId === pageId)
      if (existingIndex >= 0) {
        index[existingIndex] = updatedItem
      } else {
        index.push(updatedItem)
      }
      
      // 保存
      await this.saveIndex(index)
      console.log(`Updated index for page ${pageId}`)
    } catch (error) {
      console.error(`Error updating page index for ${pageId}:`, error)
      throw error
    }
  }
  
  /**
   * 複数ページのバッチ更新
   */
  async updatePagesIndex(pageIds: string[]): Promise<void> {
    try {
      const index = await this.loadIndex()
      const indexMap = new Map(index.map(item => [item.pageId, item]))
      
      // 並行してページを更新
      const updatePromises = pageIds.map(pageId => 
        this.indexPage(pageId).catch(err => {
          console.error(`Failed to update index for ${pageId}:`, err)
          return null
        })
      )
      
      const updatedItems = await Promise.all(updatePromises)
      
      // インデックスマップを更新
      for (const item of updatedItems) {
        if (item) {
          indexMap.set(item.pageId, item)
        }
      }
      
      // 配列に変換して保存
      const newIndex = Array.from(indexMap.values())
      await this.saveIndex(newIndex)
      
      console.log(`Updated index for ${pageIds.length} pages`)
    } catch (error) {
      console.error('Error updating pages index:', error)
      throw error
    }
  }
  
  /**
   * インデックスをファイルに保存
   */
  private async saveIndex(index: SearchIndexItem[]): Promise<void> {
    try {
      // メモリキャッシュに保存（Vercel対応）
      memoryCache.setSearchIndex(index)
      
      // ファイルシステムにも保存を試みる
      try {
        // ディレクトリが存在しない場合は作成
        const dir = path.dirname(this.indexPath)
        await fs.mkdir(dir, { recursive: true })
        
        // JSONとして保存
        const jsonContent = JSON.stringify(index, null, 2)
        await fs.writeFile(this.indexPath, jsonContent, 'utf-8')
      } catch (fsError) {
        // ファイルシステムへの保存が失敗してもメモリキャッシュがあれば続行
        console.log('Could not save to file system, using memory cache only:', fsError.message)
      }
      
      // キャッシュを更新
      this.indexCache.clear()
      index.forEach(item => this.indexCache.set(item.pageId, item))
    } catch (error) {
      console.error('Error saving index:', error)
      throw error
    }
  }
  
  /**
   * インデックスをファイルから読み込み
   */
  async loadIndex(): Promise<SearchIndexItem[]> {
    // まずメモリキャッシュをチェック
    if (memoryCache.hasSearchIndex()) {
      const index = memoryCache.getSearchIndex()
      console.log(`Loaded ${index.length} items from memory cache`)
      
      // ローカルキャッシュも更新
      this.indexCache.clear()
      index.forEach(item => this.indexCache.set(item.pageId, item))
      
      return index
    }
    
    // メモリキャッシュになければファイルから読み込み
    try {
      const content = await fs.readFile(this.indexPath, 'utf-8')
      const index = JSON.parse(content) as SearchIndexItem[]
      
      // メモリキャッシュとローカルキャッシュを更新
      memoryCache.setSearchIndex(index)
      this.indexCache.clear()
      index.forEach(item => this.indexCache.set(item.pageId, item))
      
      console.log(`Loaded ${index.length} items from file`)
      return index
    } catch (error) {
      // ファイルが存在しない場合は空配列を返す
      if ((error as any).code === 'ENOENT') {
        console.log('Index file not found, returning empty index')
        return []
      }
      console.error('Error loading index:', error)
      throw error
    }
  }
  
  /**
   * キャッシュからインデックスアイテムを取得
   */
  getFromCache(pageId: string): SearchIndexItem | undefined {
    return this.indexCache.get(pageId)
  }
  
  /**
   * インデックスの統計情報を取得
   */
  async getIndexStats(): Promise<IndexStats> {
    const index = await this.loadIndex()
    
    return {
      totalPages: index.length,
      lastUpdated: index.length > 0 
        ? Math.max(...index.map(item => new Date(item.lastIndexed).getTime()))
          .toString()
        : new Date().toISOString(),
      officialApiPages: index.filter(item => item.metadata.properties).length,
      unofficialApiPages: index.length,
      hybridPages: index.filter(item => 
        item.metadata.properties && item.content
      ).length
    }
  }
  
  /**
   * インデックスの有効性をチェック
   */
  async isIndexValid(maxAge: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    try {
      const stats = await fs.stat(this.indexPath)
      const age = Date.now() - stats.mtime.getTime()
      return age < maxAge
    } catch {
      return false
    }
  }
  
  /**
   * 古いインデックスエントリをクリーンアップ
   */
  async cleanupOldEntries(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const index = await this.loadIndex()
    const cutoffDate = new Date(Date.now() - maxAge)
    
    const newIndex = index.filter(item => 
      new Date(item.lastIndexed) > cutoffDate
    )
    
    const removedCount = index.length - newIndex.length
    if (removedCount > 0) {
      await this.saveIndex(newIndex)
      console.log(`Removed ${removedCount} old index entries`)
    }
    
    return removedCount
  }
}