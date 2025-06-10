// Notion APIのリクエスト並列数を制御
import pLimit from 'p-limit';

// 同時実行数を制限（Vercelのビルド環境では控えめに）
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const concurrencyLimit = isVercel ? 2 : 4; // Vercelでは2並列、ローカルでは4並列

export const notionLimit = pLimit(concurrencyLimit);

// リクエスト間隔の制御（レート制限対策）
let lastRequestTime = 0;
const minRequestInterval = isVercel ? 500 : 200; // Vercelでは500ms、ローカルでは200ms

export async function throttleRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < minRequestInterval) {
    const delay = minRequestInterval - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
  return fn();
}

// バッチ処理用のヘルパー
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => notionLimit(() => throttleRequest(() => processor(item))))
    );
    results.push(...batchResults);
    
    // バッチ間の待機（Vercel環境では長めに）
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, isVercel ? 1000 : 500));
    }
  }
  
  return results;
}