import { NextApiRequest, NextApiResponse } from 'next';

// メモリ内でキャッシュ処理の状態を保持
let cacheProcessingStatus = {
  isProcessing: false,
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  currentBatch: 0,
  totalBatches: 0,
  startTime: null as Date | null,
  lastUpdate: null as Date | null,
  errors: [] as Array<{ pageId: string; error: string; timestamp: Date }>
};

// ステータスを更新する関数（cache-warmup.tsから呼び出される）
export function updateCacheStatus(update: Partial<typeof cacheProcessingStatus>) {
  cacheProcessingStatus = {
    ...cacheProcessingStatus,
    ...update,
    lastUpdate: new Date()
  };
  
  // エラーリストは最新の50件のみ保持
  if (cacheProcessingStatus.errors.length > 50) {
    cacheProcessingStatus.errors = cacheProcessingStatus.errors.slice(-50);
  }
}

// ステータスをリセットする関数
export function resetCacheStatus() {
  cacheProcessingStatus = {
    isProcessing: false,
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: 0,
    startTime: null,
    lastUpdate: null,
    errors: []
  };
}

// APIハンドラー
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 進捗率を計算
  const progress = cacheProcessingStatus.total > 0 
    ? Math.round((cacheProcessingStatus.processed / cacheProcessingStatus.total) * 100)
    : 0;

  // 経過時間を計算
  const elapsedTime = cacheProcessingStatus.startTime
    ? Math.floor((new Date().getTime() - new Date(cacheProcessingStatus.startTime).getTime()) / 1000)
    : 0;

  // 推定残り時間を計算
  const estimatedRemainingTime = cacheProcessingStatus.processed > 0 && cacheProcessingStatus.isProcessing
    ? Math.floor((elapsedTime / cacheProcessingStatus.processed) * (cacheProcessingStatus.total - cacheProcessingStatus.processed))
    : 0;

  res.status(200).json({
    ...cacheProcessingStatus,
    progress,
    elapsedTime,
    estimatedRemainingTime,
    // エラーの概要を追加
    errorSummary: cacheProcessingStatus.errors.reduce((acc, err) => {
      const key = err.error.includes('429') ? 'rateLimited' :
                  err.error.includes('timeout') ? 'timeout' :
                  err.error.includes('not found') ? 'notFound' :
                  'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });
}