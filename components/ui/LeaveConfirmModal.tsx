'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaveConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isInGame: boolean; // whether game is running (warns about folding)
}

export function LeaveConfirmModal({ isOpen, onConfirm, onCancel, isInGame }: LeaveConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                pointerEvents: 'all',
                background: 'linear-gradient(145deg, #0f172a, #1e293b)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 24,
                padding: '32px 28px',
                maxWidth: 360,
                width: '100%',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                textAlign: 'center',
              }}
            >
              {/* Icon */}
              <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>🚪</div>

              {/* Title */}
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 10,
                letterSpacing: '0.01em',
              }}>
                Sair da mesa?
              </h2>

              {/* Body */}
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.50)',
                lineHeight: 1.6,
                marginBottom: 24,
              }}>
                {isInGame
                  ? 'Você será retirado da rodada atual. Se for sua vez, suas cartas serão automaticamente descartadas.'
                  : 'Você vai sair da sala de espera. Poderá entrar de volta com o mesmo código.'}
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Cancel */}
                <button
                  onClick={onCancel}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.75)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                >
                  Ficar
                </button>

                {/* Confirm */}
                <button
                  onClick={onConfirm}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 14,
                    border: '1px solid rgba(239,68,68,0.30)',
                    background: 'linear-gradient(145deg, #7f1d1d, #dc2626)',
                    color: '#fff',
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(220,38,38,0.35)',
                    transition: 'filter 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                >
                  Sair
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
