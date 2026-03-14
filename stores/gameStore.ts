'use client';
import { create } from 'zustand';
import { GameState, TurnInfo } from '../types/game';

interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

interface GameStore {
  // Connection
  isConnected: boolean;
  roomId: string | null;
  roomCode: string | null;
  localPlayerId: string | null;
  isHost: boolean;
  joiningMidGame: boolean;

  // Game
  gameState: GameState | null;
  turnInfo: TurnInfo | null;

  // UI
  chatMessages: ChatMessage[];
  error: string | null;
  isActionPending: boolean;
  showLeaveConfirm: boolean;

  // Setters
  setConnected: (v: boolean) => void;
  setRoomInfo: (roomId: string, code: string, playerId: string, isHost: boolean, joiningMidGame: boolean) => void;
  setGameState: (state: GameState) => void;
  setTurnInfo: (info: TurnInfo | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setError: (e: string | null) => void;
  setActionPending: (v: boolean) => void;
  setHost: (v: boolean) => void;
  setShowLeaveConfirm: (v: boolean) => void;
  setJoiningMidGame: (v: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  isConnected: false,
  roomId: null,
  roomCode: null,
  localPlayerId: null,
  isHost: false,
  joiningMidGame: false,
  gameState: null,
  turnInfo: null,
  chatMessages: [],
  error: null,
  isActionPending: false,
  showLeaveConfirm: false,

  setConnected: (v) => set({ isConnected: v }),
  setRoomInfo: (roomId, roomCode, localPlayerId, isHost, joiningMidGame) =>
    set({ roomId, roomCode, localPlayerId, isHost, joiningMidGame }),
  setGameState: (gameState) => set({ gameState }),
  setTurnInfo: (turnInfo) => set({ turnInfo }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages.slice(-100), msg] })),
  setError: (error) => set({ error }),
  setActionPending: (isActionPending) => set({ isActionPending }),
  setHost: (isHost) => set({ isHost }),
  setShowLeaveConfirm: (showLeaveConfirm) => set({ showLeaveConfirm }),
  setJoiningMidGame: (joiningMidGame) => set({ joiningMidGame }),
  reset: () =>
    set({
      roomId: null, roomCode: null, localPlayerId: null, isHost: false,
      joiningMidGame: false, gameState: null, turnInfo: null,
      chatMessages: [], error: null, isActionPending: false, showLeaveConfirm: false,
    }),
}));
