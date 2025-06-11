import DataLoader from 'dataloader';
import { notion } from '@/lib/notion-api';
import cache from '@/lib/cache';

// DataLoaderインスタンス（N+1問題の解決）
const createLoaders = () => ({
  // ページローダー
  pageLoader: new DataLoader(async (pageIds) => {
    console.log(`Batch loading ${pageIds.length} pages`);
    
    const pages = await Promise.all(
      pageIds.map(async (id) => {
        // キャッシュチェック
        const cached = await cache.get(`graphql:page:${id}`);
        if (cached) return cached;
        
        // Notion APIから取得
        const page = await notion.getPage(id);
        
        // キャッシュに保存
        await cache.set(`graphql:page:${id}`, page, 3600);
        
        return page;
      })
    );
    
    return pages;
  }, {
    // バッチング設定
    batchScheduleFn: (callback) => setTimeout(callback, 10),
    maxBatchSize: 50,
    cache: true,
  }),
  
  // ブロックローダー
  blockLoader: new DataLoader(async (blockIds) => {
    const blocks = await notion.getBlocks(blockIds);
    return blockIds.map(id => blocks[id] || null);
  }),
  
  // ユーザーローダー
  userLoader: new DataLoader(async (userIds) => {
    const users = await notion.getUsers(userIds);
    return userIds.map(id => users[id] || null);
  }),
});

// リゾルバー定義
export const resolvers = {
  Query: {
    // 単一ページ取得
    notionPage: async (_, { id }, { loaders }) => {
      return loaders.pageLoader.load(id);
    },
    
    // 複数ページ取得
    notionPages: async (_, { ids }, { loaders }) => {
      return loaders.pageLoader.loadMany(ids);
    },
    
    // 検索
    searchNotionPages: async (_, { query, limit, offset }) => {
      const cacheKey = `graphql:search:${query}:${limit}:${offset}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
      
      const results = await notion.search({
        query,
        limit,
        start_cursor: offset,
      });
      
      await cache.set(cacheKey, results, 600); // 10分キャッシュ
      
      return {
        pages: results.results,
        totalCount: results.total,
        highlights: extractHighlights(results),
      };
    },
    
    // サイトマップ用
    allPageIds: async () => {
      const cached = await cache.get('graphql:allPageIds');
      if (cached) return cached;
      
      const siteMap = await notion.getSiteMap();
      const pageIds = Object.keys(siteMap);
      
      await cache.set('graphql:allPageIds', pageIds, 3600);
      
      return pageIds;
    },
    
    // ページ更新チェック
    pageLastModified: async (_, { id }) => {
      const page = await notion.getPage(id);
      return page?.last_edited_time;
    },
  },
  
  NotionPage: {
    // ブロックの遅延読み込み
    blocks: async (page, { first, after, type }, { loaders }) => {
      const allBlocks = Object.values(page.block || {});
      
      // フィルタリング
      let filteredBlocks = allBlocks;
      if (type && type.length > 0) {
        filteredBlocks = allBlocks.filter(block => 
          type.includes(block.value?.type?.toUpperCase())
        );
      }
      
      // ページネーション
      const startIndex = after ? parseInt(after, 10) : 0;
      const endIndex = first ? startIndex + first : filteredBlocks.length;
      const paginatedBlocks = filteredBlocks.slice(startIndex, endIndex);
      
      return {
        edges: paginatedBlocks.map((block, index) => ({
          node: block.value,
          cursor: String(startIndex + index),
        })),
        pageInfo: {
          hasNextPage: endIndex < filteredBlocks.length,
          hasPreviousPage: startIndex > 0,
          startCursor: String(startIndex),
          endCursor: String(endIndex - 1),
        },
        totalCount: filteredBlocks.length,
      };
    },
    
    // 重要コンテンツの抽出
    criticalContent: async (page) => {
      const title = page.properties?.title?.[0]?.[0] || 'Untitled';
      const blocks = Object.values(page.block || {});
      
      // 最初のテキストブロックを探す
      const firstTextBlock = blocks.find(b => 
        b.value?.type === 'text' && b.value?.properties?.title
      );
      const firstParagraph = firstTextBlock?.value?.properties?.title?.[0]?.[0];
      
      // ヒーロー画像を探す
      const imageBlock = blocks.find(b => b.value?.type === 'image');
      const heroImage = imageBlock ? {
        url: imageBlock.value?.properties?.source?.[0]?.[0],
        width: imageBlock.value?.format?.block_width,
        height: imageBlock.value?.format?.block_height,
      } : null;
      
      // 読了時間の推定（200文字/分）
      const totalText = blocks
        .filter(b => b.value?.properties?.title)
        .map(b => b.value.properties.title.flat().join(''))
        .join(' ');
      const estimatedReadTime = Math.ceil(totalText.length / 200);
      
      return {
        title,
        description: page.properties?.description?.[0]?.[0],
        firstParagraph,
        heroImage,
        estimatedReadTime,
        lastEditedTime: page.last_edited_time,
      };
    },
    
    // メタデータ
    metadata: async (page, _, { loaders }) => {
      return {
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        createdBy: page.created_by_id ? 
          await loaders.userLoader.load(page.created_by_id) : null,
        lastEditedBy: page.last_edited_by_id ? 
          await loaders.userLoader.load(page.last_edited_by_id) : null,
        cover: page.format?.page_cover ? {
          url: page.format.page_cover,
        } : null,
        icon: page.format?.page_icon,
        properties: page.properties,
      };
    },
    
    // 事前レンダリングHTML（オプション）
    renderedHTML: async (page) => {
      const cacheKey = `graphql:rendered:${page.id}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
      
      // ここでサーバーサイドレンダリングを実行
      // const html = await renderNotionPage(page);
      // await cache.set(cacheKey, html, 3600);
      // return html;
      
      return null; // 実装は別途
    },
    
    // ページ複雑度の計算
    complexity: (page) => {
      const blocks = Object.values(page.block || {});
      const hasDatabase = blocks.some(b => b.value?.type === 'collection_view');
      const hasEmbed = blocks.some(b => 
        ['embed', 'video', 'pdf'].includes(b.value?.type)
      );
      
      if (hasDatabase || hasEmbed) return 'COMPLEX';
      if (blocks.length > 50) return 'MEDIUM';
      return 'SIMPLE';
    },
  },
  
  Mutation: {
    // キャッシュ無効化
    invalidatePageCache: async (_, { id }) => {
      await cache.invalidate(`graphql:page:${id}`);
      await cache.invalidate(`notion:page:${id}`);
      return true;
    },
    
    // ページのプリフェッチ
    prefetchPage: async (_, { id }, { loaders }) => {
      try {
        await loaders.pageLoader.load(id);
        return true;
      } catch (error) {
        console.error('Prefetch failed:', error);
        return false;
      }
    },
  },
  
  Subscription: {
    // ページ更新の監視（WebSocket実装が必要）
    pageUpdated: {
      subscribe: (_, { id }) => {
        // PubSubやWebSocketの実装
        // return pubsub.asyncIterator(`PAGE_UPDATED_${id}`);
      },
    },
  },
};

// ヘルパー関数
function extractHighlights(searchResults) {
  return searchResults.results.map(result => ({
    pageId: result.id,
    blockId: result.highlight?.block_id,
    text: result.highlight?.text,
    context: result.highlight?.context,
  })).filter(h => h.text);
}

// GraphQLコンテキスト生成
export function createGraphQLContext(req) {
  return {
    loaders: createLoaders(),
    user: req.user,
    ip: req.ip,
  };
}