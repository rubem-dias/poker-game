'use client';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../stores/gameStore';
import { LobbyPage } from '../components/lobby/LobbyPage';
import { GameRoom } from '../components/table/GameRoom';

export default function Home() {
  useSocket();
  const roomId = useGameStore(s => s.roomId);

  return roomId ? <GameRoom /> : <LobbyPage />;
}
