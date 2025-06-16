// キャッシュシステムの設定

export const CACHE_CONFIG = {
  // Redisを使用するかどうか（環境変数で制御）
  USE_REDIS: process.env.USE_REDIS === 'true',
  
  // デフォルトのTTL（秒）
  DEFAULT_TTL: parseInt(process.env.CACHE_TTL_DEFAULT || '3600'),
  PAGE_INFO_TTL: parseInt(process.env.CACHE_TTL_PAGE_INFO || '7200'),
  
  // メモリキャッシュの設定
  MAX_ENTRIES: parseInt(process.env.CACHE_MAX_ENTRIES || '500'),
  
  // バッチ処理の設定
  WARMUP_BATCH_SIZE: parseInt(process.env.WARMUP_BATCH_SIZE || '5'),
  WARMUP_BATCH_DELAY: parseInt(process.env.WARMUP_BATCH_DELAY || '10000'),
  WARMUP_TIMEOUT: parseInt(process.env.WARMUP_TIMEOUT || '30000'),
};

// キャッシュ実装の選択
export async function getCacheImplementation() {
  if (CACHE_CONFIG.USE_REDIS) {
    // Redisを使用
    return await import('./cache');
  } else {
    // シンプルキャッシュを使用
    return await import('./simple-cache');
  }
}