'use client';
import { useEffect, useState } from 'react';

interface TurnTimerProps {
  total: number;
  startedAt: number;
}

const SIZE = 72;
const STROKE = 3;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function TurnTimer({ total, startedAt }: TurnTimerProps) {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    let raf: number;

    const update = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, 1 - elapsed / total);
      setProgress(remaining);
      if (remaining > 0) raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [total, startedAt]);

  const color = progress > 0.5 ? '#10b981' : progress > 0.25 ? '#f59e0b' : '#ef4444';
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <svg
      className="absolute -inset-1 pointer-events-none"
      width={SIZE + 8}
      height={SIZE + 8}
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Track */}
      <circle
        cx={(SIZE + 8) / 2}
        cy={(SIZE + 8) / 2}
        r={R + 1}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={STROKE}
      />
      {/* Progress */}
      <circle
        cx={(SIZE + 8) / 2}
        cy={(SIZE + 8) / 2}
        r={R + 1}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ transition: 'stroke 0.3s' }}
      />
    </svg>
  );
}
