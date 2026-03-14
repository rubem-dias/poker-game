'use client';
import { motion } from 'framer-motion';

/** Formats a chip amount into a readable string: 1200 → "$1.2K" */
export function fmtChips(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(2).replace(/\.?0+$/, '')}K`;
  return `$${n.toLocaleString('en-US')}`;
}

/** Chip-colored coin icon */
function ChipIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#2d6a4f" stroke="#52b788" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7.5" fill="#1b4332" stroke="#52b788" strokeWidth="1" />
      <circle cx="12" cy="12" r="4" fill="#40916c" />
      {/* tick marks */}
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <line
          key={deg}
          x1="12" y1="2.5" x2="12" y2="4.5"
          stroke="#74c69d" strokeWidth="1.5" strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

interface ChipAmountProps {
  amount: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'pot' | 'bet' | 'stack';
  label?: string;
  animate?: boolean;
}

const SIZE_MAP = {
  xs: { text: 13, icon: 14, px: 6,  py: 2  },
  sm: { text: 14, icon: 16, px: 8,  py: 3  },
  md: { text: 17, icon: 19, px: 10, py: 4  },
  lg: { text: 22, icon: 24, px: 14, py: 6  },
};

export function ChipAmount({ amount, size = 'sm', variant = 'default', label, animate = true }: ChipAmountProps) {
  if (amount <= 0) return null;

  const s = SIZE_MAP[size];
  const text = fmtChips(amount);

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: 'rgba(0,0,0,0.45)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#fde68a',
    },
    pot: {
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid rgba(250,204,21,0.35)',
      color: '#fcd34d',
    },
    bet: {
      background: 'rgba(250,204,21,0.12)',
      border: '1px solid rgba(250,204,21,0.3)',
      color: '#fbbf24',
    },
    stack: {
      background: 'transparent',
      border: 'none',
      color: '#fcd34d',
    },
  };

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className="inline-flex items-center gap-1 rounded-full no-select"
        style={{
          ...variantStyles[variant],
          paddingLeft: s.px, paddingRight: s.px,
          paddingTop: s.py, paddingBottom: s.py,
          fontFamily: 'var(--font-display)',
          fontSize: s.text, fontWeight: 700,
          letterSpacing: '0.01em', whiteSpace: 'nowrap', lineHeight: 1,
        }}
      >
        <ChipIcon size={s.icon} />
        {label && <span style={{ fontSize: s.text - 2, fontWeight: 500, opacity: 0.65, marginRight: 1 }}>{label}</span>}
        <span>{text}</span>
      </motion.div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full no-select"
      style={{
        ...variantStyles[variant],
        paddingLeft: s.px,
        paddingRight: s.px,
        paddingTop: s.py,
        paddingBottom: s.py,
        fontFamily: 'var(--font-display)',
        fontSize: s.text,
        fontWeight: 700,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}
    >
      <ChipIcon size={s.icon} />
      {label && <span style={{ fontSize: s.text - 2, fontWeight: 500, opacity: 0.65, marginRight: 1 }}>{label}</span>}
      <span>{text}</span>
    </div>
  );
}

// Keep old export for any remaining usages
export const ChipStack = ChipAmount;
