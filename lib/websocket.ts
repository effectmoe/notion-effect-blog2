import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

// グローバル変数でSocket.IOサーバーを管理
declare global {
  var io: SocketIOServer | undefined;
}

export function initializeWebSocket(server: HTTPServer): SocketIOServer {
  if (!global.io) {
    console.log('Initializing WebSocket server...');
    
    global.io = new SocketIOServer(server, {
      path: '/api/socketio',
      cors: {
        origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    global.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // クライアントからの購読リクエスト
      socket.on('subscribe', (data) => {
        const { pageId, type } = data;
        
        if (pageId) {
          // ページ固有のルームに参加
          socket.join(`page:${pageId}`);
          console.log(`Client ${socket.id} subscribed to page:${pageId}`);
        }
        
        if (type === 'all') {
          // 全体の更新を購読
          socket.join('global-updates');
        }
      });

      // 購読解除
      socket.on('unsubscribe', (data) => {
        const { pageId } = data;
        if (pageId) {
          socket.leave(`page:${pageId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  return global.io;
}

// 特定のページの更新を通知
export function notifyPageUpdate(pageId: string, data: any) {
  if (global.io) {
    global.io.to(`page:${pageId}`).emit('page-updated', {
      pageId,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

// グローバルな更新を通知
export function notifyGlobalUpdate(type: string, data: any) {
  if (global.io) {
    global.io.to('global-updates').emit('content-updated', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

// Next.js APIルートでWebSocketをサポートするためのヘルパー
export function withWebSocket(handler: any) {
  return async (req: any, res: NextApiResponse) => {
    if (!res.socket.server.io) {
      console.log('Socket.io is not initialized');
      // 必要に応じてここで初期化
    }
    
    // リクエストにioインスタンスを追加
    req.io = global.io;
    
    return handler(req, res);
  };
}