import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import { initializeWebSocket } from '@/lib/websocket';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    const httpServer = res.socket.server as any;
    const io = initializeWebSocket(httpServer);
    res.socket.server.io = io;
  }
  
  res.end();
}