import { get } from '@vercel/edge-config';

// Edge Config を使用したキャッシュ設定の取得
export async function getEdgeCacheConfig() {
  if (!process.env.EDGE_CONFIG) {
    return getDefaultConfig();
  }

  try {
    const config = await get('cacheConfig');
    return config || getDefaultConfig();
  } catch (error) {
    console.error('Edge Config error:', error);
    return getDefaultConfig();
  }
}

// デフォルトのキャッシュ設定
function getDefaultConfig() {
  return {
    enableCache: true,
    cacheDuration: {
      notionApi: 3600, // 1時間
      images: 86400 * 30, // 30日
      static: 86400 * 365, // 1年
      dynamic: 86400, // 1日
    },
    staleWhileRevalidate: {
      notionApi: 86400, // 1日
      dynamic: 604800, // 7日
    },
    edgeLocations: ['all'], // すべてのエッジロケーション
    bypassPatterns: [
      '/api/cache-clear',
      '/api/cache-status',
      '/admin/*',
    ],
  };
}

// キャッシュキーの生成（エッジ用）
export function generateEdgeCacheKey(request: Request): string {
  const url = new URL(request.url);
  const { pathname, search } = url;
  
  // デバイスタイプの検出
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /mobile|android|iphone/i.test(userAgent);
  const deviceType = isMobile ? 'mobile' : 'desktop';
  
  // 重要なクエリパラメータのみを含める
  const params = new URLSearchParams(search);
  const importantParams = ['pageId', 'search', 'tag', 'page'];
  const filteredParams = new URLSearchParams();
  
  importantParams.forEach(param => {
    if (params.has(param)) {
      filteredParams.set(param, params.get(param)!);
    }
  });
  
  // キーの生成
  const baseKey = `${pathname}:${deviceType}`;
  const queryKey = filteredParams.toString();
  
  return queryKey ? `${baseKey}?${queryKey}` : baseKey;
}

// エッジでのキャッシュ判定
export async function shouldBypassCache(request: Request): Promise<boolean> {
  const config = await getEdgeCacheConfig();
  const url = new URL(request.url);
  
  // キャッシュ無効化パターンのチェック
  for (const pattern of config.bypassPatterns) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (url.pathname.startsWith(prefix)) {
        return true;
      }
    } else if (url.pathname === pattern) {
      return true;
    }
  }
  
  // 認証ヘッダーがある場合はキャッシュをバイパス
  if (request.headers.get('authorization')) {
    return true;
  }
  
  // キャッシュ制御ヘッダーのチェック
  const cacheControl = request.headers.get('cache-control');
  if (cacheControl && (cacheControl.includes('no-cache') || cacheControl.includes('no-store'))) {
    return true;
  }
  
  return false;
}

// エッジでのレスポンスキャッシュ
export function getCacheHeaders(pathname: string, config: any) {
  let maxAge = config.cacheDuration.dynamic;
  let swr = config.staleWhileRevalidate.dynamic;
  
  if (pathname.includes('/api/notion') || pathname.includes('/api/search')) {
    maxAge = config.cacheDuration.notionApi;
    swr = config.staleWhileRevalidate.notionApi;
  } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    maxAge = config.cacheDuration.images;
    swr = 0;
  } else if (pathname.match(/\.(js|css|woff|woff2|ttf|otf)$/i)) {
    maxAge = config.cacheDuration.static;
    swr = 0;
  }
  
  const headers: Record<string, string> = {
    'Cache-Control': `public, s-maxage=${maxAge}`,
    'CDN-Cache-Control': `max-age=${maxAge}`,
  };
  
  if (swr > 0) {
    headers['Cache-Control'] += `, stale-while-revalidate=${swr}`;
  }
  
  // 不変なアセットには immutable を追加
  if (pathname.includes('/_next/static/') || pathname.includes('/static/')) {
    headers['Cache-Control'] += ', immutable';
  }
  
  return headers;
}

// キャッシュのパージ（Vercel API経由）
export async function purgeCache(pattern?: string) {
  if (!process.env.VERCEL_TEAM_ID || !process.env.VERCEL_PROJECT_ID || !process.env.VERCEL_API_TOKEN) {
    throw new Error('Vercel API credentials not configured');
  }
  
  const endpoint = `https://api.vercel.com/v1/projects/${process.env.VERCEL_PROJECT_ID}/cache`;
  
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teamId: process.env.VERCEL_TEAM_ID,
      ...(pattern && { pattern }),
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Cache purge failed: ${response.statusText}`);
  }
  
  return response.json();
}

// キャッシュ統計の取得
export async function getCacheStats() {
  // Vercel Analytics API を使用してキャッシュヒット率を取得
  // （実装にはVercel Analytics APIトークンが必要）
  return {
    hitRate: 'N/A',
    bandwidth: 'N/A',
    requests: 'N/A',
  };
}