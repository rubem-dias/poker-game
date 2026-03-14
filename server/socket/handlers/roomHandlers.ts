import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { createRoom, getRoom, getRoomByCode, deleteRoom } from '../../game/RoomManager';
import { broadcastGameState, clearTimersForRoom } from './gameHandlers';

const CreateRoomSchema = z.object({
  playerName: z.string().min(1).max(20),
  maxPlayers: z.number().int().min(2).max(9).default(6),
  smallBlind: z.number().int().min(1).default(10),
  bigBlind: z.number().int().min(2).default(20),
  avatar: z.number().int().min(0).max(7).default(0),
});

const JoinRoomSchema = z.object({
  code: z.string().min(6).max(6),
  playerName: z.string().min(1).max(20),
  avatar: z.number().int().min(0).max(7).default(0),
});

const STARTING_CHIPS = 1000;

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on('create-room', async (data: unknown) => {
    try {
      const { playerName, maxPlayers, smallBlind, bigBlind, avatar } = CreateRoomSchema.parse(data);
      const room = createRoom(socket.id, maxPlayers, smallBlind, bigBlind);

      room.engine.addPlayer(socket.id, playerName, 0, STARTING_CHIPS, avatar);
      await socket.join(room.id);
      socket.data.roomId  = room.id;
      socket.data.playerId = socket.id;

      socket.emit('room-joined', {
        roomId: room.id,
        code: room.code,
        playerId: socket.id,
        gameState: room.engine.getPublicState(socket.id),
        isHost: true,
        joiningMidGame: false,
      });
    } catch (e) {
      socket.emit('error', { code: 'CREATE_ROOM_FAILED', message: String(e) });
    }
  });

  socket.on('join-room', async (data: unknown) => {
    try {
      const { code, playerName, avatar } = JoinRoomSchema.parse(data);
      const room = getRoomByCode(code);

      if (!room) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada' });
        return;
      }

      if (room.engine.state.players.length >= room.maxPlayers) {
        socket.emit('error', { code: 'ROOM_FULL', message: 'Sala cheia' });
        return;
      }

      // ── Reconnect check ──────────────────────────────────
      if (room.isStarted) {
        const existing = room.engine.state.players.find(
          p => p.name === playerName && !p.id.startsWith('__bot__')
        );
        if (existing) {
          existing.isConnected = true;
          await socket.join(room.id);
          socket.data.roomId  = room.id;
          socket.data.playerId = existing.id;

          socket.emit('room-joined', {
            roomId: room.id,
            code: room.code,
            playerId: existing.id,
            gameState: room.engine.getPublicState(existing.id),
            isHost: room.hostId === existing.id,
            joiningMidGame: false,
          });
          broadcastGameState(io, room);
          return;
        }
      }

      // ── Assign seat ──────────────────────────────────────
      const takenSeats = new Set(room.engine.state.players.map(p => p.seatIndex));
      let seatIndex = 0;
      while (takenSeats.has(seatIndex)) seatIndex++;

      // Add player — if game running, they sit out until next hand
      room.engine.addPlayer(socket.id, playerName, seatIndex, STARTING_CHIPS, avatar);

      // Force sitting-out if game is already in progress
      const joiningMidGame = room.isStarted && room.engine.state.phase !== 'waiting';
      if (joiningMidGame) {
        const p = room.engine.state.players.find(pl => pl.id === socket.id);
        if (p) p.status = 'sitting-out';
      }

      await socket.join(room.id);
      socket.data.roomId  = room.id;
      socket.data.playerId = socket.id;

      socket.emit('room-joined', {
        roomId: room.id,
        code: room.code,
        playerId: socket.id,
        gameState: room.engine.getPublicState(socket.id),
        isHost: false,
        joiningMidGame,
      });

      broadcastGameState(io, room);
    } catch (e) {
      socket.emit('error', { code: 'JOIN_ROOM_FAILED', message: String(e) });
    }
  });

  // Explicit leave (button click)
  socket.on('leave-room', () => {
    handleLeave(io, socket, /* intentional */ true);
  });

  socket.on('disconnect', () => {
    handleLeave(io, socket, false);
  });
}

export function handleLeave(io: Server, socket: Socket, intentional: boolean): void {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  socket.data.roomId = null; // prevent double-call

  const room = getRoom(roomId);
  if (!room) return;

  const playerId = socket.data.playerId || socket.id;

  if (room.isStarted) {
    // If it's this player's turn, fold them first so the hand can continue
    if (room.engine.state.activePlayerId === playerId) {
      try {
        clearTimersForRoom(room);
        room.engine.processAction(playerId, 'fold');
      } catch { /* already showdown or hand ended */ }
    }

    if (intentional) {
      // Full removal on intentional leave
      room.engine.removePlayer(playerId);

      // If only bots / 0 humans left → end the game
      const humans = room.engine.state.players.filter(
        p => !p.id.startsWith('__bot__') && p.id !== playerId
      );
      if (humans.length === 0) {
        deleteRoom(roomId);
        socket.leave(roomId);
        return;
      }

      // Transfer host if needed
      if (room.hostId === playerId) {
        const next = room.engine.state.players.find(p => !p.id.startsWith('__bot__'));
        if (next) {
          room.hostId = next.id;
          io.to(roomId).emit('host-changed', { newHostId: next.id });
        }
      }

      // If < 2 eligible players remain → reset to waiting
      const active = room.engine.state.players.filter(
        p => !p.id.startsWith('__bot__') && p.chips > 0
      );
      if (active.length < 2 && room.engine.state.phase !== 'showdown' && room.engine.state.phase !== 'waiting') {
        room.isStarted = false;
        room.engine.state.phase = 'waiting';
        room.engine.state.activePlayerId = null;
        room.engine.state.handResults = null;
        io.to(roomId).emit('game-reset', { reason: 'Jogador saiu — aguardando mais jogadores' });
      }
    } else {
      // Disconnection: mark offline, keep in game
      room.engine.setPlayerConnected(playerId, false);
    }
  } else {
    // Pre-game lobby
    room.engine.removePlayer(playerId);

    const remaining = room.engine.state.players.filter(p => !p.id.startsWith('__bot__'));
    if (remaining.length === 0) {
      deleteRoom(roomId);
      socket.leave(roomId);
      return;
    }

    if (room.hostId === playerId) {
      room.hostId = remaining[0].id;
      io.to(roomId).emit('host-changed', { newHostId: room.hostId });
    }
  }

  socket.leave(roomId);
  broadcastGameState(io, room);
}
