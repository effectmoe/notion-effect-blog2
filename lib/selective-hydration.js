// 選択的ハイドレーション - アイランドアーキテクチャの実装
// 静的部分はハイドレーション不要、インタラクティブ部分のみハイドレート

import React, { useEffect, useRef, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';

// ハイドレーション戦略の定義
export const HydrationStrategy = {
  STATIC: 'static',           // ハイドレーション不要
  IMMEDIATE: 'immediate',     // 即座にハイドレート
  VISIBLE: 'visible',         // 表示時にハイドレート
  IDLE: 'idle',              // アイドル時にハイドレート
  INTERACTION: 'interaction', // インタラクション時にハイドレート
};

// アイランドコンポーネントのラッパー
export function Island({ 
  strategy = HydrationStrategy.VISIBLE,
  fallback = null,
  children,
  ...props 
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const ref = useRef(null);
  const hydrationRef = useRef(false);

  useEffect(() => {
    if (hydrationRef.current || !ref.current) return;

    const hydrate = () => {
      if (hydrationRef.current) return;
      hydrationRef.current = true;
      
      // React 18のPartial Hydrationを使用
      const root = hydrateRoot(ref.current, children);
      setIsHydrated(true);
    };

    switch (strategy) {
      case HydrationStrategy.IMMEDIATE:
        hydrate();
        break;

      case HydrationStrategy.VISIBLE:
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              hydrate();
              observer.disconnect();
            }
          },
          { rootMargin: '50px' }
        );
        observer.observe(ref.current);
        return () => observer.disconnect();

      case HydrationStrategy.IDLE:
        if ('requestIdleCallback' in window) {
          const handle = requestIdleCallback(hydrate, { timeout: 2000 });
          return () => cancelIdleCallback(handle);
        } else {
          const timer = setTimeout(hydrate, 2000);
          return () => clearTimeout(timer);
        }

      case HydrationStrategy.INTERACTION:
        const events = ['click', 'touchstart', 'mouseenter', 'focus'];
        const handlers = events.map(event => {
          const handler = () => {
            hydrate();
            events.forEach(e => ref.current?.removeEventListener(e, handler));
          };
          ref.current?.addEventListener(event, handler, { once: true });
          return { event, handler };
        });
        
        return () => {
          handlers.forEach(({ event, handler }) => {
            ref.current?.removeEventListener(event, handler);
          });
        };

      case HydrationStrategy.STATIC:
      default:
        // 静的コンテンツはハイドレーション不要
        return;
    }
  }, [strategy, children]);

  // サーバーサイドレンダリング時
  if (typeof window === 'undefined') {
    return (
      <div 
        ref={ref} 
        data-island 
        data-strategy={strategy}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </div>
    );
  }

  // クライアントサイド
  return (
    <div 
      ref={ref} 
      data-island 
      data-hydrated={isHydrated}
      {...props}
    >
      {isHydrated ? children : fallback || children}
    </div>
  );
}

// Notionブロック用のアイランド戦略決定
export function getBlockHydrationStrategy(blockType) {
  // インタラクティブなブロック
  const interactiveBlocks = [
    'toggle',
    'collection_view',
    'embed',
    'video',
    'audio',
    'code', // コピー機能があるため
  ];

  // 重要なブロック
  const criticalBlocks = [
    'heading_1',
    'heading_2',
    'image', // LCP対象の可能性
  ];

  if (interactiveBlocks.includes(blockType)) {
    return HydrationStrategy.INTERACTION;
  }
  
  if (criticalBlocks.includes(blockType)) {
    return HydrationStrategy.VISIBLE;
  }
  
  // テキストブロックなどは静的
  return HydrationStrategy.STATIC;
}

// Progressive Enhancementコンポーネント
export function ProgressiveBlock({ block, recordMap }) {
  const strategy = getBlockHydrationStrategy(block.type);
  
  // 静的レンダリング（JavaScript無効でも動作）
  const staticContent = (
    <div className={`notion-block notion-${block.type}`}>
      {renderStaticBlock(block)}
    </div>
  );

  // インタラクティブ機能が不要な場合
  if (strategy === HydrationStrategy.STATIC) {
    return staticContent;
  }

  // 選択的ハイドレーション
  return (
    <Island strategy={strategy} fallback={staticContent}>
      <NotionBlockDynamic block={block} recordMap={recordMap} />
    </Island>
  );
}

// 静的ブロックのレンダリング（サーバーサイド用）
function renderStaticBlock(block) {
  switch (block.type) {
    case 'text':
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
      return (
        <div className="notion-text">
          {block.properties?.title?.[0]?.[0]}
        </div>
      );
      
    case 'image':
      const src = block.properties?.source?.[0]?.[0];
      return src ? (
        <img 
          src={src} 
          alt="" 
          loading="lazy"
          className="notion-image"
        />
      ) : null;
      
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return (
        <li className="notion-list-item">
          {block.properties?.title?.[0]?.[0]}
        </li>
      );
      
    default:
      return <div>{block.type} block</div>;
  }
}

// 動的ブロックコンポーネント（遅延読み込み）
const NotionBlockDynamic = React.lazy(() => 
  import('./NotionBlockDynamic')
);

// ビューポート優先ハイドレーション
export function ViewportHydrator({ children }) {
  const [hydrationQueue, setHydrationQueue] = useState([]);
  const observerRef = useRef(null);

  useEffect(() => {
    const elements = document.querySelectorAll('[data-island]');
    const queue = [];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const strategy = element.getAttribute('data-strategy');
            
            if (strategy === HydrationStrategy.VISIBLE) {
              queue.push(element);
              // 優先度順にソート（Y座標が小さい順）
              queue.sort((a, b) => 
                a.getBoundingClientRect().top - b.getBoundingClientRect().top
              );
              setHydrationQueue([...queue]);
            }
          }
        });
      },
      { rootMargin: '100px' }
    );

    elements.forEach(el => observerRef.current.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  // キューに基づいてハイドレーション実行
  useEffect(() => {
    if (hydrationQueue.length === 0) return;

    const hydrate = async () => {
      const element = hydrationQueue[0];
      // ハイドレーション実行
      element.dispatchEvent(new CustomEvent('hydrate'));
      
      // キューから削除
      setHydrationQueue(prev => prev.slice(1));
    };

    const timer = requestIdleCallback(hydrate, { timeout: 50 });
    return () => cancelIdleCallback(timer);
  }, [hydrationQueue]);

  return <>{children}</>;
}

// ユーザーインタラクション予測
export function PredictiveHydration({ children }) {
  useEffect(() => {
    const predictInteraction = (e) => {
      const target = e.target.closest('[data-island]');
      if (!target) return;

      const strategy = target.getAttribute('data-strategy');
      if (strategy === HydrationStrategy.INTERACTION) {
        // 近くのインタラクティブ要素も事前ハイドレート
        const nearby = target.parentElement.querySelectorAll(
          '[data-island][data-strategy="interaction"]'
        );
        nearby.forEach(el => {
          if (!el.getAttribute('data-hydrated')) {
            el.dispatchEvent(new CustomEvent('prehydrate'));
          }
        });
      }
    };

    // マウス移動でインタラクション予測
    document.addEventListener('mousemove', predictInteraction, { passive: true });
    return () => document.removeEventListener('mousemove', predictInteraction);
  }, []);

  return <>{children}</>;
}

// エクスポート
export default {
  Island,
  ProgressiveBlock,
  ViewportHydrator,
  PredictiveHydration,
  getBlockHydrationStrategy,
  HydrationStrategy,
};