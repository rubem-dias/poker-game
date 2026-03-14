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

  const isLocalWinner = results.some(r => r.winnerIds.includes(localPlayerId));

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex flex-col items-center gap-3"
        >
          {isLocalWinner && (
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-black text-center"
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #FCD34D, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.8))',
              }}
            >
              🏆 VOCÊ GANHOU!
            </motion.div>
          )}

          {results.map((result, i) => {
            const winner = players.find(p => p.id === result.winnerId);
            return (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className="px-6 py-3 rounded-2xl text-center"
                style={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(245,158,11,0.4)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                }}
              >
                <div className="text-yellow-400 font-black text-lg">
                  {winner?.name || 'Jogador'} venceu!
                </div>
                <div className="text-white/70 text-sm">{result.handName}</div>
                <div className="text-green-400 font-bold text-sm">+{formatChips(result.amount)} chips</div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
