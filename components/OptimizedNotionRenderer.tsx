import React, { useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { NotionRenderer } from 'react-notion-x';
import { ExtendedRecordMap } from 'notion-types';

// 動的インポートでコンポーネントを遅延読み込み
const Code = dynamic(() => 
  import('react-notion-x/build/third-party/code').then(m => m.Code),
  { ssr: false }
);

const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(m => m.Collection),
  { ssr: false }
);

const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then(m => m.Equation),
  { ssr: false }
);

const Modal = dynamic(() =>
  import('react-notion-x/build/third-party/modal').then(m => m.Modal),
  { ssr: false }
);

interface OptimizedNotionRendererProps {
  recordMap: ExtendedRecordMap;
  fullPage?: boolean;
  darkMode?: boolean;
  rootPageId?: string;
  rootDomain?: string;
  previewImages?: boolean;
  components?: Partial<any>;
  mapPageUrl?: any;
  mapImageUrl?: any;
  searchNotion?: any;
  showTableOfContents?: boolean;
  minTableOfContentsItems?: number;
  defaultPageIcon?: string;
  defaultPageCover?: string;
  defaultPageCoverPosition?: number;
  className?: string;
}

export const OptimizedNotionRenderer: React.FC<OptimizedNotionRendererProps> = ({
  recordMap,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleBlocks, setVisibleBlocks] = useState<Set<string>>(new Set());
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // Virtual Scrollingの実装
  useEffect(() => {
    if (!containerRef.current) return;
    
    const blocks = containerRef.current.querySelectorAll('[data-block-id]');
    const observer = new IntersectionObserver(
      (entries) => {
        const updates = new Map<string, boolean>();
        
        entries.forEach((entry) => {
          const blockId = entry.target.getAttribute('data-block-id');
          if (blockId) {
            updates.set(blockId, entry.isIntersecting);
          }
        });
        
        // バッチでstate更新
        setVisibleBlocks((prev) => {
          const newSet = new Set(prev);
          updates.forEach((isVisible, blockId) => {
            if (isVisible) {
              newSet.add(blockId);
            } else {
              newSet.delete(blockId);
            }
          });
          return newSet;
        });
      },
      {
        rootMargin: '100px',
        threshold: 0
      }
    );
    
    blocks.forEach((block) => observer.observe(block));
    
    return () => observer.disconnect();
  }, [recordMap]);
  
  // RequestIdleCallbackでの非優先処理
  useEffect(() => {
    if (isInitialRender) {
      // 初期レンダリング後の処理
      const idleCallback = () => {
        // 画像の事前読み込み
        const images = document.querySelectorAll('img[data-src]');
        images.forEach((img) => {
          const src = img.getAttribute('data-src');
          if (src) {
            const imageElement = img as HTMLImageElement;
            imageElement.src = src;
            imageElement.removeAttribute('data-src');
          }
        });
        
        // アニメーションの有効化
        document.body.classList.remove('no-transitions');
        
        setIsInitialRender(false);
      };
      
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(idleCallback);
      } else {
        setTimeout(idleCallback, 1);
      }
    }
  }, [isInitialRender]);
  
  // コンポーネントの最適化
  const optimizedComponents = useMemo(() => ({
    ...props.components,
    Code,
    Collection,
    Equation,
    Modal,
    // 画像コンポーネントの最適化
    Image: ({ src, alt, ...imageProps }: any) => (
      <img 
        data-src={src} 
        alt={alt} 
        loading="lazy" 
        decoding="async"
        {...imageProps}
      />
    ),
  }), [props.components]);
  
  // レイアウトスラッシングの防止
  useEffect(() => {
    const preventLayoutThrashing = () => {
      // バッチでスタイル変更
      const updates: Array<() => void> = [];
      
      // 高さの計算が必要な要素を収集
      const elements = document.querySelectorAll('[data-calculate-height]');
      const heights = new Map<Element, number>();
      
      // 読み取りフェーズ
      elements.forEach((el) => {
        heights.set(el, el.getBoundingClientRect().height);
      });
      
      // 書き込みフェーズ
      heights.forEach((height, el) => {
        updates.push(() => {
          (el as HTMLElement).style.height = `${height}px`;
        });
      });
      
      // DocumentFragmentでバッチ更新
      requestAnimationFrame(() => {
        updates.forEach((update) => update());
      });
    };
    
    // 初期レンダリング後に実行
    if (!isInitialRender) {
      preventLayoutThrashing();
    }
  }, [isInitialRender, recordMap]);
  
  return (
    <>
      <style jsx global>{`
        /* 初期レンダリング時のトランジション無効化 */
        .no-transitions * {
          transition: none !important;
          animation: none !important;
        }
        
        /* Virtual Scrolling用のプレースホルダー */
        [data-block-id]:not(.visible) {
          content-visibility: auto;
          contain-intrinsic-size: 0 500px;
        }
        
        /* 画像の遅延読み込みプレースホルダー */
        img[data-src] {
          background-color: #f3f4f6;
          filter: blur(5px);
        }
        
        /* レンダリング最適化 */
        .notion-page {
          will-change: scroll-position;
        }
        
        .notion-block {
          contain: layout style paint;
        }
      `}</style>
      
      <div ref={containerRef} className={`optimized-notion-renderer ${isInitialRender ? 'no-transitions' : ''}`}>
        <NotionRenderer
          {...props}
          recordMap={recordMap}
          components={optimizedComponents}
        />
      </div>
    </>
  );
};

export default OptimizedNotionRenderer;