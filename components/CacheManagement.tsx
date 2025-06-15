import React, { useState, useEffect } from 'react';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
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

export const CacheManagement: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<WarmupProgress | null>(null);
  const { isConnected, lastUpdate, clearCache } = useRealtimeUpdates();

  // キャッシュ統計を取得
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/cache-status');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    // 30秒ごとに統計を更新
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // キャッシュクリアとウォームアップを一連の流れで実行
  const handleClearAndWarmup = async () => {
    setLoading(true);
    setMessage('');
    setProgress({ current: 0, total: 0, succeeded: 0, failed: 0, phase: 'preparing' });

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
      
      // 4. キャッシュウォームアップを実行
      console.log('[CacheManagement] Step 3: Warming up cache...');
      setProgress(prev => prev ? { ...prev, phase: 'warming' } : null);
      const warmupBody = {
        pageIds: pageIds.length > 0 ? pageIds : undefined,
        skipSiteMap: true // クリア後なのでサイトマップはスキップ
      };
      console.log('[CacheManagement] Warmup request body:', warmupBody);
      
      const warmupResponse = await fetch('/api/cache-warmup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(warmupBody),
      });

      const warmupData = await warmupResponse.json();
      console.log('[CacheManagement] Warmup response:', warmupData);
      console.log('[CacheManagement] Warmup debug info:', {
        totalAttempted: warmupData.totalPages,
        succeeded: warmupData.warmedUp,
        failed: warmupData.failed,
        failedDetails: warmupData.failedDetails,
        failureAnalysis: warmupData.debug?.failureAnalysis,
        processingTime: warmupData.debug?.processingTime
      });

      if (warmupResponse.ok) {
        // 残りのページがある場合は追加リクエストを送信
        if (warmupData.needMoreRequests && warmupData.remainingPages > 0) {
          let totalSucceeded = warmupData.warmedUp;
          let totalFailed = warmupData.failed;
          let totalProcessed = warmupData.totalPages;
          const originalTotal = warmupData.debug?.originalPageCount || warmupData.totalPages;
          
          setProgress(prev => prev ? { 
            ...prev, 
            current: totalProcessed, 
            total: originalTotal, 
            succeeded: totalSucceeded, 
            failed: totalFailed 
          } : null);
          
          // 残りのページを処理するための追加リクエスト
          const remainingPageIds = pageIds.slice(warmupData.totalPages);
          let currentIndex = warmupData.totalPages;
          
          while (remainingPageIds.length > 0 && currentIndex < pageIds.length) {
            const nextBatch = remainingPageIds.slice(0, warmupData.debug?.maxPagesPerRequest || 10);
            remainingPageIds.splice(0, nextBatch.length);
            
            console.log(`[CacheManagement] Processing additional batch: ${nextBatch.length} pages`);
            
            try {
              const additionalWarmupResponse = await fetch('/api/cache-warmup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  pageIds: nextBatch,
                  skipSiteMap: true
                }),
              });

              const additionalWarmupData = await additionalWarmupResponse.json();
              
              if (additionalWarmupResponse.ok) {
                totalSucceeded += additionalWarmupData.warmedUp;
                totalFailed += additionalWarmupData.failed;
                totalProcessed += additionalWarmupData.totalPages;
                
                setProgress(prev => prev ? { 
                  ...prev, 
                  current: totalProcessed, 
                  succeeded: totalSucceeded, 
                  failed: totalFailed 
                } : null);
                
                // もう残りがない場合は終了
                if (!additionalWarmupData.needMoreRequests) {
                  break;
                }
              } else {
                console.error('[CacheManagement] Additional warmup failed:', additionalWarmupData.error);
                break;
              }
            } catch (error) {
              console.error('[CacheManagement] Additional warmup request failed:', error);
              break;
            }
            
            currentIndex += nextBatch.length;
          }
          
          setProgress(prev => prev ? { ...prev, phase: 'complete' } : null);
          
          let resultMessage = `✅ 完了: ${totalSucceeded}/${originalTotal}ページを事前読み込みしました`;
          if (totalFailed > 0) {
            resultMessage += ` (失敗: ${totalFailed}ページ)`;
          }
          
          setMessage(resultMessage);
        } else {
          // 単一リクエストで完了
          setProgress({ 
            current: warmupData.totalPages, 
            total: warmupData.totalPages, 
            succeeded: warmupData.warmedUp, 
            failed: warmupData.failed, 
            phase: 'complete' 
          });
          
          let resultMessage = `✅ 完了: ${warmupData.warmedUp}/${warmupData.totalPages}ページを事前読み込みしました`;
          if (warmupData.failed > 0) {
            resultMessage += ` (失敗: ${warmupData.failed}ページ)`;
            
            // 失敗の詳細を表示
            if (warmupData.debug?.failureAnalysis) {
              const analysis = warmupData.debug.failureAnalysis;
              const details = [];
              if (analysis.rateLimited) details.push(`レート制限: ${analysis.rateLimited}`);
              if (analysis.timeout) details.push(`タイムアウト: ${analysis.timeout}`);
              if (analysis.notFound) details.push(`見つからない: ${analysis.notFound}`);
              if (analysis.other) details.push(`その他: ${analysis.other}`);
              
              if (details.length > 0) {
                resultMessage += `\n詳細: ${details.join(', ')}`;
              }
            }
          }
          
          if (warmupData.debug?.processingTime) {
            resultMessage += `\n処理時間: ${warmupData.debug.processingTime}`;
          }
          
          setMessage(resultMessage);
        }
      } else {
        setMessage(`❌ ウォームアップエラー: ${warmupData.error}`);
      }
      
      // 統計を更新
      setTimeout(fetchStats, 1000);
      
    } catch (error) {
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      // 完了後数秒でプログレスを非表示
      setTimeout(() => setProgress(null), 5000);
    }
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
          <button
            onClick={handleClearAndWarmup}
            disabled={loading}
            className={styles.mainActionButton}
          >
            <div className={styles.mainActionIcon}>🔄</div>
            <div className={styles.mainActionContent}>
              <div className={styles.mainActionName}>クリア&ウォームアップ</div>
              <div className={styles.mainActionDescription}>
                古いキャッシュを削除して、最新のデータを読み込みます
              </div>
            </div>
          </button>
          <div className={styles.mainActionExplain}>
            <h4>どんな時に使う？</h4>
            <ul>
              <li>Notionでページを更新した後</li>
              <li>新しいページを追加した後</li>
              <li>ページが正しく表示されない時</li>
            </ul>
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
                <span>Notionキャッシュのみ</span>
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

      {/* プログレス表示 */}
      {progress && (
        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <span className={styles.progressPhase}>
              {progress.phase === 'preparing' && '📄 準備中...'}
              {progress.phase === 'clearing' && '🗑️ キャッシュをクリア中...'}
              {progress.phase === 'warming' && '🔥 ウォームアップ中...'}
              {progress.phase === 'complete' && '✅ 完了'}
            </span>
            {progress.total > 0 && (
              <span className={styles.progressNumbers}>
                {progress.current}/{progress.total} ページ
              </span>
            )}
          </div>
          {progress.total > 0 && (
            <>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className={styles.progressStats}>
                <span className={styles.progressSuccess}>✅ 成功: {progress.succeeded}</span>
                {progress.failed > 0 && (
                  <span className={styles.progressFailed}>❌ 失敗: {progress.failed}</span>
                )}
              </div>
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
    </div>
  );
};