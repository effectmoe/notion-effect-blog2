import React, { useState, useEffect } from 'react';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { Tooltip } from './Tooltip';
import styles from './CacheManagement.module.css';

interface CacheStats {
  memory: {
    size: number;
    calculatedSize: number;
    hits: number;
    misses: number;
  };
  redis: {
    connected: boolean;
    keyCount: number;
    memoryUsage: number;
  };
}

interface WarmupProgress {
  current: number;
  total: number;
  succeeded: number;
  failed: number;
  phase: 'preparing' | 'clearing' | 'warming' | 'complete';
}

interface CacheProcessingStatus {
  isProcessing: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  progress: number;
  elapsedTime: number;
  estimatedRemainingTime: number;
  errorSummary: Record<string, number>;
}

interface WarmupJob {
  jobId: string;
  status: string;
  progress: number;
  successRate?: number;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped?: number;
  currentBatch?: number;
  totalBatches?: number;
  elapsedSeconds: number;
  estimatedSecondsRemaining?: number | null;
  errors?: Array<{ pageId: string; error: string }>;
  errorSummary?: Record<string, number>;
  isComplete?: boolean;
  isFastJob?: boolean;
}

export const CacheManagement: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<WarmupProgress | null>(null);
  const [processingStatus, setProcessingStatus] = useState<CacheProcessingStatus | null>(null);
  const [statusPollingInterval, setStatusPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [autoProcessingStop, setAutoProcessingStop] = useState(false);
  const [warmupJob, setWarmupJob] = useState<WarmupJob | null>(null);
  const [jobPollingInterval, setJobPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [warmupHistory, setWarmupHistory] = useState<Array<{
    date: string;
    total: number;
    succeeded: number;
    failed: number;
    duration: number;
  }>>([]);
  const [pageListResult, setPageListResult] = useState<any>(null);
  const [isTestingPageList, setIsTestingPageList] = useState(false);
  const [pageSearchTerm, setPageSearchTerm] = useState('');
  const { isConnected, lastUpdate, clearCache } = useRealtimeUpdates();

  // デバッグ用のログ
  useEffect(() => {
    console.log('[CacheManagement] Component mounted');
    console.log('[CacheManagement] handleTestPageList exists:', typeof handleTestPageList === 'function');
  }, []);

  // キャッシュ統計を取得
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/cache-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    }
  };

  // キャッシュ処理ステータスを取得
  const fetchProcessingStatus = async () => {
    try {
      const response = await fetch('/api/cache-status');
      if (response.ok) {
        const data = await response.json();
        setProcessingStatus(data);
        
        // 処理が完了したらポーリングを停止
        if (!data.isProcessing && statusPollingInterval) {
          clearInterval(statusPollingInterval);
          setStatusPollingInterval(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch processing status:', error);
    }
  };

  // ポーリングを開始
  const startStatusPolling = () => {
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
    }
    
    // 即座に最初の取得
    fetchProcessingStatus();
    
    // 2秒ごとにステータスを取得
    const interval = setInterval(fetchProcessingStatus, 2000);
    setStatusPollingInterval(interval);
  };

  // ジョブステータスのポーリング（レガシーコード - 新しいAPIでは使用しない）
  useEffect(() => {
    // warmupJobは使用しないため、このuseEffectは実質無効
    if (!warmupJob || warmupJob.status === 'completed' || warmupJob.status === 'failed') {
      if (jobPollingInterval) {
        clearInterval(jobPollingInterval);
        setJobPollingInterval(null);
      }
      return;
    }
    
    // 以下のコードは実行されない（warmupJobが設定されないため）
    
    return () => {
      if (jobPollingInterval) {
        clearInterval(jobPollingInterval);
      }
    };
  }, [warmupJob?.jobId, warmupJob?.status]);

  useEffect(() => {
    fetchStats();
    // 30秒ごとに統計を更新
    const interval = setInterval(fetchStats, 30000);
    
    // ローカルストレージから履歴を読み込む
    const savedHistory = localStorage.getItem('warmupHistory');
    if (savedHistory) {
      try {
        setWarmupHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load warmup history:', e);
      }
    }
    
    return () => {
      clearInterval(interval);
      // ステータスポーリングもクリーンアップ
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
      }
    };
  }, []);

  // ウォームアップ結果の保存
  const saveWarmupResult = (state: any) => {
    const result = {
      date: new Date().toLocaleString('ja-JP'),
      total: state.total,
      succeeded: state.succeeded,
      failed: state.failed,
      duration: Math.round((state.lastUpdate - state.startTime) / 1000)
    };
    
    const newHistory = [result, ...warmupHistory].slice(0, 5); // 最新5件を保持
    setWarmupHistory(newHistory);
    
    // ローカルストレージに保存
    localStorage.setItem('warmupHistory', JSON.stringify(newHistory));
  };

  // トークン取得のヘルパー関数
  const getAuthToken = () => {
    let token = process.env.NEXT_PUBLIC_CACHE_CLEAR_TOKEN;
    if (!token) {
      token = localStorage.getItem('cache_clear_token') || '';
      if (!token) {
        token = prompt('キャッシュクリアトークンを入力してください:') || '';
        if (token) {
          localStorage.setItem('cache_clear_token', token);
        }
      }
    }
    return token;
  };

  // キャッシュクリア（タイプ別）
  const handleClearCache = async (type: string) => {
    console.log(`[CacheManagement] Clearing cache with type: ${type}`);
    setLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      console.log('[CacheManagement] Token obtained:', token ? 'Yes' : 'No');
      
      const requestBody = { type };
      console.log('[CacheManagement] Sending request:', requestBody);
      
      const response = await fetch('/api/cache-clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[CacheManagement] Response status:', response.status);
      const data = await response.json();
      console.log('[CacheManagement] Response data:', data);

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        
        // Log cache stats if available
        if (data.stats) {
          console.log('[CacheManagement] Cache stats comparison:', {
            memory: {
              before: data.stats.before.memory.size,
              after: data.stats.after.memory.size,
              cleared: data.stats.before.memory.size - data.stats.after.memory.size
            },
            redis: {
              before: data.stats.before.redis.keyCount,
              after: data.stats.after.redis.keyCount,
              cleared: data.stats.before.redis.keyCount - data.stats.after.redis.keyCount
            }
          });
        }
        
        // Also clear Service Worker cache if clearing all
        if (type === 'all') {
          console.log('[CacheManagement] Clearing Service Worker cache...');
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
              console.log('[CacheManagement] Service Worker cache cleared:', event.data);
            };
            navigator.serviceWorker.controller.postMessage(
              { type: 'CLEAR_CACHE' },
              [messageChannel.port2]
            );
          }
          
          // Also clear browser caches
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              console.log('[CacheManagement] Found browser caches:', cacheNames);
              await Promise.all(
                cacheNames.map(cacheName => {
                  console.log(`[CacheManagement] Deleting cache: ${cacheName}`);
                  return caches.delete(cacheName);
                })
              );
              console.log('[CacheManagement] Browser caches cleared');
            } catch (error) {
              console.error('[CacheManagement] Failed to clear browser caches:', error);
            }
          }
        }
        
        // 統計を更新
        console.log('[CacheManagement] Updating stats in 1 second...');
        setTimeout(() => {
          console.log('[CacheManagement] Fetching updated stats...');
          fetchStats();
        }, 1000);
      } else {
        console.error('[CacheManagement] Error response:', data);
        setMessage(`❌ エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('[CacheManagement] Request failed:', error);
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 自動段階処理のための状態（上部で定義済み）

  // キャッシュクリアとウォームアップを一連の流れで実行
  const handleClearAndWarmup = async () => {
    setLoading(true);
    setMessage('');
    setProgress({ current: 0, total: 0, succeeded: 0, failed: 0, phase: 'preparing' });
    setIsAutoProcessing(false);
    setAutoProcessingStop(false);
    setWarmupJob(null);  // 既存のジョブをクリア

    try {
      const token = getAuthToken();
      
      // 1. まず現在のページリストを取得（キャッシュがある間に）
      console.log('[CacheManagement] Step 1: Getting page list before cache clear...');
      const pagesResponse = await fetch('/api/cache-get-pages');
      
      let pageIds: string[] = [];
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        pageIds = pagesData.pageIds || [];
        console.log(`[CacheManagement] Retrieved ${pageIds.length} page IDs`);
        setMessage(`📄 ${pageIds.length}ページのIDを取得しました`);
        setProgress({ current: 0, total: pageIds.length, succeeded: 0, failed: 0, phase: 'preparing' });
      } else {
        console.log('[CacheManagement] Failed to get page list');
        setMessage('⚠️ ページリストの取得に失敗しました');
      }
      
      // 2. キャッシュをクリア
      console.log('[CacheManagement] Step 2: Clearing cache...');
      setProgress(prev => prev ? { ...prev, phase: 'clearing' } : null);
      const clearResponse = await fetch('/api/cache-clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'all' }),
      });

      if (!clearResponse.ok) {
        const clearData = await clearResponse.json();
        throw new Error(`Cache clear failed: ${clearData.error}`);
      }
      
      setMessage('🗑️ キャッシュをクリアしました');
      
      // 3. 少し待つ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. シンプルウォームアップを開始
      console.log('[CacheManagement] Step 3: Starting simple warmup...');
      setProgress(prev => prev ? { ...prev, phase: 'warming' } : null);
      setMessage('🚀 ウォームアップを開始中...');
      
      const warmupResponse = await fetch('/api/cache-warmup-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      const warmupResult = await warmupResponse.json();
      
      if (!warmupResult.success) {
        throw new Error(`Warmup start failed: ${warmupResult.error}`);
      }

      console.log('[CacheManagement] Warmup started:', warmupResult);
      setMessage(`🔥 ウォームアップ中... (${warmupResult.total}ページ)`);
      
      // ポーリング開始
      startSimplePolling();
      
    } catch (error) {
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
    // loadingはジョブ完了時にuseEffectでfalseに設定される
  };

  // シンプルなウォームアップ（重複除外・安定版）
  const handleOptimizedWarmup = async () => {
    setLoading(true);
    setMessage('');
    setWarmupJob(null);
    
    try {
      const token = getAuthToken();
      console.log('[CacheManagement] Starting simple warmup...');
      
      // シンプルウォームアップを開始
      const response = await fetch('/api/cache-warmup-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const result = await response.json();
      
      if (!result.success) {
        if (result.state && result.state.isProcessing) {
          // 既に処理中
          setMessage('🔄 既にウォームアップが実行中です');
          startSimplePolling();
          return;
        }
        throw new Error(result.error || result.message || 'Failed to start warmup');
      }
      
      if (result.needsProcessing) {
        setMessage(`🚀 ウォームアップを初期化しました (${result.total}ページ)`);
        // バッチ処理を開始
        startBatchProcessing();
      } else {
        setLoading(false);
        setMessage('処理するページがありません');
      }
      
    } catch (error) {
      console.error('[CacheManagement] Simple warmup error:', error);
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // バッチ処理（新しい関数）
  const startBatchProcessing = () => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const processBatchInterval = setInterval(async () => {
      try {
        // バッチ処理を実行
        const token = getAuthToken();
        const response = await fetch('/api/cache-warmup-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'process' })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('[CacheManagement] Batch result:', result);
        
        // ステータス更新
        if (result.state) {
          const status = result.state;
          const statusText = `処理中: ${status.processed}/${status.total} ` +
            `(成功: ${status.succeeded}, スキップ: ${status.skipped}, 失敗: ${status.failed}) ` +
            `- ${Math.round((status.processed / status.total) * 100)}%`;
          
          setMessage(statusText);
        }
        
        // 完了チェック
        if (result.completed) {
          clearInterval(processBatchInterval);
          setLoading(false);
          
          const status = result.state;
          const completionTime = Math.round((status.lastUpdate - status.startTime) / 1000);
          const message = `✅ ウォームアップ完了！
処理済み: ${status.processed}/${status.total}ページ
成功: ${status.succeeded}
スキップ: ${status.skipped}
失敗: ${status.failed}
処理時間: ${completionTime}秒`;
          
          setMessage(message);
          
          // 履歴を保存
          saveWarmupResult(status);
          
          // エラーがあれば表示
          if (status.errors && status.errors.length > 0) {
            console.error('[CacheManagement] Errors during warmup:', status.errors);
          }
        }
        
        retryCount = 0; // 成功したらリトライカウントをリセット
        
      } catch (error: any) {
        console.error('[CacheManagement] Batch error:', error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          clearInterval(processBatchInterval);
          setLoading(false);
          setMessage(`エラー: バッチ処理に失敗しました (${error.message})`);
        }
      }
    }, 2000); // 2秒ごとにバッチ処理
    
    setJobPollingInterval(processBatchInterval);
  };
  
  // シンプルウォームアップ用のポーリング処理
  const startSimplePolling = () => {
    let pollCount = 0;
    const maxPolls = 600; // 最大10分
    
    const interval = setInterval(async () => {
      try {
        // ステータス取得（GETメソッド）
        const response = await fetch('/api/cache-warmup-simple', {
          method: 'GET'
        });
        
        if (!response.ok) {
          throw new Error('Failed to get status');
        }
        
        const status = await response.json();
        
        // warmupJob形式に変換
        const jobStatus = {
          jobId: 'simple',
          status: status.isProcessing ? 'running' : 'completed',
          progress: status.progress,
          total: status.total,
          processed: status.processed,
          succeeded: status.succeeded,
          failed: status.failed,
          skipped: status.skipped,
          elapsedSeconds: status.elapsed,
          isComplete: !status.isProcessing
        };
        
        setWarmupJob(jobStatus);
        
        // 完了チェック
        if (!status.isProcessing && status.processed > 0) {
          clearInterval(interval);
          setJobPollingInterval(null);
          setLoading(false);
          
          // 完了メッセージ
          const message = `✅ ウォームアップ完了！\n` +
            `処理: ${status.processed}/${status.total}\n` +
            `成功: ${status.succeeded}\n` +
            `スキップ: ${status.skipped}（キャッシュ済み/重複）\n` +
            `失敗: ${status.failed}\n` +
            `時間: ${status.elapsed}秒`;
          
          setMessage(message);
          
          // エラーがあれば表示
          if (status.errors && status.errors.length > 0) {
            console.error('[CacheManagement] Recent errors:', status.errors);
          }
        }
        
        pollCount++;
        if (pollCount >= maxPolls) {
          clearInterval(interval);
          setJobPollingInterval(null);
          setLoading(false);
          setMessage('⏰ タイムアウト: 処理に時間がかかりすぎています');
        }
        
      } catch (error) {
        console.error('[CacheManagement] Poll error:', error);
      }
    }, 1000); // 1秒ごと
    
    setJobPollingInterval(interval);
  };
  
  // キャッシュウォームアップ
  const handleWarmupCache = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      
      // まず現在のページリストを取得
      console.log('[CacheManagement] Getting page list before warmup...');
      const pagesResponse = await fetch('/api/cache-get-pages');
      
      let pageIds: string[] = [];
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        pageIds = pagesData.pageIds || [];
        console.log(`[CacheManagement] Retrieved ${pageIds.length} page IDs`);
      } else {
        console.log('[CacheManagement] Failed to get page list, using fallback');
      }

      // キャッシュウォームアップを実行
      const response = await fetch('/api/cache-warmup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageIds: pageIds.length > 0 ? pageIds : undefined,
          skipSiteMap: pageIds.length > 0
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.warmedUp}ページのキャッシュを事前読み込みしました`);
        if (data.failed > 0) {
          setMessage(prev => `${prev} (失敗: ${data.failed}ページ)`);
        }
      } else {
        setMessage(`❌ エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 特定のパターンでキャッシュクリア
  const handleClearPattern = async () => {
    const pattern = prompt('クリアするキャッシュのパターンを入力してください（例: notion:page:*）');
    if (!pattern) return;

    setLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      
      const response = await fetch('/api/cache-clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'pattern', pattern }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ パターン "${pattern}" のキャッシュをクリアしました`);
        setTimeout(fetchStats, 1000);
      } else {
        setMessage(`❌ エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 自動全ページウォームアップ
  const handleAutoWarmup = async () => {
    setLoading(true);
    setMessage('');
    setProgress({ current: 0, total: 0, succeeded: 0, failed: 0, phase: 'preparing' });
    setIsAutoProcessing(true);
    setAutoProcessingStop(false);

    try {
      const token = getAuthToken();
      
      // まず現在のページリストを取得
      console.log('[CacheManagement] Getting page list for auto warmup...');
      const pagesResponse = await fetch('/api/cache-get-pages');
      
      let pageIds: string[] = [];
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        pageIds = pagesData.pageIds || [];
        console.log(`[CacheManagement] Retrieved ${pageIds.length} page IDs for auto processing`);
      }

      if (pageIds.length === 0) {
        setMessage('⚠️ ページリストの取得に失敗しました');
        return;
      }

      let totalSucceeded = 0;
      let totalFailed = 0;
      let currentIndex = 0;
      const originalTotal = pageIds.length;
      
      setProgress({ current: 0, total: originalTotal, succeeded: 0, failed: 0, phase: 'warming' });
      setMessage(`🔥 自動ウォームアップ開始: ${originalTotal}ページを段階的に処理します`);

      // 全ページを段階的に処理
      while (currentIndex < pageIds.length && !autoProcessingStop) {
        const batchSize = Math.min(10, pageIds.length - currentIndex);
        const batchPageIds = pageIds.slice(currentIndex, currentIndex + batchSize);
        
        console.log(`[CacheManagement] Auto processing batch: ${currentIndex + 1}-${currentIndex + batchSize} of ${originalTotal}`);
        
        const warmupResponse = await fetch('/api/cache-warmup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            pageIds: batchPageIds,
            skipSiteMap: true
          }),
        });

        const warmupData = await warmupResponse.json();
        
        if (warmupResponse.ok) {
          totalSucceeded += warmupData.warmedUp;
          totalFailed += warmupData.failed;
          currentIndex += batchSize;
          
          setProgress({
            current: currentIndex,
            total: originalTotal,
            succeeded: totalSucceeded,
            failed: totalFailed,
            phase: currentIndex >= originalTotal ? 'complete' : 'warming'
          });
          
          setMessage(`🔥 処理中: ${totalSucceeded}/${currentIndex}ページ成功 (失敗: ${totalFailed})`);
          
          // 次のバッチまで待機（最後のバッチ以外）
          if (currentIndex < pageIds.length && !autoProcessingStop) {
            console.log('[CacheManagement] Waiting 5 seconds before next batch...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } else {
          console.error('[CacheManagement] Auto warmup batch failed:', warmupData.error);
          totalFailed += batchSize;
          break;
        }
      }
      
      setProgress(prev => prev ? { ...prev, phase: 'complete' } : null);
      
      if (autoProcessingStop) {
        setMessage(`⏹️ 自動処理を停止しました: ${totalSucceeded}/${currentIndex}ページ完了 (失敗: ${totalFailed})`);
      } else {
        setMessage(`✅ 自動ウォームアップ完了: ${totalSucceeded}/${originalTotal}ページ成功 (失敗: ${totalFailed})`);
      }
      
      // 統計を更新
      setTimeout(fetchStats, 1000);
      
    } catch (error) {
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setIsAutoProcessing(false);
      setTimeout(() => setProgress(null), 5000);
    }
  };

  // ページリストテスト機能
  const handleTestPageList = async () => {
    try {
      setIsTestingPageList(true);
      setPageListResult(null);
      
      const response = await fetch('/api/test-page-list');
      const result = await response.json();
      
      console.log('[CacheManagement] Full API response:', result);
      
      if (result.success) {
        console.log('[CacheManagement] Setting pageListResult to:', result.results);
        // デバッグ: 最初のページのデータを確認
        if (result.results?.siteMap?.pages?.[0]) {
          const firstPage = result.results.siteMap.pages[0];
          console.log('[CacheManagement] First page data:', {
            id: firstPage.id,
            title: firstPage.title,
            url: firstPage.url
          });
        }
        setPageListResult(result.results);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('[CacheManagement] Page list test error:', error);
      setPageListResult({
        error: error.message,
        pageCount: 0
      });
    } finally {
      setIsTestingPageList(false);
    }
  };

  // デバッグ用のウォームアップテスト
  const handleDebugWarmup = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      
      // まず現在のページリストを取得
      const pagesResponse = await fetch('/api/cache-get-pages');
      let pageIds: string[] = [];
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        pageIds = pagesData.pageIds || [];
      }

      const response = await fetch('/api/debug-cache-warmup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageIds: pageIds.slice(0, 5) // 最初の5ページをテスト
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('[CacheManagement] Debug results:', data);
        
        let debugMessage = `🔍 デバッグ結果:\n`;
        debugMessage += `成功率: ${data.summary.successRate.toFixed(1)}% (${data.summary.succeeded}/${data.summary.total})\n`;
        debugMessage += `平均時間: ${data.summary.averageTime.toFixed(0)}ms\n`;
        
        if (Object.keys(data.failurePatterns).length > 0) {
          debugMessage += `\n失敗パターン:\n`;
          Object.entries(data.failurePatterns).forEach(([pattern, pages]) => {
            debugMessage += `- ${pattern} (${(pages as string[]).length}件)\n`;
          });
        }
        
        setMessage(debugMessage);
      } else {
        setMessage(`❌ デバッグエラー: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>キャッシュ管理</h1>
      
      {/* わかりやすい説明 */}
      <div className={styles.introSection}>
        <div className={styles.introCard}>
          <h3>🤔 キャッシュとは？</h3>
          <p>ウェブサイトの表示を高速化するために、一度読み込んだデータを保存しておく仕組みです。</p>
        </div>
        <div className={styles.introCard}>
          <h3>📌 通常はこれだけ！</h3>
          <p>Notionの内容を更新した後は「<strong>クリア&ウォームアップ</strong>」ボタンを押すだけでOKです。</p>
        </div>
      </div>
      
      {/* ステータスバー */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <div className={styles.statusIndicator}>
            <div className={isConnected ? styles.indicatorGreen : styles.indicatorRed}></div>
            <span>WebSocket: {isConnected ? '接続中' : '切断'}</span>
          </div>
        </div>
        <div className={styles.statusRight}>
          {lastUpdate && (
            <span className={styles.lastUpdate}>
              🕒 最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}
            </span>
          )}
        </div>
      </div>

      {/* キャッシュ統計 */}
      {stats && (
        <div className={styles.statsContainer}>
          <h3 className={styles.sectionTitle}>📋 キャッシュ統計</h3>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statIcon}>💾</span>
                <h4>メモリキャッシュ</h4>
              </div>
              <div className={styles.statDetails}>
                <div className={styles.statRow}>
                  <span>エントリ数</span>
                  <strong>{stats.memory.size}</strong>
                </div>
                <div className={styles.statRow}>
                  <span>サイズ</span>
                  <strong>{(stats.memory.calculatedSize / 1024 / 1024).toFixed(2)} MB</strong>
                </div>
                <div className={styles.statRow}>
                  <span>ヒット率</span>
                  <strong className={styles.hitRate}>
                    {stats.memory.hits > 0 ? ((stats.memory.hits / (stats.memory.hits + stats.memory.misses)) * 100).toFixed(1) : 0}%
                  </strong>
                </div>
              </div>
            </div>

            {stats.redis.connected && (
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statIcon}>🔴</span>
                  <h4>Redisキャッシュ</h4>
                </div>
                <div className={styles.statDetails}>
                  <div className={styles.statRow}>
                    <span>状態</span>
                    <strong className={styles.connected}>接続中</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>キー数</span>
                    <strong>{stats.redis.keyCount}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>メモリ使用量</span>
                    <strong>{(stats.redis.memoryUsage / 1024 / 1024).toFixed(2)} MB</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* メイン操作 */}
      <div className={styles.mainActionSection}>
        <h2 className={styles.mainActionTitle}>🎯 通常使用するのはこれだけ！</h2>
        <div className={styles.mainActionCard}>
          <div className={styles.mainActionButtons}>
            <Tooltip content="すべてのページを事前に読み込んでキャッシュに保存します。初回アクセス時の表示速度が大幅に向上します。">
              <button
                onClick={handleOptimizedWarmup}
                disabled={loading}
                className={styles.mainActionButton}
              >
                <div className={styles.mainActionIcon}>🚀</div>
                <div className={styles.mainActionContent}>
                  <div className={styles.mainActionName}>最適化ウォームアップ</div>
                  <div className={styles.mainActionDescription}>
                    重複ページを除外して高速処理<br />
                    <small>（推奨: 2-3分で完了）</small>
                  </div>
                </div>
              </button>
            </Tooltip>
            
            <Tooltip content="既存のキャッシュをすべて削除してから、新しくキャッシュを作成します。Notionのコンテンツを大幅に更新した場合に使用してください。">
              <button
                onClick={handleClearAndWarmup}
                disabled={loading}
                className={styles.mainActionButton}
              >
                <div className={styles.mainActionIcon}>🔄</div>
                <div className={styles.mainActionContent}>
                  <div className={styles.mainActionName}>クリア&ウォームアップ</div>
                  <div className={styles.mainActionDescription}>
                    キャッシュ削除後に高速ウォームアップ<br />
                    <small>（全ページを並列処理）</small>
                  </div>
                </div>
              </button>
            </Tooltip>
            
            <Tooltip content="すべてのページを段階的に処理します。サーバー負荷を分散しながら確実にキャッシュを作成します。">
              <button
                onClick={handleAutoWarmup}
                disabled={loading || isAutoProcessing}
                className={`${styles.mainActionButton} ${styles.autoButton}`}
              >
                <div className={styles.mainActionIcon}>🚀</div>
                <div className={styles.mainActionContent}>
                  <div className={styles.mainActionName}>全自動処理</div>
                  <div className={styles.mainActionDescription}>
                    全ページを自動的に処理します<br />
                    <small>（約6-8分で完了）</small>
                  </div>
                </div>
              </button>
            </Tooltip>
          </div>
          
          <div className={styles.mainActionExplain}>
            <h4>どんな時に使う？</h4>
            <ul>
              <li>Notionでページを更新した後</li>
              <li>新しいページを追加した後</li>
              <li>ページが正しく表示されない時</li>
            </ul>
            
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '6px', fontSize: '0.875rem', border: '1px solid #ffeaa7' }}>
              <strong>⚠️ なぜ一部のページが失敗するのか？</strong><br />
              <ul style={{ marginBottom: 0, paddingLeft: '1.2rem' }}>
                <li>削除されたページや非公開ページ</li>
                <li>Notion APIの一時的な制限</li>
                <li>大きすぎるページ（画像が多いなど）</li>
                <li>権限設定の問題</li>
              </ul>
              <div style={{ marginTop: '0.5rem' }}>
                ※ 失敗したページはアクセス時に個別に読み込まれるため、サイトの動作に影響はありません。
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 詳細操作（通常は使わない） */}
      <details className={styles.advancedSection}>
        <summary className={styles.advancedSummary}>
          <span>🛠️ 詳細な操作（通常は必要ありません）</span>
          <span className={styles.chevron}>▼</span>
        </summary>
        
        <div className={styles.advancedContent}>
          <div className={styles.advancedGrid}>
            <div className={styles.advancedCard}>
              <button
                onClick={handleWarmupCache}
                disabled={loading}
                className={`${styles.button} ${styles.warmupButton}`}
              >
                <span className={styles.buttonIcon}>🚀</span>
                <span>事前読み込みのみ</span>
              </button>
              <p className={styles.buttonDescription}>
                キャッシュをクリアせずに、データを再読み込みします。
                <br /><small>※ 通常は不要です</small>
              </p>
            </div>
            
            
            <div className={styles.advancedCard}>
              <button
                onClick={() => handleClearCache('all')}
                disabled={loading}
                className={`${styles.button} ${styles.dangerButton}`}
              >
                <span className={styles.buttonIcon}>⚠️</span>
                <span>すべてクリアのみ</span>
              </button>
              <p className={styles.buttonDescription}>
                キャッシュを削除だけして、再読み込みはしません。
                <br /><small>※ 次回アクセスが遅くなります</small>
              </p>
            </div>
            
            <div className={styles.advancedCard}>
              <button
                onClick={() => handleClearCache('notion')}
                disabled={loading}
                className={styles.button}
              >
                <span className={styles.buttonIcon}>📄</span>
                <span>Notionキャッシュクリア</span>
              </button>
              <p className={styles.buttonDescription}>
                Notion関連のキャッシュだけをクリアします。
                <br /><small>※ 部分的な更新用</small>
              </p>
            </div>
            
            <div className={styles.advancedCard}>
              <button
                onClick={clearCache}
                disabled={loading}
                className={styles.button}
              >
                <span className={styles.buttonIcon}>🌐</span>
                <span>ブラウザキャッシュ</span>
              </button>
              <p className={styles.buttonDescription}>
                ブラウザ側のキャッシュをクリアします。
                <br /><small>※ Service Worker用</small>
              </p>
            </div>
            
            <div className={styles.advancedCard}>
              <button
                onClick={handleClearPattern}
                disabled={loading}
                className={styles.button}
              >
                <span className={styles.buttonIcon}>🔍</span>
                <span>パターン指定</span>
              </button>
              <p className={styles.buttonDescription}>
                特定のパターンに一致するキャッシュをクリアします。
                <br /><small>※ 開発者向け</small>
              </p>
            </div>
            
            <div className={styles.advancedCard}>
              <button
                onClick={handleDebugWarmup}
                disabled={loading}
                className={styles.button}
              >
                <span className={styles.buttonIcon}>🐛</span>
                <span>デバッグテスト</span>
              </button>
              <p className={styles.buttonDescription}>
                少数のページでウォームアップをテストして詳細なデバッグ情報を表示します。
                <br /><small>※ トラブルシューティング用</small>
              </p>
            </div>
          </div>
        </div>
      </details>

      {/* デバッグツールセクション */}
      <div style={{ 
        marginTop: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          🔍 デバッグツール
        </h3>
        
        <div style={{ 
          border: '1px solid #e5e5e5', 
          borderRadius: '8px', 
          padding: '1.5rem',
          backgroundColor: '#f9fafb' 
        }}>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
            📋 ページリストテスト
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            現在認識されているNotionページの一覧を確認します。新しく追加したページが表示されない場合は、キャッシュクリアが必要です。
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={handleTestPageList}
              disabled={isTestingPageList || loading}
              style={{
                backgroundColor: isTestingPageList ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: isTestingPageList || loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'inline-block',
                width: 'auto',
                minWidth: '200px'
              }}
              onMouseEnter={(e) => {
                if (!isTestingPageList && !loading) {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                }
              }}
              onMouseLeave={(e) => {
                if (!isTestingPageList && !loading) {
                  e.currentTarget.style.backgroundColor = '#3b82f6'
                }
              }}
            >
              {isTestingPageList ? '確認中...' : 'ページリストをテスト'}
            </button>
          </div>
          
          {pageListResult && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              backgroundColor: 'white', 
              borderRadius: '6px',
              border: '1px solid #e5e5e5'
            }}>
              {pageListResult.error ? (
                <div style={{ color: '#ef4444' }}>
                  エラー: {pageListResult.error}
                </div>
              ) : (
                <div>
                  <p style={{ color: '#059669', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {pageListResult.message || `${pageListResult.uniquePageCount || pageListResult.pageCount || 0}ページが検出されました`}
                  </p>
                  <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                    <p>ルートページID: {pageListResult.rootPageId || 'Not set'}</p>
                    {pageListResult.duplicateCount > 0 && (
                      <p style={{ color: '#f59e0b' }}>重複ページ: {pageListResult.duplicateCount}ページ</p>
                    )}
                    {(pageListResult.siteMap?.pages || pageListResult.siteMap?.sample) && (
                      <div style={{ marginTop: '1rem' }}>
                        <details open>
                          <summary style={{ 
                            cursor: 'pointer', 
                            color: '#3b82f6',
                            fontWeight: '500',
                            marginBottom: '0.5rem'
                          }}>
                            全ページ一覧 ({pageListResult.siteMap.pages?.length || pageListResult.siteMap.sample?.length || 0}件)
                          </summary>
                          
                          {/* 検索機能 */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <input
                              type="text"
                              placeholder="ページタイトルで検索..."
                              value={pageSearchTerm}
                              onChange={(e) => setPageSearchTerm(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #e5e5e5',
                                borderRadius: '4px',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          
                          {/* ページリスト */}
                          <div style={{ 
                            maxHeight: '400px',
                            overflowY: 'auto',
                            border: '1px solid #e5e5e5',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            backgroundColor: '#f9fafb'
                          }}>
                            {(() => {
                              const pages = pageListResult.siteMap.pages || pageListResult.siteMap.sample || [];
                              
                              // データ検証と修正
                              const correctedPages = pages.map((page: any) => {
                                // UUIDパターンの正規表現
                                const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
                                
                                // IDがUUID形式でない場合、titleとidが入れ替わっている可能性がある
                                const idIsUUID = uuidPattern.test(page.id.replace(/-/g, ''));
                                const titleIsUUID = uuidPattern.test(page.title.replace(/-/g, ''));
                                
                                if (!idIsUUID && titleIsUUID) {
                                  console.warn(`[CacheManagement] Swapped data detected for page:`, page);
                                  // titleとidが入れ替わっている場合は修正
                                  return {
                                    ...page,
                                    id: page.title,
                                    title: page.id
                                  };
                                }
                                
                                return page;
                              });
                              
                              const filteredPages = correctedPages.filter((page: any) =>
                                page.title.toLowerCase().includes(pageSearchTerm.toLowerCase()) ||
                                page.id.toLowerCase().includes(pageSearchTerm.toLowerCase())
                              );
                              
                              return filteredPages.map((page: any, index: number) => (
                                <div key={page.id} style={{ 
                                  padding: '0.75rem',
                                  marginBottom: '0.5rem',
                                  backgroundColor: 'white',
                                  borderRadius: '4px',
                                  border: '1px solid #e5e5e5'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <h5 style={{ 
                                        fontWeight: '500',
                                        color: '#1f2937',
                                        marginBottom: '0.25rem'
                                      }}>
                                        {index + 1}. {page.title}
                                      </h5>
                                      
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        marginBottom: '0.25rem'
                                      }}>
                                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID:</span>
                                        <code style={{ 
                                          fontSize: '0.75rem',
                                          backgroundColor: '#f3f4f6',
                                          padding: '0.125rem 0.5rem',
                                          borderRadius: '2px',
                                          fontFamily: 'monospace'
                                        }}>
                                          {page.id}
                                        </code>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(page.id);
                                            setMessage('✅ IDをコピーしました');
                                            setTimeout(() => setMessage(''), 2000);
                                          }}
                                          style={{
                                            fontSize: '0.75rem',
                                            color: '#3b82f6',
                                            cursor: 'pointer',
                                            background: 'none',
                                            border: 'none',
                                            padding: '0'
                                          }}
                                          title="IDをコピー"
                                        >
                                          📋
                                        </button>
                                      </div>
                                      
                                      {page.url && (
                                        <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                          <a 
                                            href={page.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#3b82f6', textDecoration: 'none' }}
                                          >
                                            {page.url}
                                          </a>
                                        </div>
                                      )}
                                      
                                      {page.lastEdited && (
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                          最終更新: {page.lastEdited}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {page.type && (
                                      <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        backgroundColor: page.type === 'page' ? '#dbeafe' :
                                                        page.type === 'collection_view_page' ? '#e9d5ff' :
                                                        '#f3f4f6',
                                        color: page.type === 'page' ? '#1e40af' :
                                               page.type === 'collection_view_page' ? '#6b21a8' :
                                               '#4b5563'
                                      }}>
                                        {page.type === 'page' ? 'ページ' :
                                         page.type === 'collection_view_page' ? 'データベース' :
                                         page.type}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* デバッグ情報（一時的） */}
                                  {process.env.NODE_ENV === 'development' && index === 0 && (
                                    <div style={{
                                      marginTop: '0.5rem',
                                      padding: '0.5rem',
                                      backgroundColor: '#fef3c7',
                                      fontSize: '0.75rem',
                                      fontFamily: 'monospace',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-all'
                                    }}>
                                      DEBUG: {JSON.stringify({ id: page.id, title: page.title }, null, 2)}
                                    </div>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                          
                          {/* エクスポート機能 */}
                          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                const pages = pageListResult.siteMap.pages || pageListResult.siteMap.sample || [];
                                const dataStr = JSON.stringify(pages, null, 2);
                                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                                const exportFileDefaultName = `notion-pages-${new Date().toISOString().split('T')[0]}.json`;
                                
                                const linkElement = document.createElement('a');
                                linkElement.setAttribute('href', dataUri);
                                linkElement.setAttribute('download', exportFileDefaultName);
                                linkElement.click();
                              }}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              JSONでエクスポート
                            </button>
                            
                            <button
                              onClick={() => {
                                const pages = pageListResult.siteMap.pages || pageListResult.siteMap.sample || [];
                                const csv = [
                                  ['Index', 'Title', 'ID', 'URL', 'Type', 'Last Edited'].join(','),
                                  ...pages.map((page: any, index: number) => [
                                    index + 1,
                                    `"${page.title.replace(/"/g, '""')}"`,
                                    page.id,
                                    page.url || '',
                                    page.type || '',
                                    page.lastEdited || ''
                                  ].join(','))
                                ].join('\n');
                                
                                const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csv);
                                const exportFileDefaultName = `notion-pages-${new Date().toISOString().split('T')[0]}.csv`;
                                
                                const linkElement = document.createElement('a');
                                linkElement.setAttribute('href', dataUri);
                                linkElement.setAttribute('download', exportFileDefaultName);
                                linkElement.click();
                              }}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              CSVでエクスポート
                            </button>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* プログレス表示 */}
      {(progress || processingStatus?.isProcessing || warmupJob) && (
        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <span className={styles.progressPhase}>
              {progress?.phase === 'preparing' && '📄 準備中...'}
              {progress?.phase === 'clearing' && '🗑️ キャッシュをクリア中...'}
              {(progress?.phase === 'warming' || processingStatus?.isProcessing || warmupJob?.status === 'processing' || warmupJob?.status === 'running') && '🔥 ウォームアップ中...'}
              {(progress?.phase === 'complete' || warmupJob?.status === 'completed') && !processingStatus?.isProcessing && '✅ 完了'}
              {warmupJob?.status === 'failed' && '❌ 失敗'}
              {warmupJob?.status === 'pending' && '⏳ 開始待機中...'}
            </span>
            {(processingStatus?.total || progress?.total || warmupJob?.total) > 0 && (
              <span className={styles.progressNumbers}>
                {processingStatus?.processed || progress?.current || warmupJob?.processed || 0}/{processingStatus?.total || progress?.total || warmupJob?.total || 0} ページ
                {(processingStatus?.currentBatch || warmupJob?.currentBatch) && (processingStatus?.totalBatches || warmupJob?.totalBatches) && (
                  <span className={styles.batchInfo}>
                    {` (バッチ ${processingStatus?.currentBatch || warmupJob?.currentBatch}/${processingStatus?.totalBatches || warmupJob?.totalBatches})`}
                  </span>
                )}
              </span>
            )}
          </div>
          {isAutoProcessing && progress?.phase === 'warming' && (
            <button
              onClick={() => setAutoProcessingStop(true)}
              className={styles.stopButton}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              ⏹️ 自動処理を停止
            </button>
          )}
          {(processingStatus?.total || progress?.total || warmupJob?.total) > 0 && (
            <>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${processingStatus?.progress || warmupJob?.progress || ((progress?.current || 0) / (progress?.total || 1)) * 100}%` }}
                />
              </div>
              <div className={styles.progressStats}>
                <span className={styles.progressSuccess}>✅ 成功: {processingStatus?.succeeded || progress?.succeeded || warmupJob?.succeeded || 0}</span>
                {(warmupJob?.skipped || 0) > 0 && (
                  <span className={styles.progressSkipped}>⏭️ スキップ: {warmupJob.skipped}</span>
                )}
                {(processingStatus?.failed || progress?.failed || warmupJob?.failed || 0) > 0 && (
                  <span className={styles.progressFailed}>❌ 失敗: {processingStatus?.failed || progress?.failed || warmupJob?.failed || 0}</span>
                )}
                {(processingStatus?.elapsedTime || warmupJob?.elapsedSeconds) && (
                  <span className={styles.progressTime}>⏱️ 経過: {Math.floor((processingStatus?.elapsedTime || warmupJob?.elapsedSeconds || 0) / 60)}分{(processingStatus?.elapsedTime || warmupJob?.elapsedSeconds || 0) % 60}秒</span>
                )}
                {(processingStatus?.estimatedRemainingTime || warmupJob?.estimatedSecondsRemaining) && (processingStatus?.estimatedRemainingTime || warmupJob?.estimatedSecondsRemaining) > 0 && (
                  <span className={styles.progressTime}>⏳ 残り: 約{Math.ceil((processingStatus?.estimatedRemainingTime || warmupJob?.estimatedSecondsRemaining || 0) / 60)}分</span>
                )}
              </div>
              {((processingStatus?.errorSummary && Object.keys(processingStatus.errorSummary).length > 0) || 
                (warmupJob?.errorSummary && Object.keys(warmupJob.errorSummary).length > 0)) && (
                <div className={styles.errorSummary}>
                  <span className={styles.errorSummaryTitle}>エラー詳細:</span>
                  {Object.entries(processingStatus?.errorSummary || warmupJob?.errorSummary || {}).map(([type, count]) => (
                    <span key={type} className={styles.errorType}>
                      {type === 'rateLimited' && '⏱️ レート制限'}
                      {type === 'timeout' && '⏰ タイムアウト'}
                      {type === 'notFound' && '❓ 見つからない'}
                      {type === 'other' && '❌ その他'}
                      : {count}
                    </span>
                  ))}
                </div>
              )}
              {/* 成功率の表示 */}
              {(processingStatus?.processed || progress?.current || warmupJob?.processed || 0) > 0 && (
                <div className={styles.successRate}>
                  成功率: {processingStatus?.processed 
                    ? Math.round((processingStatus.succeeded / processingStatus.processed) * 100)
                    : warmupJob?.successRate
                    ? warmupJob.successRate
                    : Math.round(((progress?.succeeded || 0) / (progress?.current || 1)) * 100)}%
                  {/* ヒント表示 */}
                  {((processingStatus?.failed || progress?.failed || warmupJob?.failed || 0) > 0) && (
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                      （削除されたページや権限のないページは失敗します）
                    </span>
                  )}
                </div>
              )}
              {/* ジョブID表示（デバッグ用） */}
              {warmupJob?.jobId && (
                <div className={styles.jobId} style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem' }}>
                  ジョブID: {warmupJob.jobId}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* メッセージ表示 */}
      {message && (
        <div className={`${styles.message} ${message.includes('✓') || message.includes('完了') ? styles.successMessage : message.includes('❌') || message.includes('エラー') ? styles.errorMessage : styles.infoMessage}`}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{message}</pre>
        </div>
      )}

      {/* API設定（開発者向け） */}
      <details className={styles.apiSection}>
        <summary className={styles.apiSummary}>
          <span>🔧 API設定（開発者向け）</span>
          <span className={styles.chevron}>▼</span>
        </summary>
        
        <div className={styles.apiContent}>
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>Webhookエンドポイント</div>
            <pre className={styles.code}>
{`curl -X POST ${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/api/cache-clear \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "all"}'`}
            </pre>
          </div>
          
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>Notion Webhook設定</div>
            <pre className={styles.code}>
{`Webhook URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/api/webhook/notion-update
Secret: NOTION_WEBHOOK_SECRET環境変数に設定`}
            </pre>
          </div>
        </div>
      </details>

      {/* ウォームアップ履歴 */}
      {warmupHistory.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
            📊 ウォームアップ履歴
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {warmupHistory.map((item, index) => (
              <div key={index} style={{ 
                padding: '0.75rem', 
                backgroundColor: 'white', 
                borderRadius: '4px',
                border: '1px solid #e1e4e8'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                  {item.date}
                </div>
                <div style={{ fontSize: '0.875rem', display: 'flex', gap: '1rem' }}>
                  <span style={{ color: '#22c55e' }}>
                    成功: {item.succeeded}/{item.total}件
                  </span>
                  {item.failed > 0 && (
                    <span style={{ color: '#ef4444' }}>失敗: {item.failed}件</span>
                  )}
                  <span style={{ color: '#6b7280' }}>({item.duration}秒)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};