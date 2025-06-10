import React, { Suspense, useDeferredValue, useTransition, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import dynamic from 'next/dynamic';

// コンポーネントの優先度別動的インポート
const NotionPageShell = lazy(() => import('./NotionPageShell'));
const NotionContent = lazy(() => import('./NotionContent'));
const NotionSidebar = lazy(() => import('./NotionSidebar'));
const NotionComments = lazy(() => import('./NotionComments'));

// ローディングコンポーネント
const PageShellLoader = () => (
  <div className="notion-page-shell-loader animate-pulse">
    <div className="h-16 bg-gray-200 rounded mb-4" />
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
);

const ContentLoader = () => (
  <div className="notion-content-loader animate-pulse">
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

const SidebarLoader = () => (
  <div className="notion-sidebar-loader animate-pulse">
    <div className="h-32 bg-gray-200 rounded" />
  </div>
);

// エラーフォールバック
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-boundary p-8 text-center">
    <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
    <p className="text-gray-600 mb-4">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      再試行
    </button>
  </div>
);

// メインのConcurrent Notionページコンポーネント
export default function ConcurrentNotionPage({ 
  pageId, 
  recordMap,
  searchQuery = '',
  onNavigate 
}) {
  // 検索クエリの遅延値（パフォーマンス最適化）
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  // ページ遷移のトランジション管理
  const [isPending, startTransition] = useTransition();
  
  // ナビゲーションハンドラー
  const handleNavigation = (targetPageId) => {
    startTransition(() => {
      onNavigate(targetPageId);
    });
  };
  
  return (
    <div className={`notion-page-concurrent ${isPending ? 'opacity-50' : ''}`}>
      {/* レベル1: ページシェル（最高優先度） */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<PageShellLoader />}>
          <NotionPageShell 
            pageId={pageId}
            recordMap={recordMap}
            onNavigate={handleNavigation}
          />
        </Suspense>
      </ErrorBoundary>
      
      <div className="notion-page-layout flex gap-8">
        {/* レベル2: メインコンテンツ（高優先度） */}
        <main className="notion-page-content flex-1">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<ContentLoader />}>
              <NotionContent
                pageId={pageId}
                recordMap={recordMap}
                searchQuery={deferredSearchQuery}
              />
            </Suspense>
          </ErrorBoundary>
        </main>
        
        {/* レベル3: サイドバー（中優先度） */}
        <aside className="notion-page-sidebar w-80">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<SidebarLoader />}>
              <NotionSidebar
                pageId={pageId}
                recordMap={recordMap}
              />
            </Suspense>
          </ErrorBoundary>
        </aside>
      </div>
      
      {/* レベル4: コメント（低優先度） */}
      <section className="notion-page-comments mt-12">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div>コメントを読み込み中...</div>}>
            <NotionComments
              pageId={pageId}
              recordMap={recordMap}
            />
          </Suspense>
        </ErrorBoundary>
      </section>
      
      {/* ペンディング状態のインジケーター */}
      {isPending && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse" />
      )}
    </div>
  );
}

// 個別コンポーネントの実装例

// ページシェル（即座に表示）
export function NotionPageShell({ pageId, recordMap, onNavigate }) {
  const page = recordMap?.block?.[pageId]?.value;
  
  if (!page) return null;
  
  return (
    <header className="notion-page-header">
      <nav className="notion-breadcrumb">
        {/* パンくずリスト */}
      </nav>
      <h1 className="notion-title text-4xl font-bold">
        {page.properties?.title?.[0]?.[0] || 'Untitled'}
      </h1>
      <div className="notion-page-meta text-gray-600">
        最終更新: {new Date(page.last_edited_time).toLocaleString('ja-JP')}
      </div>
    </header>
  );
}

// メインコンテンツ（優先的にレンダリング）
export function NotionContent({ pageId, recordMap, searchQuery }) {
  const [highlightedBlocks, setHighlightedBlocks] = React.useState(new Set());
  
  // 検索クエリに基づくハイライト処理（遅延実行）
  React.useEffect(() => {
    if (!searchQuery) {
      setHighlightedBlocks(new Set());
      return;
    }
    
    // startTransitionで低優先度タスクとして実行
    React.startTransition(() => {
      const blocks = Object.values(recordMap.block || {});
      const matches = new Set();
      
      blocks.forEach(block => {
        const text = block.value?.properties?.title?.flat().join('') || '';
        if (text.toLowerCase().includes(searchQuery.toLowerCase())) {
          matches.add(block.value.id);
        }
      });
      
      setHighlightedBlocks(matches);
    });
  }, [searchQuery, recordMap]);
  
  return (
    <div className="notion-content">
      {/* ブロックの動的レンダリング */}
      <NotionBlockRenderer
        recordMap={recordMap}
        highlightedBlocks={highlightedBlocks}
      />
    </div>
  );
}

// ブロックレンダラー（Concurrent機能を活用）
function NotionBlockRenderer({ recordMap, highlightedBlocks }) {
  const blocks = Object.values(recordMap.block || {});
  
  return (
    <>
      {blocks.map((block) => (
        <BlockWrapper
          key={block.value.id}
          block={block}
          isHighlighted={highlightedBlocks.has(block.value.id)}
          recordMap={recordMap}
        />
      ))}
    </>
  );
}

// 個別ブロックのラッパー（遅延レンダリング対応）
function BlockWrapper({ block, isHighlighted, recordMap }) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef(null);
  
  // Intersection Observerで可視性を監視
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div
      ref={ref}
      className={`notion-block ${isHighlighted ? 'highlighted' : ''}`}
    >
      {isVisible ? (
        <NotionBlock block={block} recordMap={recordMap} />
      ) : (
        <div style={{ height: '50px' }} /> // プレースホルダー
      )}
    </div>
  );
}

// 実際のブロックレンダリング（動的インポート）
const NotionBlock = dynamic(
  () => import('react-notion-x/build/third-party/block').then(m => m.Block),
  {
    loading: () => <div className="block-loading" />,
    ssr: false
  }
);