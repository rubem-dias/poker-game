'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const PANEL: React.CSSProperties = {
  background: 'rgba(8, 13, 28, 0.90)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 20,
  backdropFilter: 'blur(24px)',
  boxShadow: '0 -4px 40px rgba(0,0,0,0.55)',
};

export function ActionBar({
  turnInfo, onFold, onCheck, onCall, onRaise, disabled, playerChips = 0, pot = 0,
}: ActionBarProps) {
  const { validActions, minRaise, maxRaise, callAmount } = turnInfo;
  const [raise, setRaise] = useState(minRaise);
  useEffect(() => setRaise(minRaise), [minRaise]);

  const canCheck = validActions.includes('check');
  const canCall  = validActions.includes('call');
  const canRaise = validActions.includes('raise');
  const isAllIn  = raise >= maxRaise;

  const step = Math.max(1, Math.round((maxRaise - minRaise) / 200));

  // Editable input state — digits only, clamped on commit
  const [inputValue, setInputValue] = useState(String(minRaise));
  useEffect(() => setInputValue(String(raise)), [raise]);

  const handleInputChange = (raw: string) => {
    // Strip anything that isn't a digit
    const digits = raw.replace(/[^0-9]/g, '');
    setInputValue(digits);
  };

  const commitInput = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(minRaise, Math.min(maxRaise, parsed));
      setRaise(clamped);
      setInputValue(String(clamped));
    } else {
      // Reset to current raise if empty/invalid
      setInputValue(String(raise));
    }
  };

  const presets = [
    { label: 'Min',  value: minRaise },
    { label: '½ Pot', value: Math.round(pot * 0.5) || Math.round((minRaise + maxRaise) / 3) },
    { label: 'Pot',  value: pot || Math.round((minRaise + maxRaise) / 2) },
    { label: 'All In', value: maxRaise },
  ].map(p => ({ ...p, value: Math.max(minRaise, Math.min(maxRaise, p.value)) }));

  return (
    <motion.div
      initial={{ y: 70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 70, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 480, damping: 36 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {/* Raise panel */}
      {canRaise && (
        <div style={{ ...PANEL, padding: '14px 16px' }}>
          {/* Slider row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <input
              type="range"
              min={minRaise} max={maxRaise} step={step}
              value={raise}
              onChange={e => setRaise(Number(e.target.value))}
              disabled={disabled}
              style={{ flex: 1 }}
            />
            {/* Amount input — editable */}
            <div style={{ position: 'relative', minWidth: 92 }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
                color: isAllIn ? 'rgba(192,132,252,0.7)' : 'rgba(252,211,77,0.7)',
                pointerEvents: 'none', userSelect: 'none',
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
                  fontSize: 18,
                  fontWeight: 700,
                  color: isAllIn ? '#c084fc' : '#fcd34d',
                  background: isAllIn ? 'rgba(192,132,252,0.10)' : 'rgba(252,211,77,0.10)',
                  border: `1px solid ${isAllIn ? 'rgba(192,132,252,0.28)' : 'rgba(252,211,77,0.28)'}`,
                  borderRadius: 10,
                  padding: '5px 10px 5px 22px',
                  textAlign: 'right',
                  lineHeight: 1.3,
                  letterSpacing: '0.01em',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: disabled ? 'not-allowed' : 'text',
                }}
              />
            </div>
          </div>

          {/* Preset chips */}
          <div style={{ display: 'flex', gap: 6 }}>
            {presets.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setRaise(value)}
                disabled={disabled}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  borderRadius: 9,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: raise === value ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                  color: raise === value ? '#fff' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: '0.01em',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ ...PANEL, padding: '10px 10px', display: 'flex', gap: 8 }}>
        {/* FOLD */}
        <ActionBtn
          onClick={onFold}
          disabled={disabled}
          label="FOLD"
          sub="Desistir"
          grad="linear-gradient(160deg, #7f1d1d 0%, #991b1b 100%)"
          glow="rgba(220,38,38,0.38)"
          borderColor="rgba(252,165,165,0.20)"
        />

        {/* CHECK / CALL */}
        {canCheck ? (
          <ActionBtn
            onClick={onCheck}
            disabled={disabled}
            label="CHECK"
            sub="Sem custo"
            grad="linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 100%)"
            glow="rgba(96,165,250,0.38)"
            borderColor="rgba(147,197,253,0.20)"
            flex
          />
        ) : canCall ? (
          <ActionBtn
            onClick={onCall}
            disabled={disabled}
            label="CALL"
            sub={`$${formatChips(callAmount)}`}
            grad="linear-gradient(160deg, #064e3b 0%, #059669 100%)"
            glow="rgba(52,211,153,0.38)"
            borderColor="rgba(110,231,183,0.20)"
            flex
          />
        ) : null}

        {/* RAISE / ALL IN */}
        {canRaise && (
          <ActionBtn
            onClick={() => onRaise(raise)}
            disabled={disabled}
            label={isAllIn ? 'ALL IN' : 'RAISE'}
            sub={`$${formatChips(raise)}`}
            grad={isAllIn
              ? 'linear-gradient(160deg, #4c1d95 0%, #7c3aed 100%)'
              : 'linear-gradient(160deg, #78350f 0%, #d97706 100%)'}
            glow={isAllIn ? 'rgba(167,139,250,0.45)' : 'rgba(251,191,36,0.38)'}
            borderColor={isAllIn ? 'rgba(196,181,253,0.22)' : 'rgba(253,230,138,0.22)'}
            flex
          />
        )}
      </div>
    </motion.div>
  );
}

function ActionBtn({
  onClick, disabled, label, sub, grad, glow, borderColor, flex,
}: {
  onClick: () => void; disabled?: boolean;
  label: string; sub: string;
  grad: string; glow: string; borderColor: string;
  flex?: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.04, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: flex ? 1 : undefined,
        minWidth: flex ? undefined : 72,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '12px 8px',
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        background: grad,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.42 : 1,
        boxShadow: disabled ? 'none' : `0 4px 18px ${glow}, inset 0 1px 0 rgba(255,255,255,0.12)`,
        transition: 'opacity 0.2s, box-shadow 0.2s',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 17,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.06em',
        lineHeight: 1,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.55)',
        lineHeight: 1,
        marginTop: 1,
      }}>
        {sub}
      </span>
    </motion.button>
  );
}
