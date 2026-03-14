'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { HandResult, Player } from '../../types/game';
import { formatChips } from '../../lib/cardUtils';

interface WinnerOverlayProps {
  results: HandResult[];
  players: Player[];
  localPlayerId: string;
}

export function WinnerOverlay({ results, players, localPlayerId }: WinnerOverlayProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <AnimatePresence>
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex flex-col items-center gap-3"
        >
          {results.map((result, i) => {
            const winner = players.find(p => p.id === result.winnerId);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.18 }}
                style={{
                  padding: '10px 22px',
                  borderRadius: 12,
                  background: 'rgba(10,16,32,0.92)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  textAlign: 'center',
                  minWidth: 200,
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                  color: '#fff', lineHeight: 1.3,
                }}>
                  {winner?.name || 'Jogador'}
                  <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginLeft: 6 }}>
                    venceu
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'rgba(255,255,255,0.35)', marginTop: 2,
                }}>
                  {result.handName} · +${formatChips(result.amount)}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
