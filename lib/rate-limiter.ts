import { NextApiRequest, NextApiResponse } from 'next';

// メモリベースのレート制限（本番環境ではRedisを推奨）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs?: number; // 時間枠（ミリ秒）
  max?: number; // 最大リクエスト数
  message?: string; // エラーメッセージ
  keyGenerator?: (req: NextApiRequest) => string; // キー生成関数
}

// デフォルト設定
const defaultConfig: Required<RateLimitConfig> = {
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 100リクエスト
  message: 'Too many requests, please try again later.',
  keyGenerator: (req) => {
    // IPアドレスまたは認証トークンをキーとして使用
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const auth = req.headers.authorization;
    
    if (auth) {
      return `auth:${auth}`;
    }
    
    if (forwardedFor) {
      return `ip:${Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0]}`;
    }
    
    if (realIp) {
      return `ip:${Array.isArray(realIp) ? realIp[0] : realIp}`;
    }
    
    return `ip:${req.socket.remoteAddress}`;
  },
};

// レート制限ミドルウェア
export function rateLimit(config: RateLimitConfig = {}) {
  const options = { ...defaultConfig, ...config };
  
  return async (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    const key = options.keyGenerator(req);
    const now = Date.now();
    
    // 現在のリクエスト情報を取得
    let requestInfo = requestCounts.get(key);
    
    // 期限切れの場合はリセット
    if (!requestInfo || now > requestInfo.resetTime) {
      requestInfo = {
        count: 0,
        resetTime: now + options.windowMs,
      };
    }
    
    // リクエスト数を増加
    requestInfo.count++;
    requestCounts.set(key, requestInfo);
    
    // レート制限ヘッダーを設定
    const remaining = Math.max(0, options.max - requestInfo.count);
    const reset = new Date(requestInfo.resetTime).toISOString();
    
    res.setHeader('X-RateLimit-Limit', options.max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset);
    
    // 制限を超えた場合
    if (requestInfo.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((requestInfo.resetTime - now) / 1000).toString());
      return res.status(429).json({
        error: options.message,
        retryAfter: requestInfo.resetTime,
      });
    }
    
    // 次の処理へ
    if (next) {
      next();
    }
  };
}

// 特定のキーのカウントをリセット
export function resetRateLimit(key: string): void {
  requestCounts.delete(key);
}

// すべてのカウントをクリア
export function clearAllRateLimits(): void {
  requestCounts.clear();
}

// 定期的なクリーンアップ（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of requestCounts.entries()) {
    if (now > info.resetTime + 60000) { // 1分後に削除
      requestCounts.delete(key);
    }
  }
}, 60000); // 1分ごとに実行

// プリセット設定
export const rateLimitPresets = {
  // 厳しい制限（認証なしのエンドポイント用）
  strict: {
    windowMs: 15 * 60 * 1000, // 15分
    max: 10, // 10リクエスト
  },
  
  // 通常の制限
  normal: {
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 100リクエスト
  },
  
  // 緩い制限（認証済みユーザー用）
  relaxed: {
    windowMs: 15 * 60 * 1000, // 15分
    max: 1000, // 1000リクエスト
  },
  
  // Webhook用（頻繁な更新を想定）
  webhook: {
    windowMs: 1 * 60 * 1000, // 1分
    max: 60, // 60リクエスト（1秒に1回）
  },
};