// Notion Renderer Micro Frontend Configuration
// React Notion Xを隔離した独立アプリケーション

export const notionRendererConfig = {
  name: 'notionRenderer',
  filename: 'remoteEntry.js',
  exposes: {
    './NotionPage': './components/NotionPageIsolated',
    './NotionBlocks': './components/NotionBlocks',
    './NotionSearch': './components/NotionSearch',
  },
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^18.2.0',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^18.2.0',
    },
    // React Notion Xは共有しない（隔離のため）
  },
};

// Notion特化の最適化設定
export const optimizationConfig = {
  // ブロックタイプ別の動的インポート
  blockLoaders: {
    text: () => import('./blocks/TextBlock'),
    heading: () => import('./blocks/HeadingBlock'),
    image: () => import('./blocks/ImageBlock'),
    code: () => import('./blocks/CodeBlock'),
    equation: () => import('./blocks/EquationBlock'),
    toggle: () => import('./blocks/ToggleBlock'),
    collection_view: () => import('./blocks/CollectionViewBlock'),
    // 使用頻度の低いブロックは遅延ロード
    pdf: () => import(/* webpackPrefetch: true */ './blocks/PDFBlock'),
    video: () => import(/* webpackPrefetch: true */ './blocks/VideoBlock'),
    embed: () => import(/* webpackPrefetch: true */ './blocks/EmbedBlock'),
  },
  
  // レンダリング戦略
  renderingStrategy: {
    // Critical Path Rendering
    criticalBlocks: ['text', 'heading', 'image'],
    // Progressive Enhancement
    enhancementOrder: ['code', 'equation', 'toggle', 'collection_view'],
    // Lazy blocks
    lazyBlocks: ['pdf', 'video', 'embed', 'audio', 'file'],
  },
  
  // パフォーマンス設定
  performance: {
    // Virtual Scrolling
    enableVirtualScrolling: true,
    virtualScrollThreshold: 50, // 50ブロック以上で有効化
    
    // Intersection Observer
    observerOptions: {
      rootMargin: '200px',
      threshold: 0.01,
    },
    
    // メモリ管理
    maxCachedBlocks: 1000,
    gcInterval: 60000, // 1分ごとにガベージコレクション
  },
};

// 独自のビルドパイプライン設定
export const buildConfig = {
  // Webpack設定のオーバーライド
  webpack: (config) => {
    // React Notion X専用の最適化
    config.module.rules.push({
      test: /react-notion-x/,
      sideEffects: false,
    });
    
    // 未使用のNotionブロックを除外
    config.plugins.push({
      apply: (compiler) => {
        compiler.hooks.normalModuleFactory.tap('NotionTreeShaking', (nmf) => {
          nmf.hooks.beforeResolve.tap('NotionTreeShaking', (result) => {
            if (result.request.includes('react-notion-x') && 
                result.request.includes('third-party')) {
              // 使用していないサードパーティ統合を除外
              const unused = ['pdf', 'collection', 'equation'];
              if (unused.some(u => result.request.includes(u))) {
                return false;
              }
            }
            return result;
          });
        });
      },
    });
    
    return config;
  },
  
  // Babel設定
  babel: {
    presets: [
      ['@babel/preset-react', {
        runtime: 'automatic',
        importSource: '@emotion/react',
      }],
    ],
    plugins: [
      // Dead code elimination
      'babel-plugin-transform-remove-console',
      'babel-plugin-transform-remove-debugger',
    ],
  },
};

// API通信の最適化
export const apiConfig = {
  // GraphQL エンドポイント
  graphqlEndpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '/api/graphql',
  
  // バッチング設定
  batching: {
    enabled: true,
    maxBatchSize: 10,
    batchInterval: 50, // 50ms
  },
  
  // データローダー設定
  dataLoader: {
    cache: true,
    maxCacheSize: 100,
    ttl: 300000, // 5分
  },
  
  // Persisted Queries
  persistedQueries: {
    enabled: true,
    hash: 'sha256',
  },
};

// メトリクス収集
export const metricsConfig = {
  // パフォーマンスメトリクス
  performance: {
    trackRenderTime: true,
    trackBlockLoadTime: true,
    trackInteractionTime: true,
  },
  
  // エラー追跡
  errorTracking: {
    enabled: true,
    sampleRate: 0.1, // 10%サンプリング
  },
  
  // カスタムメトリクス
  custom: {
    blockRenderCount: true,
    cacheHitRate: true,
    apiResponseTime: true,
  },
};