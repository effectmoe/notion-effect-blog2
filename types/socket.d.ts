import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';
import { Server as NetServer, Socket } from 'net';

export interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

export interface SocketWithIO extends Socket {
  server: SocketServer;
}

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: SocketWithIO;
}