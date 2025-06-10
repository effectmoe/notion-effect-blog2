// レスポンシブ画像の設定とユーティリティ

// ブレークポイントと対応する画像幅
export const IMAGE_SIZES = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

// デバイスピクセル比を考慮した実際の画像サイズ
export const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

// 画像フォーマットの優先順位
export const IMAGE_FORMATS = ['avif', 'webp', 'jpeg'] as const;
export type ImageFormat = typeof IMAGE_FORMATS[number];

// srcsetを生成する関数
export function generateSrcSet(
  src: string,
  sizes: number[] = [320, 640, 960, 1280, 1920]
): string {
  return sizes
    .map(size => {
      const url = generateOptimizedUrl(src, { width: size });
      return `${url} ${size}w`;
    })
    .join(', ');
}

// sizes属性を生成する関数
export function generateSizes(config: {
  default: string;
  breakpoints?: { [key: string]: string };
}): string {
  const { default: defaultSize, breakpoints = {} } = config;
  
  const sizes = Object.entries(breakpoints)
    .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 大きい順にソート
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}px) ${size}`)
    .join(', ');
  
  return sizes ? `${sizes}, ${defaultSize}` : defaultSize;
}

// 最適化された画像URLを生成
export function generateOptimizedUrl(
  src: string,
  options: {
    width?: number;
    quality?: number;
    format?: ImageFormat;
  } = {}
): string {
  const { width, quality = 85, format = 'webp' } = options;
  
  // 自サイトのAPI経由で最適化
  const params = new URLSearchParams({
    src,
    ...(width && { w: width.toString() }),
    q: quality.toString(),
    format
  });
  
  return `/api/image-optimize?${params.toString()}`;
}

// アート・ディレクションが必要な画像かどうかを判定
export function needsArtDirection(
  aspectRatio: number,
  context?: 'hero' | 'card' | 'article' | 'gallery'
): boolean {
  // ヒーロー画像は常にアート・ディレクションが必要
  if (context === 'hero') return true;
  
  // 極端なアスペクト比の場合
  if (aspectRatio > 2.5 || aspectRatio < 0.4) return true;
  
  // カード画像でワイドな場合
  if (context === 'card' && aspectRatio > 1.5) return true;
  
  return false;
}

// picture要素用のソース生成
export interface PictureSource {
  srcSet: string;
  type: string;
  media?: string;
  sizes?: string;
}

export function generatePictureSources(
  src: string,
  options: {
    sizes?: string;
    formats?: ImageFormat[];
    artDirection?: {
      mobile?: { crop?: string; aspectRatio?: number };
      tablet?: { crop?: string; aspectRatio?: number };
    };
  } = {}
): PictureSource[] {
  const { 
    sizes = '100vw', 
    formats = ['avif', 'webp'],
    artDirection 
  } = options;
  
  const sources: PictureSource[] = [];
  
  // アート・ディレクションがある場合
  if (artDirection) {
    if (artDirection.mobile) {
      formats.forEach(format => {
        sources.push({
          srcSet: generateSrcSet(src, [320, 640, 768]),
          type: `image/${format}`,
          media: '(max-width: 640px)',
          sizes: '100vw'
        });
      });
    }
    
    if (artDirection.tablet) {
      formats.forEach(format => {
        sources.push({
          srcSet: generateSrcSet(src, [768, 1024, 1280]),
          type: `image/${format}`,
          media: '(max-width: 1024px)',
          sizes: '100vw'
        });
      });
    }
  }
  
  // 通常のレスポンシブ画像
  formats.forEach(format => {
    sources.push({
      srcSet: generateSrcSet(src),
      type: `image/${format}`,
      sizes
    });
  });
  
  return sources;
}

// Notion画像用の最適化
export function optimizeNotionImage(
  url: string,
  options: {
    width?: number;
    quality?: number;
  } = {}
): string {
  if (!url) return '';
  
  try {
    const imageUrl = new URL(url);
    
    // Notion画像の場合
    if (imageUrl.hostname.includes('notion')) {
      imageUrl.searchParams.set('width', (options.width || 2048).toString());
      imageUrl.searchParams.set('cache', 'v2');
      return imageUrl.toString();
    }
    
    // Unsplash画像の場合
    if (imageUrl.hostname.includes('unsplash')) {
      imageUrl.searchParams.set('w', (options.width || 2048).toString());
      imageUrl.searchParams.set('q', (options.quality || 85).toString());
      imageUrl.searchParams.set('auto', 'format');
      return imageUrl.toString();
    }
    
    // その他の画像は自サイトのAPIで最適化
    return generateOptimizedUrl(url, options);
  } catch {
    return url;
  }
}

// 画像の遅延読み込み設定
export function shouldLazyLoad(
  priority: boolean = false,
  position: 'above-fold' | 'below-fold' = 'below-fold'
): boolean {
  return !priority && position === 'below-fold';
}