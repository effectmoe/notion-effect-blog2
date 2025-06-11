// Shell Application Configuration
// マイクロフロントエンドのコアシェル設定

export const shellConfig = {
  name: 'shell',
  filename: 'remoteEntry.js',
  exposes: {
    './Header': './components/Header',
    './Footer': './components/Footer',
    './Navigation': './components/HeaderMenu',
    './SharedComponents': './lib/shared-components',
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
    next: {
      singleton: true,
      requiredVersion: '^15.2.0',
    },
  },
  remotes: {
    notionRenderer: 'notionRenderer@http://localhost:3001/remoteEntry.js',
    adminPanel: 'adminPanel@http://localhost:3002/remoteEntry.js',
  },
};

// 共有コンポーネントのレジストリ
export const componentRegistry = {
  // グローバルに共有されるコンポーネント
  shared: {
    Loading: () => import('@/components/Loading'),
    ErrorPage: () => import('@/components/ErrorPage'),
    PageHead: () => import('@/components/PageHead'),
  },
  
  // 認証関連
  auth: {
    AuthProvider: () => import('@/lib/auth-context'),
    ProtectedRoute: () => import('@/components/ProtectedRoute'),
  },
  
  // レイアウト関連
  layout: {
    PageLayout: () => import('@/components/PageLayout'),
    Sidebar: () => import('@/components/PageAside'),
  },
};

// ルーティング設定
export const routingConfig = {
  // マイクロフロントエンドごとのルート定義
  routes: {
    '/': 'shell',
    '/notion/*': 'notionRenderer',
    '/admin/*': 'adminPanel',
    '/api/*': 'shell', // APIはシェルで管理
  },
  
  // ダイナミックローディング設定
  loadingStrategies: {
    notionRenderer: 'lazy', // 必要時にロード
    adminPanel: 'onDemand', // 明示的にロード
  },
};

// 状態管理の設定
export const stateConfig = {
  // グローバル状態
  globalState: {
    user: null,
    theme: 'light',
    locale: 'ja',
    notifications: [],
  },
  
  // マイクロフロントエンド間の通信
  eventBus: {
    channels: [
      'auth-change',
      'theme-change',
      'notification',
      'data-update',
    ],
  },
};

// セキュリティ設定
export const securityConfig = {
  // CSP設定
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'localhost:*'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'localhost:*', 'https://*.notion.so'],
  },
  
  // CORS設定
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  },
};