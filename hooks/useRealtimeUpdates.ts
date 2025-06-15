import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import {
  getSocket,
  subscribeToPageUpdates,
  subscribeToGlobalUpdates,
  unsubscribeFromUpdates,
  onUpdate,
  isSocketConnected,
  getDebugInfo,
} from '@/lib/websocket-client';

// SSR/SSGビルド時のチェック
const isServer = typeof window === 'undefined';

interface RealtimeUpdateOptions {
  pageId?: string;
  onUpdate?: (data: any) => void;
  autoRefresh?: boolean;
}

export function useRealtimeUpdates(options: RealtimeUpdateOptions = {}) {
  const { pageId, onUpdate: onUpdateCallback, autoRefresh = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const router = !isServer ? useRouter() : null;

  useEffect(() => {
    // サーバーサイドでは実行しない
    if (isServer) return;

    // WebSocket接続を初期化
    const socket = getSocket();
    
    // 接続状態を監視
    const checkConnection = () => {
      setIsConnected(isSocketConnected());
    };
    
    // 初期状態をチェック
    checkConnection();
    
    // 接続イベントの監視
    const unsubConnect = onUpdate('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      
      // 購読設定
      if (pageId) {
        subscribeToPageUpdates(pageId);
      } else {
        subscribeToGlobalUpdates();
      }
    });
    
    const unsubDisconnect = onUpdate('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // ページ更新イベント
    const unsubPageUpdate = onUpdate('page-updated', (data) => {
      console.log('Page updated:', data);
      setLastUpdate(new Date(data.timestamp));

      if (onUpdateCallback) {
        onUpdateCallback(data);
      }

      if (autoRefresh && data.pageId === pageId && router) {
        // ページをリロード
        router.reload();
      }
    });

    // グローバル更新イベント
    const unsubContentUpdate = onUpdate('content-updated', (data) => {
      console.log('Content updated:', data);
      setLastUpdate(new Date(data.timestamp));

      if (onUpdateCallback) {
        onUpdateCallback(data);
      }

      if (autoRefresh && router) {
        // 現在のページに関連する更新の場合はリロード
        if (shouldRefreshPage(data)) {
          router.reload();
        }
      }
    });

    // キャッシュ無効化イベント
    const unsubCacheInvalidated = onUpdate('cache-invalidated', async (data) => {
      console.log('Cache invalidated:', data);
      
      // Service Workerのキャッシュをクリア
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          console.log('Browser cache cleared');
        } catch (error) {
          console.error('Failed to clear browser cache:', error);
        }
      }

      // ページをリロード
      if (autoRefresh && router) {
        setTimeout(() => {
          router.reload();
        }, 100);
      }
    });

    // 購読開始（既に接続済みの場合）
    if (isSocketConnected()) {
      if (pageId) {
        subscribeToPageUpdates(pageId);
      } else {
        subscribeToGlobalUpdates();
      }
    }

    // クリーンアップ
    return () => {
      unsubscribeFromUpdates(pageId);
      unsubConnect();
      unsubDisconnect();
      unsubPageUpdate();
      unsubContentUpdate();
      unsubCacheInvalidated();
    };
  }, [pageId, onUpdateCallback, autoRefresh, router]);

  // 手動リフレッシュ
  const refresh = useCallback(() => {
    if (router) {
      router.reload();
    }
  }, [router]);

  // キャッシュクリア
  const clearCache = useCallback(async () => {
    try {
      const response = await fetch('/api/cache-clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CACHE_CLEAR_TOKEN}`,
        },
        body: JSON.stringify({ type: 'all' }),
      });

      if (response.ok) {
        console.log('Cache cleared successfully');
        // 少し待ってからリロード
        setTimeout(() => {
          if (router) {
            router.reload();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, [router]);

  // デバッグ情報の取得
  const debugInfo = useCallback(() => {
    return getDebugInfo();
  }, []);

  return {
    isConnected,
    lastUpdate,
    refresh,
    clearCache,
    debugInfo,
  };
}

// 更新データに基づいてページをリフレッシュすべきか判断
function shouldRefreshPage(data: any): boolean {
  // データベース更新の場合は常にリフレッシュ
  if (data.type === 'database.updated') {
    return true;
  }

  // ページ更新の場合は現在のページと関連があるかチェック
  if (data.type === 'page.updated' && window.location.pathname.includes(data.data?.id)) {
    return true;
  }

  return false;
}