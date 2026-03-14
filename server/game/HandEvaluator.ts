import { Card, Rank } from '../../types/game';

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export type HandCategory =
  | 'Royal Flush' | 'Straight Flush' | 'Four of a Kind' | 'Full House'
  | 'Flush' | 'Straight' | 'Three of a Kind' | 'Two Pair' | 'One Pair' | 'High Card';

export interface HandEvaluation {
  rank: number; // higher = better, for comparison
  category: HandCategory;
  cards: Card[];      // best 5 cards (for comparison)
  comboCards: Card[]; // only the cards forming the combination (no kickers)
}

function rankVal(r: Rank): number {
  return RANK_VALUES[r];
}

function getCombinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (cards.length === 0) return [];
  const [first, ...rest] = cards;
  const withFirst = getCombinations(rest, k - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function evaluateFiveCards(cards: Card[]): HandEvaluation {
  const sorted = [...cards].sort((a, b) => rankVal(b.rank) - rankVal(a.rank));
  const ranks = sorted.map(c => rankVal(c.rank));
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  const isWheelStraight = checkWheelStraight(ranks);

  const counts = getRankCounts(ranks);
  const countValues = Object.values(counts).sort((a, b) => b - a);

  // Determine hand category
  if (isFlush && isStraight) {
    const isRoyal = ranks[0] === 14 && ranks[1] === 13;
    return { rank: isRoyal ? 9000000 : 8000000 + ranks[0], category: isRoyal ? 'Royal Flush' : 'Straight Flush', cards: sorted, comboCards: sorted };
  }

  if (isFlush && isWheelStraight) {
    return { rank: 8000000 + 5, category: 'Straight Flush', cards: sorted, comboCards: sorted };
  }

  if (countValues[0] === 4) {
    const quad = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 4)!);
    const kicker = ranks.find(r => r !== quad)!;
    return {
      rank: 7000000 + quad * 100 + kicker,
      category: 'Four of a Kind',
      cards: sorted,
      comboCards: sorted.filter(c => rankVal(c.rank) === quad),
    };
  }

  if (countValues[0] === 3 && countValues[1] === 2) {
    const triple = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 3)!);
    const pair = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 2)!);
    return { rank: 6000000 + triple * 100 + pair, category: 'Full House', cards: sorted, comboCards: sorted };
  }

  if (isFlush) {
    return { rank: 5000000 + ranks.reduce((a, r, i) => a + r * Math.pow(15, 4 - i), 0), category: 'Flush', cards: sorted, comboCards: sorted };
  }

  if (isStraight) {
    return { rank: 4000000 + ranks[0], category: 'Straight', cards: sorted, comboCards: sorted };
  }

  if (isWheelStraight) {
    return { rank: 4000000 + 5, category: 'Straight', cards: sorted, comboCards: sorted };
  }

  if (countValues[0] === 3) {
    const triple = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 3)!);
    const kickers = ranks.filter(r => r !== triple).sort((a, b) => b - a);
    return {
      rank: 3000000 + triple * 10000 + kickers[0] * 100 + kickers[1],
      category: 'Three of a Kind',
      cards: sorted,
      comboCards: sorted.filter(c => rankVal(c.rank) === triple),
    };
  }

  if (countValues[0] === 2 && countValues[1] === 2) {
    const pairs = Object.keys(counts).filter(k => counts[parseInt(k)] === 2).map(Number).sort((a, b) => b - a);
    const kicker = ranks.find(r => r !== pairs[0] && r !== pairs[1])!;
    return {
      rank: 2000000 + pairs[0] * 10000 + pairs[1] * 100 + kicker,
      category: 'Two Pair',
      cards: sorted,
      comboCards: sorted.filter(c => pairs.includes(rankVal(c.rank))),
    };
  }

  if (countValues[0] === 2) {
    const pair = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 2)!);
    const kickers = ranks.filter(r => r !== pair).sort((a, b) => b - a);
    return {
      rank: 1000000 + pair * 100000 + kickers[0] * 1000 + kickers[1] * 10 + kickers[2],
      category: 'One Pair',
      cards: sorted,
      comboCards: sorted.filter(c => rankVal(c.rank) === pair),
    };
  }

  return {
    rank: ranks.reduce((a, r, i) => a + r * Math.pow(15, 4 - i), 0),
    category: 'High Card',
    cards: sorted,
    comboCards: sorted,
  };
}

function checkStraight(ranks: number[]): boolean {
  for (let i = 0; i < ranks.length - 1; i++) {
    if (ranks[i] - ranks[i + 1] !== 1) return false;
  }
  return true;
}

function checkWheelStraight(ranks: number[]): boolean {
  // A-2-3-4-5
  const sorted = [...ranks].sort((a, b) => b - a);
  return sorted[0] === 14 && sorted[1] === 5 && sorted[2] === 4 && sorted[3] === 3 && sorted[4] === 2;
}

function getRankCounts(ranks: number[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const r of ranks) {
    counts[r] = (counts[r] || 0) + 1;
  }
  return counts;
}

export function evaluateBestHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...communityCards];
  const combos = getCombinations(allCards, 5);
  let best: HandEvaluation | null = null;

  for (const combo of combos) {
    const eval5 = evaluateFiveCards(combo);
    if (!best || eval5.rank > best.rank) {
      best = eval5;
    }
  }

  return best!;
}

export function compareHands(a: HandEvaluation, b: HandEvaluation): number {
  return a.rank - b.rank;
}
