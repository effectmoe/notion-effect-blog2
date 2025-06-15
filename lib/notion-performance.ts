import { getPageProperty, getBlockTitle } from 'notion-utils';
import * as types from 'notion-types';
import pLimit from 'p-limit';
import { getPage } from './notion';

// 並列処理の制限
const limit = pLimit(5); // 最大5つの並列リクエスト

// ページの依存関係を事前に解析して並列で取得
export async function getPageWithDependencies(pageId: string) {
  // メインページを取得
  const recordMap = await getPage(pageId);
  
  // 関連するページIDを抽出
  const relatedPageIds = new Set<string>();
  
  // ブロック内のページ参照を探す
  Object.values(recordMap.block).forEach(block => {
    const b = block.value;
    if (b?.type === 'page' && b.id !== pageId) {
      relatedPageIds.add(b.id);
    }
    // リンクされたページも探す
    if (b?.properties?.title) {
      const title = getBlockTitle(b, recordMap);
      // Notion内部リンクのパターンを検出
      const matches = title.matchAll(/\[\[([a-f0-9-]+)\]\]/g);
      for (const match of matches) {
        relatedPageIds.add(match[1]);
      }
    }
  });
  
  // 関連ページを並列で取得
  if (relatedPageIds.size > 0) {
    const relatedPages = await Promise.all(
      Array.from(relatedPageIds).map(id => 
        limit(() => getPage(id).catch(() => null))
      )
    );
    
    // 結果をマージ（エラーは無視）
    relatedPages.forEach(related => {
      if (related) {
        Object.assign(recordMap.block, related.block);
        Object.assign(recordMap.collection, related.collection || {});
        Object.assign(recordMap.collection_view, related.collection_view || {});
      }
    });
  }
  
  return recordMap;
}

// データベースクエリの最適化
export async function getOptimizedDatabasePages(
  databaseId: string,
  limit: number = 10
) {
  // データベースのスキーマを先に取得
  const schema = await getPage(databaseId);
  
  // 必要なプロパティのみを指定してクエリ
  const queryParams = {
    collection_id: databaseId,
    collection_view_id: Object.keys(schema.collection_view || {})[0],
    loader: {
      type: 'table',
      limit,
      searchQuery: '',
      userTimeZone: 'Asia/Tokyo',
      loadContentCover: true,
      // 必要なプロパティのみロード
      propertiesToLoad: ['title', 'slug', 'date', 'status', 'authors']
    }
  };
  
  return queryParams;
}

// プリフェッチング戦略
export class PrefetchManager {
  private prefetchedPages = new Map<string, Promise<any>>();
  
  // ページを事前読み込み
  prefetch(pageId: string) {
    if (!this.prefetchedPages.has(pageId)) {
      this.prefetchedPages.set(pageId, getPage(pageId));
    }
  }
  
  // 複数ページを事前読み込み
  prefetchMany(pageIds: string[]) {
    pageIds.forEach(id => this.prefetch(id));
  }
  
  // 事前読み込みしたページを取得
  async get(pageId: string) {
    const cached = this.prefetchedPages.get(pageId);
    if (cached) {
      return await cached;
    }
    return getPage(pageId);
  }
  
  // メモリをクリア
  clear() {
    this.prefetchedPages.clear();
  }
}

// グローバルなプリフェッチマネージャー
export const prefetchManager = new PrefetchManager();