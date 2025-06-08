// lib/color-customizer/color-settings.js

export const colorSettings = {
  // ページ全体
  page: {
    backgroundColor: '#ffffff',
    textColor: '#374151',
    className: 'body, .notion-app-inner'
  },
  
  // ヘッダー・ナビゲーション
  header: {
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
    className: '.notion-header, .header'
  },
  
  // ページタイトル
  pageTitle: {
    backgroundColor: 'transparent',
    textColor: '#111827',
    className: '.notion-page-title-text'
  },
  
  // 見出し1
  heading1: {
    backgroundColor: 'transparent',
    textColor: '#1f2937',
    className: '.notion-header-block'
  },
  
  // 見出し2
  heading2: {
    backgroundColor: 'transparent',
    textColor: '#374151',
    className: '.notion-sub_header-block'
  },
  
  // 見出し3
  heading3: {
    backgroundColor: 'transparent',
    textColor: '#4b5563',
    className: '.notion-sub_sub_header-block'
  },
  
  // 本文
  text: {
    backgroundColor: 'transparent',
    textColor: '#374151',
    className: '.notion-text-block'
  },
  
  // リンク
  link: {
    backgroundColor: 'transparent',
    textColor: '#3b82f6',
    hoverColor: '#2563eb',
    className: '.notion-link'
  },
  
  // コードブロック
  codeBlock: {
    backgroundColor: '#f3f4f6',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
    className: '.notion-code-block'
  },
  
  // インラインコード
  inlineCode: {
    backgroundColor: '#f3f4f6',
    textColor: '#dc2626',
    className: '.notion-inline-code'
  },
  
  // 引用
  quote: {
    backgroundColor: '#f9fafb',
    textColor: '#4b5563',
    borderColor: '#9ca3af',
    className: '.notion-quote-block'
  },
  
  // コールアウト
  callout: {
    backgroundColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#fbbf24',
    className: '.notion-callout-block'
  },
  
  // トグル
  toggle: {
    backgroundColor: 'transparent',
    textColor: '#374151',
    hoverBackgroundColor: '#f9fafb',
    className: '.notion-toggle'
  },
  
  // テーブル
  table: {
    backgroundColor: '#ffffff',
    textColor: '#374151',
    borderColor: '#e5e7eb',
    headerBackgroundColor: '#f9fafb',
    className: '.notion-table'
  },
  
  // リストアイテム（データベース）
  listItem: {
    backgroundColor: '#ffffff',
    textColor: '#374151',
    hoverBackgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    className: '.notion-list-item'
  },
  
  // ギャラリーカード
  galleryCard: {
    backgroundColor: '#ffffff',
    textColor: '#374151',
    hoverBackgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    className: '.notion-gallery-card'
  },
  
  // サイドバー
  sidebar: {
    backgroundColor: '#f9fafb',
    textColor: '#374151',
    borderColor: '#e5e7eb',
    className: '.notion-aside'
  },
  
  // フッター
  footer: {
    backgroundColor: '#f3f4f6',
    textColor: '#6b7280',
    borderColor: '#e5e7eb',
    className: '.footer'
  },
  
  // ボタン
  button: {
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    hoverBackgroundColor: '#2563eb',
    borderColor: 'transparent',
    className: '.notion-button'
  },
  
  // 選択時のハイライト
  selection: {
    backgroundColor: '#ddd6fe',
    textColor: '#1f2937',
    className: '::selection'
  }
};

// カラープリセット
export const colorPresets = {
  default: {
    name: 'デフォルト',
    description: '標準的な配色',
    settings: { ...colorSettings }
  },
  dark: {
    name: 'ダークモード',
    description: '目に優しいダークテーマ',
    settings: {
      page: { backgroundColor: '#0f172a', textColor: '#e2e8f0', className: 'body, .notion-app-inner' },
      header: { backgroundColor: '#1e293b', textColor: '#f1f5f9', borderColor: '#334155', className: '.notion-header, .header' },
      pageTitle: { backgroundColor: 'transparent', textColor: '#f1f5f9', className: '.notion-page-title-text' },
      heading1: { backgroundColor: 'transparent', textColor: '#e2e8f0', className: '.notion-header-block' },
      heading2: { backgroundColor: 'transparent', textColor: '#cbd5e1', className: '.notion-sub_header-block' },
      heading3: { backgroundColor: 'transparent', textColor: '#94a3b8', className: '.notion-sub_sub_header-block' },
      text: { backgroundColor: 'transparent', textColor: '#cbd5e1', className: '.notion-text-block' },
      link: { backgroundColor: 'transparent', textColor: '#60a5fa', hoverColor: '#93c5fd', className: '.notion-link' },
      codeBlock: { backgroundColor: '#1e293b', textColor: '#e2e8f0', borderColor: '#334155', className: '.notion-code-block' },
      inlineCode: { backgroundColor: '#334155', textColor: '#f87171', className: '.notion-inline-code' },
      quote: { backgroundColor: '#1e293b', textColor: '#94a3b8', borderColor: '#475569', className: '.notion-quote-block' },
      callout: { backgroundColor: '#422006', textColor: '#fbbf24', borderColor: '#92400e', className: '.notion-callout-block' },
      toggle: { backgroundColor: 'transparent', textColor: '#cbd5e1', hoverBackgroundColor: '#1e293b', className: '.notion-toggle' },
      table: { backgroundColor: '#1e293b', textColor: '#cbd5e1', borderColor: '#334155', headerBackgroundColor: '#0f172a', className: '.notion-table' },
      listItem: { backgroundColor: '#1e293b', textColor: '#cbd5e1', hoverBackgroundColor: '#334155', borderColor: '#334155', className: '.notion-list-item' },
      galleryCard: { backgroundColor: '#1e293b', textColor: '#cbd5e1', hoverBackgroundColor: '#334155', borderColor: '#334155', className: '.notion-gallery-card' },
      sidebar: { backgroundColor: '#1e293b', textColor: '#cbd5e1', borderColor: '#334155', className: '.notion-aside' },
      footer: { backgroundColor: '#0f172a', textColor: '#64748b', borderColor: '#334155', className: '.footer' },
      button: { backgroundColor: '#3b82f6', textColor: '#ffffff', hoverBackgroundColor: '#2563eb', borderColor: 'transparent', className: '.notion-button' },
      selection: { backgroundColor: '#4c1d95', textColor: '#f3f4f6', className: '::selection' }
    }
  },
  sepia: {
    name: 'セピア',
    description: '温かみのある配色',
    settings: {
      page: { backgroundColor: '#fef6e4', textColor: '#5c4b3a', className: 'body, .notion-app-inner' },
      header: { backgroundColor: '#fef6e4', textColor: '#5c4b3a', borderColor: '#e8d5b7', className: '.notion-header, .header' },
      pageTitle: { backgroundColor: 'transparent', textColor: '#3e3426', className: '.notion-page-title-text' },
      heading1: { backgroundColor: 'transparent', textColor: '#3e3426', className: '.notion-header-block' },
      heading2: { backgroundColor: 'transparent', textColor: '#5c4b3a', className: '.notion-sub_header-block' },
      heading3: { backgroundColor: 'transparent', textColor: '#7a6555', className: '.notion-sub_sub_header-block' },
      text: { backgroundColor: 'transparent', textColor: '#5c4b3a', className: '.notion-text-block' },
      link: { backgroundColor: 'transparent', textColor: '#b87333', hoverColor: '#a0602c', className: '.notion-link' },
      codeBlock: { backgroundColor: '#f8f0dc', textColor: '#5c4b3a', borderColor: '#e8d5b7', className: '.notion-code-block' },
      inlineCode: { backgroundColor: '#f8f0dc', textColor: '#c65d00', className: '.notion-inline-code' },
      quote: { backgroundColor: '#f8f0dc', textColor: '#7a6555', borderColor: '#d4af86', className: '.notion-quote-block' },
      callout: { backgroundColor: '#fff4e6', textColor: '#8b5a00', borderColor: '#ffa500', className: '.notion-callout-block' },
      toggle: { backgroundColor: 'transparent', textColor: '#5c4b3a', hoverBackgroundColor: '#f8f0dc', className: '.notion-toggle' },
      table: { backgroundColor: '#fef6e4', textColor: '#5c4b3a', borderColor: '#e8d5b7', headerBackgroundColor: '#f8f0dc', className: '.notion-table' },
      listItem: { backgroundColor: '#fef6e4', textColor: '#5c4b3a', hoverBackgroundColor: '#f8f0dc', borderColor: '#e8d5b7', className: '.notion-list-item' },
      galleryCard: { backgroundColor: '#fef6e4', textColor: '#5c4b3a', hoverBackgroundColor: '#f8f0dc', borderColor: '#e8d5b7', className: '.notion-gallery-card' },
      sidebar: { backgroundColor: '#f8f0dc', textColor: '#5c4b3a', borderColor: '#e8d5b7', className: '.notion-aside' },
      footer: { backgroundColor: '#f8f0dc', textColor: '#7a6555', borderColor: '#e8d5b7', className: '.footer' },
      button: { backgroundColor: '#b87333', textColor: '#ffffff', hoverBackgroundColor: '#a0602c', borderColor: 'transparent', className: '.notion-button' },
      selection: { backgroundColor: '#f4a460', textColor: '#3e3426', className: '::selection' }
    }
  }
};