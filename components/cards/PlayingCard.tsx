'use client';
import { motion } from 'framer-motion';
import { Card } from '../../types/game';
import { getSuitSymbol, getSuitColor } from '../../lib/cardUtils';

interface PlayingCardProps {
  card: Card | null;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  className?: string;
  highlighted?: boolean;
  handHighlight?: boolean;
  rotate?: number;
}

/* Pixel sizes per variant */
const S = {
  sm: { w: 56,  h: 80,  rank: 17, pip: 28 },
  md: { w: 76,  h: 108, rank: 20, pip: 38 },
  lg: { w: 100, h: 140, rank: 26, pip: 50 },
};

export function PlayingCard({
  card, faceDown = false, size = 'md', delay = 0, className = '', highlighted = false, handHighlight = false, rotate = 0,
}: PlayingCardProps) {
  const d     = S[size];
  const back  = faceDown || !card;
  const isRed = card ? getSuitColor(card.suit) === '#dc2626' : false;
  const color = card ? getSuitColor(card.suit) : '#111';

  return (
    <motion.div
      initial={{ scale: 0.45, y: -30, opacity: 0, rotate: rotate - 8 }}
      animate={{ scale: 1, y: 0, opacity: 1, rotate }}
      transition={{ type: 'spring', stiffness: 480, damping: 30, delay }}
      className={`flex-shrink-0 no-select ${className}`}
      style={{ width: d.w, height: d.h, perspective: 900 }}
    >
      <motion.div
        animate={{ rotateY: back ? 180 : 0 }}
        transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
      >

        {/* ── FRONT ── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: '#ffffff',
            boxShadow: highlighted
              ? '0 0 0 2px #4ade80, 0 6px 28px rgba(0,0,0,0.55), 0 0 20px rgba(74,222,128,0.35)'
              : handHighlight
                ? '0 0 0 2.5px #fbbf24, 0 6px 28px rgba(0,0,0,0.55), 0 0 18px rgba(251,191,36,0.45)'
                : '0 6px 28px rgba(0,0,0,0.55)',
          }}
        >
          {card && (
            <>
              {/* Subtle inner border */}
              <div
                className="absolute rounded-lg"
                style={{
                  inset: 3,
                  border: `1px solid ${isRed ? 'rgba(220,38,38,0.12)' : 'rgba(0,0,0,0.06)'}`,
                }}
              />

              {/* Top-left corner */}
              <div
                style={{
                  position: 'absolute',
                  top: 5,
                  left: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  lineHeight: 1,
                  color,
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: d.rank,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}>
                  {card.rank}
                </span>
                <span style={{ fontSize: d.rank - 3, lineHeight: 1, marginTop: 1 }}>
                  {getSuitSymbol(card.suit)}
                </span>
              </div>

              {/* Centre pip */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                  fontSize: d.pip,
                  lineHeight: 1,
                  filter: isRed ? 'drop-shadow(0 1px 2px rgba(200,0,0,0.2))' : undefined,
                }}
              >
                {getSuitSymbol(card.suit)}
              </div>

              {/* Bottom-right corner (rotated) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  lineHeight: 1,
                  color,
                  transform: 'rotate(180deg)',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: d.rank,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}>
                  {card.rank}
                </span>
                <span style={{ fontSize: d.rank - 3, lineHeight: 1, marginTop: 1 }}>
                  {getSuitSymbol(card.suit)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── BACK ── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(145deg, #4f46e5 0%, #6d28d9 50%, #4338ca 100%)',
            boxShadow: '0 6px 28px rgba(0,0,0,0.55)',
          }}
        >
          {/* Inner border */}
          <div
            className="absolute rounded-lg"
            style={{
              inset: 4,
              border: '1.5px solid rgba(255,255,255,0.22)',
              background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 0, transparent 50%)',
              backgroundSize: '7px 7px',
            }}
          />
          {/* Centre icon */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: d.pip * 0.65,
              opacity: 0.2,
              color: '#fff',
            }}
          >
            ♠
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}

export function EmptyCardSlot({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const d = S[size];
  return (
    <div
      className="rounded-xl flex-shrink-0"
      style={{
        width: d.w,
        height: d.h,
        border: '1.5px dashed rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.12)',
      }}
    />
  );
}
