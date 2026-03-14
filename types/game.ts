export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type GamePhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export type PlayerStatus = 'waiting' | 'active' | 'folded' | 'all-in' | 'sitting-out';

export interface Player {
  id: string;
  name: string;
  seatIndex: number;
  chips: number;
  bet: number;
  totalBet: number;
  cards: Card[] | null; // null for opponents
  status: PlayerStatus;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  lastAction: PlayerAction | null;
  avatar: number; // 0-7 avatar index
  isConnected: boolean;
  bestHand?: { category: string; cardIds: string[] };
}

export interface SidePot {
  amount: number;
  eligiblePlayers: string[];
}

export interface HandResult {
  winnerId: string;
  winnerIds: string[];
  handName: string;
  handRank: number;
  amount: number;
  sidePot?: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  currentBet: number;
  activePlayerId: string | null;
  dealerSeatIndex: number;
  smallBlindAmount: number;
  bigBlindAmount: number;
  minRaise: number;
  maxRaise: number;
  handResults: HandResult[] | null;
  roundNumber: number;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  maxPlayers: number;
  players: Player[];
  gameState: GameState | null;
  isStarted: boolean;
  smallBlind: number;
  bigBlind: number;
}

export type ValidAction = 'fold' | 'check' | 'call' | 'raise';

export interface TurnInfo {
  validActions: ValidAction[];
  minRaise: number;
  maxRaise: number;
  callAmount: number;
  turnStartedAt: number;
  timeoutSeconds: number;
}
