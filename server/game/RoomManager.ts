import { nanoid } from 'nanoid';
import { PokerEngine } from './PokerEngine';
import { GameState, Player } from '../../types/game';

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  maxPlayers: number;
  engine: PokerEngine;
  isStarted: boolean;
  turnTimer: NodeJS.Timeout | null;
  botTimer?: NodeJS.Timeout | null;
  botIds?: Set<string>;
  turnTimeoutSeconds: number;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const rooms = new Map<string, GameRoom>();
const codeToId = new Map<string, string>();

export function createRoom(
  hostId: string,
  maxPlayers: number,
  smallBlind: number,
  bigBlind: number
): GameRoom {
  const id = nanoid();
  const code = generateCode();
  const engine = new PokerEngine(smallBlind, bigBlind);

  const room: GameRoom = {
    id, code, hostId, maxPlayers, engine,
    isStarted: false, turnTimer: null, turnTimeoutSeconds: 30,
  };

  rooms.set(id, room);
  codeToId.set(code, id);
  return room;
}

export function getRoom(id: string): GameRoom | undefined {
  return rooms.get(id);
}

//foda

export function getRoomByCode(code: string): GameRoom | undefined {
  const id = codeToId.get(code.toUpperCase());
  return id ? rooms.get(id) : undefined;
}

export function deleteRoom(id: string): void {
  const room = rooms.get(id);
  if (room) {
    if (room.turnTimer) clearTimeout(room.turnTimer);
    codeToId.delete(room.code);
    rooms.delete(id);
  }
}

export function getPublicRooms(): Array<{id: string; code: string; playerCount: number; maxPlayers: number; isStarted: boolean}> {
  return Array.from(rooms.values()).map(r => ({
    id: r.id,
    code: r.code,
    playerCount: r.engine.state.players.length,
    maxPlayers: r.maxPlayers,
    isStarted: r.isStarted,
  }));
}
