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
      const warmupRequestBody = {
        pageIds: pageIds.length > 0 ? pageIds : undefined,
        skipSiteMap: true // クリア後なのでサイトマップはスキップ
      };
      console.log('[CacheManagement] Warmup request body:', {
        hasPageIds: !!warmupRequestBody.pageIds,
        pageIdsCount: warmupRequestBody.pageIds?.length || 0,
        skipSiteMap: warmupRequestBody.skipSiteMap
      });
      
      const warmupResponse = await fetch('/api/cache-warmup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(warmupRequestBody),
      });

      const warmupData = await warmupResponse.json();
      console.log('[CacheManagement] Warmup response:', warmupData);

      if (warmupResponse.ok) {
        setMessage(`✅ 完了: ${warmupData.warmedUp}ページを事前読み込みしました`);
        if (warmupData.failed > 0) {
          setMessage(prev => `${prev} (失敗: ${warmupData.failed}ページ)`);
        }
        
        // Debug info
        if (warmupData.debug) {
          console.log('[CacheManagement] Warmup debug info:', warmupData.debug);
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
      <h2>キャッシュ管理</h2>
      
      {/* WebSocket接続状態 */}
      <div className={styles.status}>
        <div className={styles.statusItem}>
          <span>WebSocket接続:</span>
          <span className={isConnected ? styles.connected : styles.disconnected}>
            {isConnected ? '接続中' : '切断'}
          </span>
        </div>
        {lastUpdate && (
          <div className={styles.statusItem}>
            <span>最終更新:</span>
            <span>{lastUpdate.toLocaleString('ja-JP')}</span>
          </div>
        )}
      </div>

      {/* キャッシュ統計 */}
      {stats && (
        <div className={styles.stats}>
          <h3>キャッシュ統計</h3>
          
          <div className={styles.statsSection}>
            <h4>メモリキャッシュ</h4>
            <ul>
              <li>エントリ数: {stats.memory.size}</li>
              <li>サイズ: {(stats.memory.calculatedSize / 1024 / 1024).toFixed(2)} MB</li>
              <li>ヒット率: {stats.memory.hits > 0 ? ((stats.memory.hits / (stats.memory.hits + stats.memory.misses)) * 100).toFixed(1) : 0}%</li>
            </ul>
          </div>

          {stats.redis.connected && (
            <div className={styles.statsSection}>
              <h4>Redisキャッシュ</h4>
              <ul>
                <li>状態: 接続中</li>
                <li>キー数: {stats.redis.keyCount}</li>
                <li>メモリ使用量: {(stats.redis.memoryUsage / 1024 / 1024).toFixed(2)} MB</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* キャッシュクリアボタン */}
      <div className={styles.actions}>
        <h3>キャッシュクリア</h3>
        
        <div className={styles.buttons}>
          <button
            onClick={() => handleClearCache('all')}
            disabled={loading}
            className={styles.button}
            title="警告: すべてのキャッシュをクリアすると、次回アクセス時に読み込みが遅くなります"
          >
            すべてクリア ⚠️
          </button>
          
          <button
            onClick={() => handleClearCache('notion')}
            disabled={loading}
            className={styles.button}
          >
            Notionキャッシュクリア
          </button>
          
          <button
            onClick={handleClearPattern}
            disabled={loading}
            className={styles.button}
          >
            パターン指定クリア
          </button>
          
          <button
            onClick={clearCache}
            disabled={loading}
            className={styles.button}
          >
            ブラウザキャッシュクリア
          </button>
          
          <button
            onClick={handleWarmupCache}
            disabled={loading}
            className={styles.button}
            style={{ background: '#10b981' }}
          >
            キャッシュ事前読み込み 🚀
          </button>
          
          <button
            onClick={handleClearAndWarmup}
            disabled={loading}
            className={styles.button}
            style={{ background: '#6366f1' }}
            title="キャッシュをクリアしてすぐに事前読み込みを実行"
          >
            クリア&ウォームアップ 🔄
          </button>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      {/* 使用方法 */}
      <div className={styles.help}>
        <h3>使用方法</h3>
        <ul>
          <li><strong>すべてクリア</strong>: メモリとRedisの全キャッシュをクリア</li>
          <li><strong>Notionキャッシュクリア</strong>: Notion関連のキャッシュのみクリア</li>
          <li><strong>パターン指定クリア</strong>: 特定のパターンに一致するキャッシュをクリア</li>
          <li><strong>ブラウザキャッシュクリア</strong>: Service Workerのキャッシュをクリア</li>
        </ul>
        
        <h4>Webhookエンドポイント</h4>
        <p>外部からキャッシュをクリアする場合:</p>
        <pre className={styles.code}>
{`curl -X POST ${process.env.NEXT_PUBLIC_SITE_URL}/api/cache-clear \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "all"}'`}
        </pre>
        
        <h4>Notion Webhook設定</h4>
        <p>Notionからの自動更新を受け取る場合:</p>
        <pre className={styles.code}>
{`Webhook URL: ${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/notion-update
Secret: NOTION_WEBHOOK_SECRET環境変数に設定`}
        </pre>
      </div>
    </div>
  );
};