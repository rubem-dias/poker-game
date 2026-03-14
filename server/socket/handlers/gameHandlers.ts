import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { getRoom } from '../../game/RoomManager';
import { PlayerAction, ValidAction } from '../../../types/game';
import { decideBotAction, getNextBotName } from '../../game/BotPlayer';

const ActionSchema = z.object({
  action: z.enum(['fold', 'check', 'call', 'raise', 'all-in']),
  amount: z.number().int().positive().optional(),
});

const SHOWDOWN_DELAY = 4000;
const TURN_TIMEOUT = 30;
const BOT_THINK_MIN = 800;  // ms
const BOT_THINK_MAX = 2500; // ms

const BOT_PREFIX = '__bot__';

export function isBotId(id: string): boolean {
  return id.startsWith(BOT_PREFIX);
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on('start-game', () => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    if (!room) return;

    if (room.hostId !== socket.id) {
      socket.emit('error', { code: 'NOT_HOST', message: 'Only the host can start' });
      return;
    }
    if (room.engine.state.players.length < 2) {
      socket.emit('error', { code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 2 players' });
      return;
    }

    try {
      room.isStarted = true;
      room.engine.startNewHand();
      broadcastGameState(io, room);
      startTurnTimer(io, room);
    } catch (e) {
      socket.emit('error', { code: 'START_FAILED', message: String(e) });
    }
  });

  // Add a bot to the room
  socket.on('add-bot', () => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    if (!room || room.isStarted) return;
    if (room.hostId !== socket.id) return;
    if (room.engine.state.players.length >= room.maxPlayers) {
      socket.emit('error', { code: 'ROOM_FULL', message: 'Room is full' });
      return;
    }

    const botId = `${BOT_PREFIX}${Date.now()}`;
    const botName = getNextBotName();
    const takenSeats = new Set(room.engine.state.players.map(p => p.seatIndex));
    let seatIndex = 0;
    while (takenSeats.has(seatIndex)) seatIndex++;

    const avatarIndex = Math.floor(Math.random() * 8);
    room.engine.addPlayer(botId, botName, seatIndex, 1000, avatarIndex);

    // Track bots in room
    if (!room.botIds) room.botIds = new Set();
    room.botIds.add(botId);

    io.to(roomId).emit('game-state-update', room.engine.getPublicState());
  });

  // Remove a bot
  socket.on('remove-bot', (data: { botId: string }) => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    if (!room || room.isStarted || room.hostId !== socket.id) return;
    if (!data.botId?.startsWith(BOT_PREFIX)) return;

    room.engine.removePlayer(data.botId);
    room.botIds?.delete(data.botId);
    io.to(roomId).emit('game-state-update', room.engine.getPublicState());
  });

  socket.on('player-action', (data: unknown) => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    if (!room || !room.isStarted) return;

    const playerId = socket.data.playerId || socket.id;
    if (room.engine.state.activePlayerId !== playerId) {
      socket.emit('error', { code: 'NOT_YOUR_TURN', message: 'Not your turn' });
      return;
    }

    try {
      const { action, amount } = ActionSchema.parse(data);
      clearTurnTimer(room);
      room.engine.processAction(playerId, action as PlayerAction, amount);
      broadcastGameState(io, room);
      scheduleNextTurn(io, room, roomId);
    } catch (e) {
      socket.emit('error', { code: 'ACTION_FAILED', message: String(e) });
    }
  });

  socket.on('chat-message', (data: { text: string }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const player = getRoom(roomId)?.engine.state.players.find(p => p.id === socket.id);
    if (!player) return;
    io.to(roomId).emit('chat-message', {
      playerId: socket.id,
      playerName: player.name,
      text: String(data.text).slice(0, 200),
      timestamp: Date.now(),
    });
  });
}

function scheduleNextTurn(io: Server, room: NonNullable<ReturnType<typeof getRoom>>, roomId: string): void {
  if (room.engine.state.phase === 'showdown') {
    setTimeout(() => {
      if (!getRoom(roomId)) return;
      try {
        room.engine.startNewHand();
        broadcastGameState(io, room);
        startTurnTimer(io, room);
      } catch {
        room.isStarted = false;
        io.to(roomId).emit('game-over', { finalState: room.engine.getPublicState() });
      }
    }, SHOWDOWN_DELAY);
    return;
  }

  if (room.engine.state.activePlayerId) {
    startTurnTimer(io, room);
  }
}

function executeBotTurn(io: Server, room: NonNullable<ReturnType<typeof getRoom>>): void {
  const state = room.engine.state;
  const activeId = state.activePlayerId;
  if (!activeId || !isBotId(activeId)) return;

  const bot = state.players.find(p => p.id === activeId);
  if (!bot) return;

  const validActions = getValidActions(state.currentBet, bot.bet, bot.chips) as ValidAction[];
  const callAmount = Math.min(state.currentBet - bot.bet, bot.chips);
  const decision = decideBotAction(bot, state, validActions, state.minRaise, state.maxRaise, callAmount);

  const delay = BOT_THINK_MIN + Math.random() * (BOT_THINK_MAX - BOT_THINK_MIN);

  room.botTimer = setTimeout(() => {
    if (!getRoom(room.id)) return;
    if (room.engine.state.activePlayerId !== activeId) return;

    try {
      clearTurnTimer(room);
      room.engine.processAction(activeId, decision.action as PlayerAction, decision.amount);
      broadcastGameState(io, room);
      scheduleNextTurn(io, room, room.id);
    } catch { /* ignore */ }
  }, delay);
}

export function broadcastGameState(io: Server, room: ReturnType<typeof getRoom>): void {
  if (!room) return;
  const roomId = room.id;

  // Send to human players
  const sockets = io.sockets.adapter.rooms.get(roomId);
  if (sockets) {
    for (const socketId of sockets) {
      const clientSocket = io.sockets.sockets.get(socketId);
      if (!clientSocket) continue;

      const playerId = clientSocket.data.playerId || socketId;
      const state = room.engine.getPublicState(playerId);
      clientSocket.emit('game-state-update', state);

      if (state.activePlayerId === playerId && state.phase !== 'showdown' && state.phase !== 'waiting') {
        const player = state.players.find(p => p.id === playerId);
        if (player) {
          const validActions = getValidActions(room.engine.state.currentBet, player.bet, player.chips);
          clientSocket.emit('your-turn', {
            validActions,
            minRaise: state.minRaise,
            maxRaise: state.maxRaise,
            callAmount: Math.min(state.currentBet - player.bet, player.chips),
            turnStartedAt: Date.now(),
            timeoutSeconds: TURN_TIMEOUT,
          });
        }
      }
    }
  }

  // Schedule bot turn if active
  const activeId = room.engine.state.activePlayerId;
  if (activeId && isBotId(activeId) && room.engine.state.phase !== 'showdown' && room.engine.state.phase !== 'waiting') {
    if (room.botTimer) clearTimeout(room.botTimer);
    executeBotTurn(io, room);
  }
}

function getValidActions(currentBet: number, playerBet: number, playerChips: number) {
  const actions: string[] = ['fold'];
  if (currentBet === playerBet) actions.push('check');
  if (currentBet > playerBet && playerChips > 0) actions.push('call');
  if (playerChips > 0) actions.push('raise');
  return actions;
}

function startTurnTimer(io: Server, room: NonNullable<ReturnType<typeof getRoom>>): void {
  clearTurnTimer(room);
  const activeId = room.engine.state.activePlayerId;
  if (!activeId) return;

  // Bots are handled separately with their own timer
  if (isBotId(activeId)) {
    executeBotTurn(io, room);
    return;
  }

  room.turnTimer = setTimeout(() => {
    if (room.engine.state.activePlayerId !== activeId) return;
    try {
      room.engine.processAction(activeId, 'fold');
      broadcastGameState(io, room);
      scheduleNextTurn(io, room, room.id);
    } catch { /* ignore */ }
  }, TURN_TIMEOUT * 1000);
}

function clearTurnTimer(room: NonNullable<ReturnType<typeof getRoom>>): void {
  if (room.turnTimer) { clearTimeout(room.turnTimer); room.turnTimer = null; }
  if (room.botTimer)  { clearTimeout(room.botTimer);  room.botTimer  = null; }
}

/** Exported so roomHandlers can clear timers on forced leave */
export function clearTimersForRoom(room: NonNullable<ReturnType<typeof getRoom>>): void {
  clearTurnTimer(room);
}
