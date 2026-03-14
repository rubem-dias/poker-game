'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TurnInfo } from '../../types/game';
import { formatChips } from '../../lib/cardUtils';

interface ActionBarProps {
  turnInfo: TurnInfo;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  disabled?: boolean;
  playerChips?: number;
  pot?: number;
}

export function ActionBar({
  turnInfo, onFold, onCheck, onCall, onRaise, disabled, playerChips = 0, pot = 0,
}: ActionBarProps) {
  const { validActions, minRaise, maxRaise, callAmount } = turnInfo;
  const effectiveMax = playerChips > 0 ? Math.min(maxRaise, playerChips) : maxRaise;

  const [raise, setRaise] = useState(minRaise);
  useEffect(() => setRaise(minRaise), [minRaise]);

  const canCheck = validActions.includes('check');
  const canCall  = validActions.includes('call');
  const canRaise = validActions.includes('raise');
  const isAllIn  = raise >= effectiveMax;

  const step = Math.max(1, Math.round((effectiveMax - minRaise) / 200));

  const [inputValue, setInputValue] = useState(String(minRaise));
  useEffect(() => setInputValue(String(raise)), [raise]);

  const overBudget = (parseInt(inputValue, 10) || 0) > effectiveMax;

  const handleInputChange = (raw: string) => {
    setInputValue(raw.replace(/[^0-9]/g, ''));
  };
  const commitInput = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(minRaise, Math.min(effectiveMax, parsed));
      setRaise(clamped);
      setInputValue(String(clamped));
    } else {
      setInputValue(String(raise));
    }
  };

  const presets = [
    { label: 'Min',   value: minRaise },
    { label: '½P',    value: Math.round(pot * 0.5) || Math.round((minRaise + effectiveMax) / 3) },
    { label: 'Pot',   value: pot || Math.round((minRaise + effectiveMax) / 2) },
    { label: 'All In',value: effectiveMax },
  ].map(p => ({ ...p, value: Math.max(minRaise, Math.min(effectiveMax, p.value)) }));

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 480, damping: 36 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 10px 10px',
        background: 'rgba(6, 10, 22, 0.88)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Raise row */}
      {canRaise && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Slider */}
          <input
            type="range"
            min={minRaise} max={effectiveMax} step={step}
            value={raise}
            onChange={e => setRaise(Number(e.target.value))}
            disabled={disabled}
            style={{ flex: 1, height: 3, accentColor: isAllIn ? '#c084fc' : '#fcd34d' }}
          />

          {/* Amount input */}
          <div style={{ position: 'relative', width: 84 }}>
            <span style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              color: overBudget ? 'rgba(248,113,113,0.7)' : isAllIn ? 'rgba(192,132,252,0.6)' : 'rgba(252,211,77,0.6)',
              pointerEvents: 'none',
            }}>$</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={e => handleInputChange(e.target.value)}
              onBlur={e => commitInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { commitInput(inputValue); (e.target as HTMLInputElement).blur(); }
                if (e.key === 'Escape') { setInputValue(String(raise)); (e.target as HTMLInputElement).blur(); }
              }}
              disabled={disabled}
              style={{
                width: '100%',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                color: overBudget ? '#f87171' : isAllIn ? '#c084fc' : '#fcd34d',
                background: overBudget ? 'rgba(248,113,113,0.10)' : isAllIn ? 'rgba(192,132,252,0.08)' : 'rgba(252,211,77,0.08)',
                border: `1px solid ${overBudget ? 'rgba(248,113,113,0.55)' : isAllIn ? 'rgba(192,132,252,0.22)' : 'rgba(252,211,77,0.22)'}`,
                borderRadius: 8,
                padding: '4px 8px 4px 18px',
                textAlign: 'right',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: disabled ? 'not-allowed' : 'text',
              }}
            />
          </div>

          {/* Preset chips */}
          {presets.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setRaise(value)}
              disabled={disabled}
              style={{
                padding: '3px 7px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.10)',
                background: raise === value ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                color: raise === value ? '#fff' : 'rgba(255,255,255,0.38)',
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <ActionBtn
          onClick={onFold}
          disabled={disabled}
          label="Fold"
          grad="linear-gradient(135deg, #7f1d1d, #991b1b)"
          glow="rgba(220,38,38,0.30)"
          border="rgba(252,165,165,0.15)"
        />

        {canCheck ? (
          <ActionBtn
            onClick={onCheck}
            disabled={disabled}
            label="Check"
            grad="linear-gradient(135deg, #1e3a8a, #1d4ed8)"
            glow="rgba(96,165,250,0.30)"
            border="rgba(147,197,253,0.15)"
            flex
          />
        ) : canCall ? (
          <ActionBtn
            onClick={onCall}
            disabled={disabled}
            label={`Call $${formatChips(callAmount)}`}
            grad="linear-gradient(135deg, #064e3b, #059669)"
            glow="rgba(52,211,153,0.30)"
            border="rgba(110,231,183,0.15)"
            flex
          />
        ) : null}

        {canRaise && (
          <ActionBtn
            onClick={() => onRaise(raise)}
            disabled={disabled}
            label={isAllIn ? 'All In' : `Raise $${formatChips(raise)}`}
            grad={isAllIn
              ? 'linear-gradient(135deg, #4c1d95, #7c3aed)'
              : 'linear-gradient(135deg, #78350f, #d97706)'}
            glow={isAllIn ? 'rgba(167,139,250,0.38)' : 'rgba(251,191,36,0.30)'}
            border={isAllIn ? 'rgba(196,181,253,0.18)' : 'rgba(253,230,138,0.18)'}
            flex
          />
        )}
      </div>
    </motion.div>
  );
}

function ActionBtn({
  onClick, disabled, label, grad, glow, border, flex,
}: {
  onClick: () => void; disabled?: boolean;
  label: string;
  grad: string; glow: string; border: string;
  flex?: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: flex ? 1 : undefined,
        minWidth: flex ? undefined : 62,
        padding: '9px 12px',
        borderRadius: 10,
        border: `1px solid ${border}`,
        background: grad,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        boxShadow: disabled ? 'none' : `0 2px 14px ${glow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.04em',
        transition: 'opacity 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </motion.button>
  );
}
