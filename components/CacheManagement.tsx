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

export const CacheManagement: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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
      } else {
        console.log('[CacheManagement] Failed to get page list');
        setMessage('⚠️ ページリストの取得に失敗しました');
      }
      
      // 2. キャッシュをクリア
      console.log('[CacheManagement] Step 2: Clearing cache...');
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
        failedDetails: warmupData.failedDetails
      });

      if (warmupResponse.ok) {
        setMessage(`✅ 完了: ${warmupData.warmedUp}ページを事前読み込みしました`);
        if (warmupData.failed > 0) {
          setMessage(prev => `${prev} (失敗: ${warmupData.failed}ページ)`);
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
          </div>
        </div>
      </details>

      {/* メッセージ表示 */}
      {message && (
        <div className={`${styles.message} ${message.includes('✓') || message.includes('完了') ? styles.successMessage : message.includes('❌') || message.includes('エラー') ? styles.errorMessage : styles.infoMessage}`}>
          {message}
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