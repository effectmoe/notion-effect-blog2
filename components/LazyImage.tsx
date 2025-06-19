import React, { useState, useEffect, useRef } from 'react';
import { getPlaiceholder } from 'plaiceholder';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

// プレースホルダー画像を生成（Base64）
const getPlaceholderImage = (width: number = 16, height: number = 9) => {
  return `data:image/svg+xml,%3Csvg width='${width}' height='${height}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E`;
};

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState<string>(
    priority ? src : getPlaceholderImage(width, height)
  );
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const [blur, setBlur] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 優先画像はすぐに読み込む
    if (priority) return;

    const imageElement = imgRef.current;
    if (!imageElement) return;

    // Intersection Observerの設定
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // viewportから100pxの範囲で事前読み込み開始
            loadImage();
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    observerRef.current.observe(imageElement);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  const loadImage = async () => {
    try {
      // ブラー画像を生成（可能な場合）
      try {
        const response = await fetch(`/api/image-blur?src=${encodeURIComponent(src)}`);
        if (response.ok) {
          const data = await response.json();
          setBlur(data.base64);
        }
      } catch (blurError) {
        console.warn('Blur generation failed:', blurError);
      }

      // 実際の画像を読み込み
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
        onLoad?.();
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
        onError?.();
      };
      img.src = src;
    } catch (error) {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  // エラー時のフォールバック画像
  const fallbackSrc = hasError 
    ? 'data:image/svg+xml,%3Csvg width="400" height="300" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280" font-family="system-ui" font-size="14"%3EImage failed to load%3C/text%3E%3C/svg%3E'
    : imageSrc;

  return (
    <div className={`lazy-image-wrapper ${className}`} style={{ position: 'relative' }}>
      {/* ブラー背景（読み込み中） */}
      {isLoading && blur && (
        <div
          className="lazy-image-blur"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${blur})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: 0.8
          }}
        />
      )}
      
      {/* 実際の画像 */}
      <img
        ref={imgRef}
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`lazy-image ${isLoading ? 'lazy-image-loading' : 'lazy-image-loaded'}`}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          position: 'relative',
          zIndex: 1
        }}
      />
      
      <style jsx>{`
        .lazy-image-wrapper {
          overflow: hidden;
          background-color: #f3f4f6;
        }
        
        .lazy-image-wrapper img {
          will-change: opacity;
        }
        
        /* アスペクト比を維持 */
        .lazy-image-wrapper[data-aspect-ratio] {
          position: relative;
          width: 100%;
        }
        
        .lazy-image-wrapper[data-aspect-ratio]::before {
          content: '';
          display: block;
          padding-bottom: var(--aspect-ratio);
        }
        
        .lazy-image-wrapper[data-aspect-ratio] > * {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

// Notionの画像URLに対応したラッパーコンポーネント
export const NotionLazyImage: React.FC<LazyImageProps & { block?: any }> = (props) => {
  const { src, block, ...rest } = props;
  
  // Notion画像URLの最適化
  const optimizedSrc = React.useMemo(() => {
    if (!src) return '';
    
    // Notionの画像URLかチェック
    if (src.includes('notion.so') || src.includes('notion.com')) {
      // 幅を指定してリサイズ
      const url = new URL(src);
      url.searchParams.set('width', '1920');
      url.searchParams.set('cache', 'v2');
      return url.toString();
    }
    
    return src;
  }, [src]);
  
  // アスペクト比の計算
  const aspectRatio = React.useMemo(() => {
    if (props.width && props.height) {
      return (props.height / props.width) * 100;
    }
    return block?.format?.block_aspect_ratio || 56.25; // デフォルト16:9
  }, [props.width, props.height, block]);
  
  return (
    <div 
      className="notion-lazy-image"
      data-aspect-ratio=""
      style={{ '--aspect-ratio': `${aspectRatio}%` } as React.CSSProperties}
    >
      <LazyImage {...rest} src={optimizedSrc} />
    </div>
  );
};

export default LazyImage;