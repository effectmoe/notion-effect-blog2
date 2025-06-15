import { useEffect, useCallback, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useRouter } from 'next/router';

interface RealtimeUpdateOptions {
  pageId?: string;
  onUpdate?: (data: any) => void;
  autoRefresh?: boolean;
}

export function useRealtimeUpdates(options: RealtimeUpdateOptions = {}) {
  const { pageId, onUpdate, autoRefresh = true } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Socket.IOクライアントの初期化
    const socketIo = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      path: '/api/socketio',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketIo);

    // 接続イベント
    socketIo.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);

      // ページIDがある場合は購読
      if (pageId) {
        socketIo.emit('subscribe', { pageId });
      } else {
        // グローバル更新を購読
        socketIo.emit('subscribe', { type: 'all' });
      }
    });

    // 切断イベント
    socketIo.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // ページ更新イベント
    socketIo.on('page-updated', (data) => {
      console.log('Page updated:', data);
      setLastUpdate(new Date(data.timestamp));

      if (onUpdate) {
        onUpdate(data);
      }

      if (autoRefresh && data.pageId === pageId) {
        // ページをリロード
        router.reload();
      }
    });

    // グローバル更新イベント
    socketIo.on('content-updated', (data) => {
      console.log('Content updated:', data);
      setLastUpdate(new Date(data.timestamp));

      if (onUpdate) {
        onUpdate(data);
      }

      if (autoRefresh) {
        // 現在のページに関連する更新の場合はリロード
        if (shouldRefreshPage(data)) {
          router.reload();
        }
      }
    });

    // キャッシュ無効化イベント
    socketIo.on('cache-invalidated', async (data) => {
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
      if (autoRefresh) {
        setTimeout(() => {
          router.reload();
        }, 100);
      }
    });

    // クリーンアップ
    return () => {
      if (pageId) {
        socketIo.emit('unsubscribe', { pageId });
      }
      socketIo.disconnect();
    };
  }, [pageId, onUpdate, autoRefresh, router]);

  // 手動リフレッシュ
  const refresh = useCallback(() => {
    router.reload();
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
          router.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, [router]);

  return {
    isConnected,
    lastUpdate,
    refresh,
    clearCache,
    socket,
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