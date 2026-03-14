'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import { GameState, TurnInfo } from '../types/game';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({ transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function useSocket() {
  const store = useGameStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const sock = getSocket();

    sock.on('connect',    () => store.setConnected(true));
    sock.on('disconnect', () => store.setConnected(false));

    sock.on('room-joined', (data: {
      roomId: string; code: string; playerId: string;
      gameState: GameState; isHost: boolean; joiningMidGame: boolean;
    }) => {
      store.setRoomInfo(data.roomId, data.code, data.playerId, data.isHost, data.joiningMidGame ?? false);
      store.setGameState(data.gameState);
    });

    sock.on('game-state-update', (state: GameState) => {
      store.setGameState(state);
      store.setActionPending(false);

      // Clear joiningMidGame once the round ends and a new hand starts
      const { joiningMidGame, localPlayerId } = useGameStore.getState();
      if (joiningMidGame && localPlayerId) {
        const me = state.players.find(p => p.id === localPlayerId);
        if (me && me.status !== 'sitting-out') {
          store.setJoiningMidGame(false);
        }
      }
    });

    sock.on('your-turn', (info: TurnInfo) => {
      store.setTurnInfo(info);
    });

    sock.on('host-changed', (data: { newHostId: string }) => {
      const { localPlayerId } = useGameStore.getState();
      if (data.newHostId === localPlayerId) store.setHost(true);
    });

    sock.on('game-reset', (data: { reason: string }) => {
      store.setTurnInfo(null);
      store.setError(data.reason);
      setTimeout(() => store.setError(null), 5000);
    });

    sock.on('chat-message', (msg: { playerId: string; playerName: string; text: string; timestamp: number }) => {
      store.addChatMessage(msg);
    });

    sock.on('error', (err: { code: string; message: string }) => {
      store.setError(err.message);
      setTimeout(() => store.setError(null), 5000);
    });

    sock.on('game-over', () => {
      store.reset();
    });
  }, []);

  return getSocket();
}

export function usePlayerActions() {
  const store = useGameStore();

  const sendAction = (action: string, amount?: number) => {
    store.setActionPending(true);
    store.setTurnInfo(null);
    getSocket().emit('player-action', { action, amount });
  };

  return {
    fold:  () => sendAction('fold'),
    check: () => sendAction('check'),
    call:  () => sendAction('call'),
    raise: (amount: number) => sendAction('raise', amount),
    allIn: () => sendAction('all-in'),
  };
}
