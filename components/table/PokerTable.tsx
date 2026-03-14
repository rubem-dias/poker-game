'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Player } from '../../types/game';
import { PlayerSeat } from '../player/PlayerSeat';
import { PlayingCard, EmptyCardSlot } from '../cards/PlayingCard';
import { formatChips } from '../../lib/cardUtils';

const PHASE_LABEL: Record<string, string> = {
  'waiting':  '',
  'pre-flop': 'PRÉ-FLOP',
  'flop':     'FLOP',
  'turn':     'TURN',
  'river':    'RIVER',
  'showdown': 'SHOWDOWN',
};

const HAND_PT: Record<string, string> = {
  'Royal Flush':     'Royal Flush',
  'Straight Flush':  'Straight Flush',
  'Four of a Kind':  'Quadra',
  'Full House':      'Full House',
  'Flush':           'Flush',
  'Straight':        'Sequência',
  'Three of a Kind': 'Trinca',
  'Two Pair':        'Dois Pares',
  'One Pair':        'Um Par',
  'High Card':       'Carta Alta',
  'Winner by default':'Todos foldaram',
};

/* Positions every seat around an ellipse.
   i=0 → bottom-center (local player) */
function seatStyle(i: number, total: number): React.CSSProperties {
  const angle = (Math.PI / 2) + (i / total) * 2 * Math.PI;
  const rx = 42, ry = 37; // % of container
  return {
    position: 'absolute',
    left: `${50 + rx * Math.cos(angle)}%`,
    top:  `${50 + ry * Math.sin(angle)}%`,
    transform: 'translate(-50%, -50%)',
  };
}


export function PokerTable({
  gameState, localPlayerId, turnStartedAt, turnTimeoutSeconds,
}: {
  gameState: GameState;
  localPlayerId: string;
  turnStartedAt?: number;
  turnTimeoutSeconds?: number;
}) {
  const { players, communityCards, pot, phase, activePlayerId, handResults } = gameState;

  // Put local player at index 0 (bottom)
  const localIdx = players.findIndex(p => p.id === localPlayerId);
  const ordered: Player[] = localIdx >= 0
    ? [...players.slice(localIdx), ...players.slice(0, localIdx)]
    : players;

  const localPlayer = players.find(p => p.id === localPlayerId);
  const highlightedCommunityIds = localPlayer?.bestHand?.cardIds ?? [];

  return (
    /* Aspect-ratio wrapper keeps the table proportional */
    <div className="relative w-full" style={{ paddingBottom: '75%' }}>
      <div className="absolute inset-0">

        {/* ── Table SVG ── */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 900 675"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Outer dark surround */}
            <radialGradient id="g-outer" cx="50%" cy="40%" r="55%">
              <stop offset="0%"   stopColor="#1e2d42" />
              <stop offset="100%" stopColor="#0c1623" />
            </radialGradient>
            {/* Wood rim */}
            <linearGradient id="g-rim" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#5c3710" />
              <stop offset="40%"  stopColor="#7a4a18" />
              <stop offset="100%" stopColor="#3d2208" />
            </linearGradient>
            {/* Felt */}
            <radialGradient id="g-felt" cx="50%" cy="38%" r="60%">
              <stop offset="0%"   stopColor="#2e7d4f" />
              <stop offset="60%"  stopColor="#1e5c38" />
              <stop offset="100%" stopColor="#153d27" />
            </radialGradient>
            {/* Felt light sheen */}
            <radialGradient id="g-sheen" cx="50%" cy="25%" r="50%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <filter id="f-shadow" x="-5%" y="-5%" width="110%" height="120%">
              <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="rgba(0,0,0,0.7)" />
            </filter>
          </defs>

          {/* Drop shadow */}
          <ellipse cx="450" cy="338" rx="415" ry="299" fill="rgba(0,0,0,0.5)" transform="translate(0,18)" />

          {/* Outer surround (table body) */}
          <ellipse cx="450" cy="338" rx="415" ry="297" fill="url(#g-outer)" filter="url(#f-shadow)" />

          {/* Wood rim */}
          <ellipse cx="450" cy="338" rx="404" ry="282" fill="url(#g-rim)" />
          {/* Rim inner highlight */}
          <ellipse cx="450" cy="331" rx="404" ry="282" fill="none"
            stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />

          {/* Felt */}
          <ellipse cx="450" cy="338" rx="382" ry="258" fill="url(#g-felt)" />
          {/* Felt sheen */}
          <ellipse cx="450" cy="338" rx="382" ry="258" fill="url(#g-sheen)" />
          {/* Felt border */}
          <ellipse cx="450" cy="338" rx="382" ry="258" fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />

          {/* Centre decorative ellipse */}
          <ellipse cx="450" cy="338" rx="140" ry="94" fill="none"
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="5 7" />
        </svg>

        {/* ── Players ── */}
        {ordered.map((player, i) => (
          <div key={player.id} style={seatStyle(i, ordered.length)}>
            <PlayerSeat
              player={player}
              isLocal={player.id === localPlayerId}
              isActive={player.id === activePlayerId}
              turnTimeoutSeconds={player.id === activePlayerId ? turnTimeoutSeconds : undefined}
              turnStartedAt={player.id === activePlayerId ? turnStartedAt : undefined}
              showCards={phase === 'showdown'}
              bestHandCardIds={player.id === localPlayerId ? player.bestHand?.cardIds : undefined}
              bestHandCategory={player.id === localPlayerId ? player.bestHand?.category : undefined}
            />
          </div>
        ))}

        {/* ── Centre overlay ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ gap: 6, pointerEvents: 'none' }}
        >
          {/* Pot — felt-embedded, above community cards */}
          <AnimatePresence>
            {pot > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  background: 'rgba(0,0,0,0.20)',
                  borderRadius: 12,
                  padding: '6px 28px 8px',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.40), inset 0 0 0 1px rgba(255,255,255,0.04)',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase',
                } as React.CSSProperties}>
                  POT
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1,
                  letterSpacing: '0.02em',
                  textShadow: '0 1px 8px rgba(0,0,0,0.6)',
                }}>
                  ${formatChips(pot)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase pill */}
          <AnimatePresence mode="wait">
            {phase !== 'waiting' && (
              <motion.div
                key={phase}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  color: 'rgba(255,255,255,0.40)',
                  textTransform: 'uppercase',
                } as React.CSSProperties}
              >
                {PHASE_LABEL[phase]}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Community cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AnimatePresence mode="popLayout">
              {communityCards.map((card, i) => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  size="md"
                  delay={i * 0.07}
                  handHighlight={highlightedCommunityIds.includes(card.id)}
                />
              ))}
            </AnimatePresence>
            {Array.from({ length: Math.max(0, 5 - communityCards.length) }).map((_, i) => (
              <EmptyCardSlot key={`e${i}`} size="md" />
            ))}
          </div>

          {/* Hand results */}
          <AnimatePresence>
            {handResults && handResults.length > 0 && phase === 'showdown' && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {handResults.map((result, i) => {
                  const winner = players.find(p => p.id === result.winnerId);
                  return (
                    <motion.div
                      key={i}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.15 }}
                      style={{
                        background: 'linear-gradient(135deg, rgba(250,204,21,0.95), rgba(245,158,11,0.92))',
                        borderRadius: 16,
                        padding: '8px 20px',
                        textAlign: 'center',
                        boxShadow: '0 4px 24px rgba(250,204,21,0.45), 0 0 40px rgba(250,204,21,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#000',
                        lineHeight: 1.2,
                      }}>
                        🏆 {winner?.name} venceu!
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'rgba(0,0,0,0.6)',
                        marginTop: 2,
                      }}>
                        {HAND_PT[result.handName] || result.handName} · +${formatChips(result.amount)}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
