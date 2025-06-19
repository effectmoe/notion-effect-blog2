import io, { Socket } from 'socket.io-client';

// グローバルなSocket.IOインスタンスを管理
let socket: Socket | null = null;

export interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

// Socket.IO接続を取得または作成
export function getSocket(config: WebSocketConfig = {}): Socket {
  if (!socket) {
    const {
      url = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      autoConnect = true,
      reconnection = true,
      reconnectionAttempts = 5,
      reconnectionDelay = 1000,
    } = config;

    socket = io(url, {
      path: '/api/socketio',
      autoConnect,
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket', 'polling'], // WebSocket優先、フォールバックでpolling
    });

    // 接続イベントの監視
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });
  }

  return socket;
}

// 接続を切断
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// 接続状態を取得
export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

// ページ更新の購読
export function subscribeToPageUpdates(pageId: string): void {
  const ws = getSocket();
  ws.emit('subscribe', { pageId });
}

// グローバル更新の購読
export function subscribeToGlobalUpdates(): void {
  const ws = getSocket();
  ws.emit('subscribe', { type: 'all' });
}

// 購読解除
export function unsubscribeFromUpdates(pageId?: string): void {
  const ws = getSocket();
  if (pageId) {
    ws.emit('unsubscribe', { pageId });
  } else {
    ws.emit('unsubscribe', { type: 'all' });
  }
}

// イベントリスナーの追加
export function onUpdate(event: string, callback: (data: any) => void): () => void {
  const ws = getSocket();
  ws.on(event, callback);
  
  // クリーンアップ関数を返す
  return () => {
    ws.off(event, callback);
  };
}

// バッチ購読（複数ページを一度に購読）
export function subscribeToMultiplePages(pageIds: string[]): void {
  const ws = getSocket();
  pageIds.forEach(pageId => {
    ws.emit('subscribe', { pageId });
  });
}

// 接続の再試行
export function reconnect(): void {
  const ws = getSocket();
  if (!ws.connected) {
    ws.connect();
  }
}

// デバッグ情報の取得
export function getDebugInfo(): {
  connected: boolean;
  id: string | undefined;
  transport: string | undefined;
} {
  const ws = getSocket();
  return {
    connected: ws.connected,
    id: ws.id,
    transport: ws.io.engine?.transport?.name,
  };
}