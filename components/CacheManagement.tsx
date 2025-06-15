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

  // キャッシュクリア（タイプ別）
  const handleClearCache = async (type: string) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/cache-clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CACHE_CLEAR_TOKEN}`,
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        // 統計を更新
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

  // 特定のパターンでキャッシュクリア
  const handleClearPattern = async () => {
    const pattern = prompt('クリアするキャッシュのパターンを入力してください（例: notion:page:*）');
    if (!pattern) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/cache-clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CACHE_CLEAR_TOKEN}`,
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
          >
            すべてクリア
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