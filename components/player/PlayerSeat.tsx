'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../../types/game';
import { PlayingCard } from '../cards/PlayingCard';
import { formatChips } from '../../lib/cardUtils';

/* ─── Constants ─────────────────────────────────── */
const AVATARS      = ['🦊','🐺','🦁','🐯','🐻','🦅','🦈','🐉'];
const AVATAR_GRAD  = [
  ['#f97316','#c2410c'], ['#818cf8','#4338ca'], ['#facc15','#b45309'],
  ['#f87171','#b91c1c'], ['#c084fc','#7e22ce'], ['#22d3ee','#0e7490'],
  ['#4ade80','#166534'], ['#f472b6','#9d174d'],
];
const ACTION_BADGE: Record<string, { text: string; bg: string; color: string }> = {
  fold:    { text: 'FOLD',   bg: 'rgba(220,38,38,0.85)',  color: '#fff' },
  check:   { text: 'CHECK', bg: 'rgba(37,99,235,0.85)',   color: '#fff' },
  call:    { text: 'CALL',  bg: 'rgba(22,163,74,0.85)',   color: '#fff' },
  raise:   { text: 'RAISE', bg: 'rgba(217,119,6,0.85)',   color: '#fff' },
  'all-in':{ text: 'ALL IN',bg: 'rgba(126,34,206,0.85)', color: '#fff' },
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
};

/* ─── Timer ring ─────────────────────────────────── */
const AV = 72; // avatar diameter px
const SW = 3;  // stroke width
const RR = (AV - SW) / 2;
const CC = 2 * Math.PI * RR;

function TimerRing({ total, startedAt }: { total: number; startedAt: number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 120);
    return () => clearInterval(id);
  }, [total, startedAt]);

  const pct     = Math.max(0, 1 - (Date.now() - startedAt) / (total * 1000));
  const secs    = Math.ceil(pct * total);
  const dash    = CC * (1 - pct);
  const color   = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#fbbf24' : '#f87171';
  const cx      = (AV + 8) / 2;

  return (
    <div className="absolute inset-0" style={{ zIndex: 15, pointerEvents: 'none' }}>
      <svg
        width={AV + 8} height={AV + 8}
        style={{ position: 'absolute', top: -4, left: -4, transform: 'rotate(-90deg)' }}
      >
        {/* track */}
        <circle cx={cx} cy={cx} r={RR} fill="none"
          stroke="rgba(255,255,255,0.10)" strokeWidth={SW} />
        {/* progress */}
        <circle cx={cx} cy={cx} r={RR} fill="none"
          stroke={color} strokeWidth={SW}
          strokeDasharray={CC} strokeDashoffset={dash}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.3s' }} />
      </svg>
      {/* seconds counter */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 700,
          color,
          textShadow: '0 1px 6px rgba(0,0,0,1)',
          lineHeight: 1,
        }}>
          {secs}
        </span>
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────── */
export function PlayerSeat({
  player, isLocal, isActive, turnTimeoutSeconds, turnStartedAt, showCards, bestHandCardIds, bestHandCategory,
}: {
  player: Player;
  isLocal: boolean;
  isActive: boolean;
  turnTimeoutSeconds?: number;
  turnStartedAt?: number;
  showCards?: boolean;
  bestHandCardIds?: string[];
  bestHandCategory?: string;
}) {
  const folded   = player.status === 'folded';
  const allIn    = player.status === 'all-in';
  const isBot    = player.id.startsWith('__bot__');
  const [lo, hi] = AVATAR_GRAD[player.avatar % AVATAR_GRAD.length];
  const badge    = player.lastAction ? ACTION_BADGE[player.lastAction] : null;

  return (
    <div
      className="flex flex-col items-center no-select"
      style={{
        gap: 5,
        opacity: folded ? 0.38 : 1,
        transition: 'opacity 0.35s ease',
        filter: folded ? 'grayscale(0.6)' : 'none',
      }}
    >
      {/* ── Hole cards ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 2 }}>
        {player.cards ? (
          player.cards.map((card, i) => (
            <div key={card.id} style={{ zIndex: i, marginLeft: i === 0 ? 0 : -16, position: 'relative' }}>
              <PlayingCard
                card={card}
                faceDown={!isLocal && !showCards}
                size="sm"
                delay={i * 0.1}
                highlighted={false}
                handHighlight={bestHandCardIds?.includes(card.id) ?? false}
                rotate={i === 0 ? -6 : 6}
              />
            </div>
          ))
        ) : (
          <div style={{ width: 72, height: 64 }} />
        )}
      </div>

      {/* ── Avatar circle ── */}
      <div className="relative" style={{ width: AV, height: AV }}>
        {/* Active pulse ring */}
        {isActive && (
          <motion.div
            className="absolute rounded-full"
            style={{ inset: -3 }}
            animate={{ boxShadow: [`0 0 0 2px ${lo}50`, `0 0 0 4px ${lo}28`, `0 0 0 2px ${lo}50`] }}
            transition={{ duration: 1.3, repeat: Infinity }}
          />
        )}

        {/* Timer */}
        {isActive && turnTimeoutSeconds && turnStartedAt && (
          <TimerRing total={turnTimeoutSeconds} startedAt={turnStartedAt} />
        )}

        {/* Avatar */}
        <div
          className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${lo}, ${hi})`,
            border: isActive
              ? `2.5px solid ${lo}`
              : isLocal
                ? '2.5px solid rgba(255,255,255,0.4)'
                : '2.5px solid rgba(255,255,255,0.13)',
            boxShadow: isActive
              ? `0 0 20px ${lo}60, 0 3px 12px rgba(0,0,0,0.6)`
              : '0 3px 12px rgba(0,0,0,0.55)',
            fontSize: 34,
            lineHeight: 1,
            opacity: player.isConnected ? 1 : 0.3,
          }}
        >
          {AVATARS[player.avatar % AVATARS.length]}
        </div>

        {/* Dealer / Blind badges */}
        {player.isDealer && <Badge label="D" color="#fff" text="#000" pos="right" />}
        {!player.isDealer && player.isSmallBlind && <Badge label="SB" color="#3b82f6" text="#fff" pos="left" />}
        {player.isBigBlind && <Badge label="BB" color="#f97316" text="#fff" pos="left" />}
      </div>

      {/* ── Name / chips panel ── */}
      <div
        style={{
          background: isLocal
            ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(79,70,229,0.14))'
            : 'rgba(0,0,0,0.55)',
          border: `1px solid ${isActive ? lo + '55' : isLocal ? 'rgba(99,102,241,0.38)' : 'rgba(255,255,255,0.09)'}`,
          borderRadius: 14,
          padding: '6px 12px',
          minWidth: 92,
          textAlign: 'center',
          backdropFilter: 'blur(12px)',
          boxShadow: isActive
            ? `0 0 16px ${lo}38, 0 2px 10px rgba(0,0,0,0.45)`
            : '0 2px 10px rgba(0,0,0,0.4)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Name */}
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          color: isLocal ? '#a5b4fc' : 'rgba(255,255,255,0.9)',
          maxWidth: 96,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}>
          {player.name}
        </div>

        {/* Chip count */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 700,
          color: allIn ? '#c084fc' : '#fcd34d',
          lineHeight: 1.4,
          marginTop: 1,
          letterSpacing: '0.01em',
        }}>
          {allIn ? 'ALL IN' : `$${formatChips(player.chips)}`}
        </div>
      </div>

      {/* ── Current bet + action badge — always in flow, only opacity changes ── */}
      <div style={{ height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: player.bet > 0 ? 1 : 0 }}
          transition={{ duration: 0.18 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 700,
            color: 'rgba(253,186,116,0.95)',
            background: 'rgba(217,119,6,0.18)',
            border: '1px solid rgba(253,186,116,0.22)',
            borderRadius: 99,
            padding: '3px 10px',
            letterSpacing: '0.02em',
            lineHeight: 1.5,
          }}
        >
          ${formatChips(player.bet)}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: badge ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.10em',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.5,
          }}
        >
          {badge?.text ?? ''}
        </motion.div>
      </div>

    </div>
  );
}

/* ─── Dealer/Blind badge dot ─────────────────────── */
function Badge({ label, color, text, pos }: { label: string; color: string; text: string; pos: 'left' | 'right' }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: -4,
        [pos]: -4,
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: color,
        color: text,
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        border: '1.5px solid rgba(255,255,255,0.25)',
        zIndex: 30,
        letterSpacing: '-0.5px',
      }}
    >
      {label}
    </div>
  );
}
