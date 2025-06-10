import { useEffect } from 'react';
import { Workbox } from 'workbox-window';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      // Service Worker registration - only in production builds
      const isProduction = window.location.hostname !== 'localhost';
      const wb = new Workbox('/sw.js');

      // Service Worker更新時の処理
      const showSkipWaitingPrompt = () => {
        const shouldUpdate = window.confirm(
          '新しいバージョンが利用可能です。更新しますか？'
        );

        if (shouldUpdate) {
          wb.addEventListener('controlling', () => {
            window.location.reload();
          });

          wb.messageSkipWaiting();
        }
      };

      // 更新検出時のイベント
      wb.addEventListener('waiting', showSkipWaitingPrompt);

      // Service Workerからのメッセージ処理
      wb.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          console.log('Cache updated at:', new Date(event.data.timestamp));
          
          // 必要に応じてUIに通知を表示
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('コンテンツが更新されました');
          }
        }
      });

      // Service Worker登録
      wb.register().then((registration) => {
        console.log('Service Worker registered:', registration);

        // 定期的な更新チェック（1時間ごと）
        setInterval(() => {
          wb.update();
        }, 60 * 60 * 1000);

        // バックグラウンド同期の登録
        if ('sync' in registration) {
          (registration as any).sync.register('sync-notion-data').catch((err: any) => {
            console.log('Background sync registration failed:', err);
          });
        }

        // 定期同期の登録（利用可能な場合）
        if ('periodicSync' in registration) {
          (registration as any).periodicSync.register('sync-notion-content', {
            minInterval: 24 * 60 * 60 * 1000 // 24時間
          }).catch((err: any) => {
            console.log('Periodic sync registration failed:', err);
          });
        }
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

      // ページ可視性変更時の処理
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          wb.update();
        }
      });

      // オフライン/オンライン状態の監視
      window.addEventListener('online', () => {
        console.log('Connection restored');
        // バックグラウンド同期をトリガー
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SYNC_NOW'
          });
        }
      });

      window.addEventListener('offline', () => {
        console.log('Connection lost');
        // オフライン通知を表示（必要に応じて）
      });

      // キャッシュ統計の取得関数をグローバルに公開
      (window as any).getCacheStats = async () => {
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          
          navigator.serviceWorker.controller?.postMessage(
            { type: 'GET_CACHE_STATS' },
            [messageChannel.port2]
          );
        });
      };

      // キャッシュクリア関数をグローバルに公開
      (window as any).clearCache = async () => {
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          
          navigator.serviceWorker.controller?.postMessage(
            { type: 'CLEAR_CACHE' },
            [messageChannel.port2]
          );
        });
      };

      // デバッグ用: キャッシュ状態のログ出力
      // Development環境でのデバッグは、環境変数で制御
      const enableDebug = false; // 必要に応じて有効化
      if (enableDebug) {
        setInterval(async () => {
          const stats = await (window as any).getCacheStats();
          console.log('Cache statistics:', stats);
        }, 30000); // 30秒ごと
      }
    }
  }, []);

  return null;
}