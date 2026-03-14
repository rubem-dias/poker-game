import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { registerRoomHandlers } from './handlers/roomHandlers';
import { registerGameHandlers } from './handlers/gameHandlers';

export function initSocketServer(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
}
