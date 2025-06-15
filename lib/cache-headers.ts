import { NextApiResponse } from 'next';

export interface CacheConfig {
  // キャッシュの種類
  type: 'static' | 'dynamic' | 'api' | 'notion';
  // キャッシュ期間（秒）
  maxAge: number;
  // stale-while-revalidate期間（秒）
  swr?: number;
  // プライベートキャッシュかどうか
  private?: boolean;
  // immutableかどうか
  immutable?: boolean;
  // ETagを使用するかどうか
  useEtag?: boolean;
}

// プリセットのキャッシュ設定
export const CACHE_PRESETS = {
  // 静的アセット（画像、フォントなど）
  static: {
    type: 'static' as const,
    maxAge: 31536000, // 1年
    immutable: true,
  },
  
  // ビルドされたJS/CSSファイル
  build: {
    type: 'static' as const,
    maxAge: 31536000, // 1年
    immutable: true,
  },
  
  // Notion API レスポンス
  notion: {
    type: 'notion' as const,
    maxAge: 300, // 5分
    swr: 3600, // 1時間
    useEtag: true,
  },
  
  // 検索結果
  search: {
    type: 'api' as const,
    maxAge: 60, // 1分
    swr: 300, // 5分
  },
  
  // 動的ページ
  page: {
    type: 'dynamic' as const,
    maxAge: 0,
    swr: 3600, // 1時間
    private: true,
  },
  
  // リアルタイムデータ
  realtime: {
    type: 'api' as const,
    maxAge: 0,
    private: true,
  },
} as const;

// キャッシュヘッダーを設定
export function setCacheHeaders(
  res: NextApiResponse,
  config: CacheConfig | keyof typeof CACHE_PRESETS
) {
  const cacheConfig = typeof config === 'string' ? CACHE_PRESETS[config] : config;
  
  const parts: string[] = [];
  
  // public/private
  parts.push(cacheConfig.private ? 'private' : 'public');
  
  // max-age
  parts.push(`max-age=${cacheConfig.maxAge}`);
  
  // stale-while-revalidate
  if (cacheConfig.swr) {
    parts.push(`stale-while-revalidate=${cacheConfig.swr}`);
  }
  
  // immutable
  if (cacheConfig.immutable) {
    parts.push('immutable');
  }
  
  // Cache-Controlヘッダーを設定
  res.setHeader('Cache-Control', parts.join(', '));
  
  // CDN用のヘッダー
  if (!cacheConfig.private) {
    // Vercelのエッジキャッシュを有効化
    res.setHeader('CDN-Cache-Control', parts.join(', '));
    
    // Cloudflareのキャッシュを有効化
    res.setHeader('Cloudflare-CDN-Cache-Control', parts.join(', '));
  }
  
  // Surrogate-Controlヘッダー（Fastlyなど）
  if (!cacheConfig.private && cacheConfig.maxAge > 0) {
    res.setHeader('Surrogate-Control', `max-age=${cacheConfig.maxAge}`);
  }
  
  // Varyヘッダー
  if (cacheConfig.type === 'api' || cacheConfig.type === 'notion') {
    res.setHeader('Vary', 'Accept-Encoding, Authorization');
  }
}

// ETagを生成
export function generateETag(content: string | Buffer): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(content);
  return `"${hash.digest('hex').substring(0, 16)}"`;
}

// ETagベースの条件付きレスポンス
export function handleConditionalRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  content: string | Buffer,
  config?: CacheConfig
): boolean {
  const etag = generateETag(content);
  res.setHeader('ETag', etag);
  
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch === etag) {
    res.status(304).end();
    return true;
  }
  
  if (config) {
    setCacheHeaders(res, config);
  }
  
  return false;
}

// キャッシュキーのサニタイズ
export function sanitizeCacheKey(key: string): string {
  // 危険な文字を除去
  return key
    .replace(/[^a-zA-Z0-9:_-]/g, '_')
    .substring(0, 200); // 最大200文字
}

// キャッシュタグの生成
export function generateCacheTags(
  type: string,
  id?: string,
  additionalTags?: string[]
): string[] {
  const tags = [`type:${type}`];
  
  if (id) {
    tags.push(`id:${id}`);
  }
  
  if (additionalTags) {
    tags.push(...additionalTags);
  }
  
  return tags;
}

// Surrogate-Keyヘッダーの設定（タグベースの無効化用）
export function setSurrogateKeys(res: NextApiResponse, tags: string[]) {
  res.setHeader('Surrogate-Key', tags.join(' '));
}