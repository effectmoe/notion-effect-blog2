import { useEffect, useState } from 'react';
import { PageHead } from '@/components/PageHead';
import styles from './cache-monitor.module.css';

interface CacheStats {
  timestamp: string;
  environment: string;
  cache: {
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
  };
  features: {
    redis: boolean;
    serviceWorker: boolean;
    edgeCache: boolean;
  };
  performance: {
    hitRate: number;
    efficiency: string;
  };
}

interface ServiceWorkerCacheStats {
  [cacheName: string]: {
    count: number;
    urls: string[];
  };
}

export default function CacheMonitor() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [swCacheStats, setSwCacheStats] = useState<ServiceWorkerCacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // サーバーサイドキャッシュの統計取得
  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/cache-status');
      if (!response.ok) throw new Error('Failed to fetch cache stats');
      const data = await response.json();
      setCacheStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Service Workerキャッシュの統計取得
  const fetchSWCacheStats = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const stats = await (window as any).getCacheStats?.();
      if (stats) {
        setSwCacheStats(stats);
      }
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      await Promise.all([fetchCacheStats(), fetchSWCacheStats()]);
      setLoading(false);
    };

    loadStats();

    // 10秒ごとに更新
    const interval = setInterval(loadStats, 10000);

    return () => clearInterval(interval);
  }, []);

  const clearCache = async (type: 'all' | 'notion' | 'sw') => {
    if (!confirm('キャッシュをクリアしてもよろしいですか？')) return;

    try {
      if (type === 'sw' || type === 'all') {
        // Service Workerキャッシュのクリア
        if ((window as any).clearCache) {
          await (window as any).clearCache();
        }
      }

      if (type === 'notion' || type === 'all') {
        // サーバーサイドキャッシュのクリア
        const response = await fetch('/api/cache-clear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'notion' }),
        });

        if (!response.ok) throw new Error('Failed to clear cache');
      }

      // 統計を再読み込み
      await Promise.all([fetchCacheStats(), fetchSWCacheStats()]);
      alert('キャッシュをクリアしました');
    } catch (err) {
      alert('キャッシュのクリアに失敗しました: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <PageHead title="Cache Monitor" />
        <div className={styles.loading}>Loading cache statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <PageHead title="Cache Monitor" />
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHead title="Cache Monitor" />
      
      <h1 className={styles.title}>キャッシュモニター</h1>
      
      {cacheStats && (
        <div className={styles.section}>
          <h2>サーバーサイドキャッシュ</h2>
          
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <h3>メモリキャッシュ</h3>
              <div className={styles.statItem}>
                <span>エントリ数:</span>
                <strong>{cacheStats.cache.memory.size}</strong>
              </div>
              <div className={styles.statItem}>
                <span>ヒット率:</span>
                <strong>{cacheStats.performance.hitRate}%</strong>
              </div>
              <div className={styles.statItem}>
                <span>効率:</span>
                <strong>{cacheStats.performance.efficiency}</strong>
              </div>
            </div>

            {cacheStats.features.redis && (
              <div className={styles.statCard}>
                <h3>Redisキャッシュ</h3>
                <div className={styles.statItem}>
                  <span>接続状態:</span>
                  <strong className={cacheStats.cache.redis.connected ? styles.connected : styles.disconnected}>
                    {cacheStats.cache.redis.connected ? '接続中' : '切断'}
                  </strong>
                </div>
                <div className={styles.statItem}>
                  <span>キー数:</span>
                  <strong>{cacheStats.cache.redis.keyCount}</strong>
                </div>
                <div className={styles.statItem}>
                  <span>メモリ使用量:</span>
                  <strong>{(cacheStats.cache.redis.memoryUsage / 1024 / 1024).toFixed(2)} MB</strong>
                </div>
              </div>
            )}
          </div>

          <div className={styles.features}>
            <h3>有効な機能</h3>
            <div className={styles.featureList}>
              <span className={`${styles.feature} ${cacheStats.features.redis ? styles.enabled : styles.disabled}`}>
                Redis
              </span>
              <span className={`${styles.feature} ${cacheStats.features.serviceWorker ? styles.enabled : styles.disabled}`}>
                Service Worker
              </span>
              <span className={`${styles.feature} ${cacheStats.features.edgeCache ? styles.enabled : styles.disabled}`}>
                Edge Cache
              </span>
            </div>
          </div>
        </div>
      )}

      {swCacheStats && (
        <div className={styles.section}>
          <h2>Service Workerキャッシュ</h2>
          
          <div className={styles.swCaches}>
            {Object.entries(swCacheStats).map(([cacheName, cache]) => (
              <div key={cacheName} className={styles.swCache}>
                <h3>{cacheName}</h3>
                <div className={styles.statItem}>
                  <span>エントリ数:</span>
                  <strong>{cache.count}</strong>
                </div>
                <details className={styles.urlList}>
                  <summary>キャッシュされたURL</summary>
                  <ul>
                    {cache.urls.slice(0, 10).map((url, index) => (
                      <li key={index}>{new URL(url).pathname}</li>
                    ))}
                    {cache.urls.length > 10 && (
                      <li>... 他 {cache.urls.length - 10} 件</li>
                    )}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button 
          className={styles.button}
          onClick={() => clearCache('notion')}
        >
          サーバーキャッシュをクリア
        </button>
        <button 
          className={styles.button}
          onClick={() => clearCache('sw')}
        >
          SWキャッシュをクリア
        </button>
        <button 
          className={`${styles.button} ${styles.danger}`}
          onClick={() => clearCache('all')}
        >
          全キャッシュをクリア
        </button>
      </div>

      <div className={styles.timestamp}>
        最終更新: {cacheStats ? new Date(cacheStats.timestamp).toLocaleString('ja-JP') : 'N/A'}
      </div>
    </div>
  );
}