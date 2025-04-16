import { ViewTab } from '../components/NotionViewTabs';

// Notionのメインデータベースビュー設定
// 注意: 実際のNotionビューIDとページIDに置き換えてください
export const notionViews: ViewTab[] = [
  { 
    id: 'all', 
    name: 'すべて', 
    path: '/', 
    // メインページID（site.config.tsのrootNotionPageIdと同じ）
    pageId: '1d7b802cb0c680fd84b4f669f3f1160f'
  },
  { 
    id: 'blog', 
    name: 'ブログ', 
    path: '/view/blog',
    // ブログカテゴリのビューID（Notionで作成したビューのID）
    pageId: '1d7b802cb0c680fd84b4f669f3f1160f?v=1d7b802cb0c680b38c25000cd94246a7' // What's Newデータベースのビュー
  },
  { 
    id: 'website', 
    name: 'Webサイト', 
    path: '/view/website',
    pageId: '1d7b802cb0c680fd84b4f669f3f1160f?v=1d7b802cb0c680b38c25000cd94246a7' // What's Newデータベースのビュー
  },
  { 
    id: 'profile', 
    name: 'プロフィール', 
    path: '/view/profile',
    pageId: '1d7b802cb0c680fd84b4f669f3f1160f?v=1d7b802cb0c680b38c25000cd94246a7' // What's Newデータベースのビュー
  },
  { 
    id: 'new', 
    name: '新着順', 
    path: '/view/new',
    pageId: '1d7b802cb0c680fd84b4f669f3f1160f?v=1d7b802cb0c680b38c25000cd94246a7' // What's Newデータベースのビュー
  }
];

// 各ビューIDとページIDのマッピング
export const viewPageIds: Record<string, string> = notionViews.reduce((acc, view) => {
  if (view.id !== 'all') {
    acc[view.id] = view.pageId || '';
  }
  return acc;
}, {} as Record<string, string>);
