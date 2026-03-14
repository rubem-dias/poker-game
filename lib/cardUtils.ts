import { Card, Rank, Suit } from '../types/game';

export function getSuitSymbol(suit: Suit): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit];
}

export function getSuitColor(suit: Suit): string {
  return suit === 'hearts' || suit === 'diamonds' ? '#dc2626' : '#111827';
}

export function getRankLabel(rank: Rank): string {
  return rank;
}

/** "$1,250" style for inline text */
export function formatChips(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000)    return `${(amount / 1_000).toFixed(1)}K`;
  if (amount >= 1_000)     return amount.toLocaleString('en-US');
  return String(amount);
}
