import { GameState, Player, ValidAction } from '../../types/game';
import { evaluateBestHand } from './HandEvaluator';

export interface BotDecision {
  action: 'fold' | 'check' | 'call' | 'raise';
  amount?: number;
}

const BOT_NAMES = [
  'RoboAce', 'CyberShark', 'AIBluff', 'QuantumKing', 'NeuralPair',
  'ByteFlush', 'DataRaise', 'PixelFold', 'AlgoDealer', 'SiliconPot',
];

let botNameIndex = 0;

export function getNextBotName(): string {
  return BOT_NAMES[botNameIndex++ % BOT_NAMES.length];
}

export function decideBotAction(
  bot: Player,
  state: GameState,
  validActions: ValidAction[],
  minRaise: number,
  maxRaise: number,
  callAmount: number,
): BotDecision {
  // Evaluate current hand strength
  const hasHoleCards = bot.cards && bot.cards.length === 2;
  let handStrength = 0.35; // default: weak

  if (hasHoleCards) {
    if (state.communityCards.length >= 3) {
      try {
        const result = evaluateBestHand(bot.cards!, state.communityCards);
        // Normalize rank to 0-1 (roughly)
        // Royal flush ~9M, High card ~few thousand
        handStrength = Math.min(1, result.rank / 5_000_000);
      } catch {
        handStrength = 0.3;
      }
    } else {
      // Pre-flop: estimate from hole cards
      const [c1, c2] = bot.cards!;
      const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
      const r1 = ranks.indexOf(c1.rank);
      const r2 = ranks.indexOf(c2.rank);
      const isPair = c1.rank === c2.rank;
      const isSuited = c1.suit === c2.suit;
      const highCard = Math.max(r1, r2);
      handStrength = (highCard / 13) * 0.5 + (isPair ? 0.3 : 0) + (isSuited ? 0.1 : 0);
      handStrength = Math.min(1, handStrength);
    }
  }

  // Add some randomness (bluff / fold variance)
  const rand = Math.random();
  const bluff = rand < 0.12; // 12% bluff rate
  const tightPlay = rand > 0.88; // 12% overly tight

  const effectiveStrength = bluff
    ? Math.min(1, handStrength + 0.4)
    : tightPlay
      ? Math.max(0, handStrength - 0.3)
      : handStrength;

  const canCheck = validActions.includes('check');
  const canCall = validActions.includes('call');
  const canRaise = validActions.includes('raise');

  // Decision thresholds
  if (effectiveStrength < 0.25) {
    // Weak hand
    if (canCheck) return { action: 'check' };
    if (callAmount > bot.chips * 0.3) return { action: 'fold' };
    if (canCall) return { action: 'call' };
    return { action: 'fold' };
  }

  if (effectiveStrength < 0.5) {
    // Medium hand
    if (canCheck) {
      // Sometimes bet
      if (rand < 0.3 && canRaise) {
        const amount = Math.round(minRaise * (1 + rand));
        return { action: 'raise', amount: Math.min(amount, maxRaise) };
      }
      return { action: 'check' };
    }
    if (callAmount > bot.chips * 0.5) return { action: 'fold' };
    if (canCall) return { action: 'call' };
    return { action: 'fold' };
  }

  if (effectiveStrength < 0.75) {
    // Good hand: usually call/raise
    if (canRaise && rand < 0.5) {
      const sizeMult = 1 + rand * 2;
      const amount = Math.round(Math.max(minRaise, (callAmount || minRaise) * sizeMult));
      return { action: 'raise', amount: Math.min(amount, maxRaise) };
    }
    if (canCall) return { action: 'call' };
    if (canCheck) return { action: 'check' };
    return { action: 'fold' };
  }

  // Very strong hand: raise big
  if (canRaise) {
    const amount = Math.round(maxRaise * (0.4 + rand * 0.6));
    return { action: 'raise', amount: Math.max(minRaise, Math.min(amount, maxRaise)) };
  }
  if (canCall) return { action: 'call' };
  if (canCheck) return { action: 'check' };
  return { action: 'fold' };
}
