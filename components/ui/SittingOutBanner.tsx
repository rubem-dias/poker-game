'use client';
import { motion } from 'framer-motion';
import { GamePhase } from '../../types/game';

const PHASE_LABEL: Record<string, string> = {
  'pre-flop': 'Pré-Flop',
  'flop':     'Flop',
  'turn':     'Turn',
  'river':    'River',
  'showdown': 'Showdown',
};

export function SittingOutBanner({ phase }: { phase: GamePhase }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Main card */}
      <div
        style={{
          background: 'rgba(8,13,28,0.88)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '20px 32px',
          textAlign: 'center',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          maxWidth: 420,
          width: '100%',
        }}
      >
        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 32, display: 'inline-block', marginBottom: 12 }}
        >
          ⏳
        </motion.div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.02em',
          marginBottom: 6,
        }}>
          Aguardando a rodada terminar
        </div>

        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 400,
          color: 'rgba(255,255,255,0.42)',
          lineHeight: 1.6,
          marginBottom: 14,
        }}>
          Você entrou enquanto uma rodada estava em andamento.
          <br />
          Você jogará a partir da <strong style={{ color: 'rgba(255,255,255,0.65)' }}>próxima mão</strong>.
        </div>

        {/* Current phase indicator */}
        {phase !== 'waiting' && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 99,
            padding: '5px 14px',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block',
              boxShadow: '0 0 6px #4ade80', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
            }}>
              Rodada em andamento — {PHASE_LABEL[phase] ?? phase}
            </span>
          </div>
        )}
      </div>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        color: 'rgba(255,255,255,0.22)',
        textAlign: 'center',
      }}>
        Você já pode assistir a mesa enquanto espera 👀
      </p>
    </motion.div>
  );
}
