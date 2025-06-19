import { NextRequest, NextResponse } from 'next/server';

// キャッシュヘッダーの設定
const CACHE_HEADERS = {
  // 静的アセット (1年)
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'max-age=31536000',
    'Cloudflare-CDN-Cache-Control': 'max-age=31536000'
  },
  // Notion API (1時間 + SWR)
  notionApi: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'max-age=3600',
    'Cloudflare-CDN-Cache-Control': 'max-age=3600'
  },
  // 動的コンテンツ (24時間 + SWR)
  dynamic: {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    'CDN-Cache-Control': 'max-age=86400',
    'Cloudflare-CDN-Cache-Control': 'max-age=86400'
  },
  // ページ (10分 + SWR)
  page: {
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'max-age=600',
    'Cloudflare-CDN-Cache-Control': 'max-age=600'
  }
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // 静的アセットのキャッシュ設定
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|otf)$/i)
  ) {
    Object.entries(CACHE_HEADERS.static).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // API エンドポイントのキャッシュ設定
  if (pathname.startsWith('/api/')) {
    if (pathname.includes('notion') || pathname.includes('search')) {
      Object.entries(CACHE_HEADERS.notionApi).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    } else {
      Object.entries(CACHE_HEADERS.dynamic).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    return response;
  }

  // ページのキャッシュ設定
  if (pathname === '/' || pathname.match(/^\/[a-zA-Z0-9-]+$/)) {
    Object.entries(CACHE_HEADERS.page).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Vary ヘッダーの設定（デバイスごとのキャッシュ）
    response.headers.set('Vary', 'Accept-Encoding, User-Agent');
  }

  // セキュリティヘッダー
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // パフォーマンスヒント
  response.headers.set('X-Accel-Buffering', 'no'); // ストリーミングレスポンス用

  return response;
}

// middleware を適用するパスの設定
export const config = {
  matcher: [
    // API routes
    '/api/:path*',
    // Static files
    '/(favicon.ico|robots.txt|sitemap.xml)',
    // Pages (excluding special Next.js paths)
    '/((?!_next/static|_next/image).*)',
  ],
};