import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';

// WebSocketを使わないシンプルなバージョン
interface RealtimeUpdateOptions {
  pageId?: string;
  onUpdate?: (data: any) => void;
  autoRefresh?: boolean;
}

export function useRealtimeUpdates(options: RealtimeUpdateOptions = {}) {
  const { pageId, onUpdate: onUpdateCallback, autoRefresh = true } = options;
  const [isConnected, setIsConnected] = useState(false); // 常にfalse（WebSocketなし）
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const router = typeof window !== 'undefined' ? useRouter() : null;

  // 手動リフレッシュ
  const refresh = useCallback(() => {
    if (router) {
      router.reload();
    }
  }, [router]);

  // キャッシュクリア
  const clearCache = useCallback(async () => {
    try {
      const token = process.env.NEXT_PUBLIC_CACHE_CLEAR_TOKEN || 
                    (typeof window !== 'undefined' && window.localStorage?.getItem('adminToken'));
      
      const response = await fetch('/api/cache-clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'all' }),
      });

      if (response.ok) {
        console.log('Cache cleared successfully');
        setLastUpdate(new Date());
        
        // 少し待ってからリロード
        setTimeout(() => {
          if (router && autoRefresh) {
            router.reload();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, [router, autoRefresh]);

  // デバッグ情報の取得（WebSocketなしバージョン）
  const debugInfo = useCallback(() => {
    return {
      websocket: {
        connected: false,
        message: 'WebSocket is disabled in this build'
      },
      cache: {
        available: true,
        type: 'memory-only'
      }
    };
  }, []);

  return {
    isConnected,
    lastUpdate,
    refresh,
    clearCache,
    debugInfo,
  };
}