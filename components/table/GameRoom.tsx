'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useSocket, usePlayerActions, getSocket } from '../../hooks/useSocket';
import { PokerTable } from './PokerTable';
import { ActionBar } from '../controls/ActionBar';
import { ChatPanel } from '../controls/ChatPanel';
import { WinnerOverlay } from '../ui/WinnerOverlay';
import { Stars } from '../ui/Stars';
import { LeaveConfirmModal } from '../ui/LeaveConfirmModal';
import { SittingOutBanner } from '../ui/SittingOutBanner';
import { formatChips } from '../../lib/cardUtils';
import confetti from 'canvas-confetti';

const AVATARS = ['🦊','🐺','🦁','🐯','🐻','🦅','🦈','🐉'];

export function GameRoom() {
  useSocket();
  const store = useGameStore();
  const actions = usePlayerActions();
  const {
    gameState, localPlayerId, isHost, roomCode,
    turnInfo, isActionPending, showLeaveConfirm, joiningMidGame,
  } = store;
  const prevWinKey = useRef<string | null>(null);

  /* ── Confetti on win ── */
  useEffect(() => {
    if (!gameState?.handResults || !localPlayerId) return;
    const key = gameState.handResults.map(r => r.winnerId).join(',');
    if (key === prevWinKey.current) return;
    const isWinner = gameState.handResults.some(r => r.winnerIds.includes(localPlayerId));
    if (isWinner) {
      prevWinKey.current = key;
      const burst = () => confetti({
        particleCount: 90, spread: 75,
        origin: { y: 0.65 },
        colors: ['#fbbf24','#fcd34d','#fff','#4ade80','#60a5fa'],
      });
      burst(); setTimeout(burst, 350); setTimeout(burst, 700);
    }
  }, [gameState?.handResults, localPlayerId]);

  /* ── Leave handler ── */
  const handleLeaveConfirmed = () => {
    store.setShowLeaveConfirm(false);
    getSocket().emit('leave-room');
    store.reset();
  };

  if (!gameState || !localPlayerId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0d1a' }}>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)', fontSize: 14 }} className="animate-pulse">
          Conectando...
        </div>
      </div>
    );
  }

  const localPlayer   = gameState.players.find(p => p.id === localPlayerId);
  const isMyTurn      = gameState.activePlayerId === localPlayerId;
  const isInGame      = gameState.phase !== 'waiting';
  const showActionBar = isMyTurn && turnInfo && !isActionPending
    && gameState.phase !== 'showdown' && gameState.phase !== 'waiting'
    && !joiningMidGame;

  /* sitting-out = joined mid-game, hasn't been dealt in yet */
  const isSittingOut = joiningMidGame && localPlayer?.status === 'sitting-out';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: 'transparent' }}>

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0" style={{
        background: 'linear-gradient(180deg, #0d0221 0%, #1a0533 20%, #0d1b4a 55%, #071428 100%)',
      }} />
      <div className="fixed bottom-0 left-0 right-0 h-56 z-0 pointer-events-none" style={{
        background: 'linear-gradient(0deg, rgba(109,40,217,0.22) 0%, transparent 100%)',
      }} />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Stars count={55} maxTop={58} />
      </div>

      {/* ── Floating leave button ── */}
      <button
        onClick={() => store.setShowLeaveConfirm(true)}
        style={{
          position: 'fixed', top: 14, right: 16, zIndex: 40,
          padding: '5px 14px', borderRadius: 99,
          background: 'rgba(0,0,0,0.30)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
          color: 'rgba(255,255,255,0.30)',
          fontFamily: 'var(--font-body)',
          fontSize: 12, fontWeight: 500,
          cursor: 'pointer', letterSpacing: '0.04em',
        }}
      >
        Sair
      </button>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col items-center relative z-10" style={{ padding: '8px', gap: 8, minHeight: 0, paddingBottom: 100 }}>

        {/* Waiting lobby */}
        {gameState.phase === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: 520 }}
          >
            <div style={{
              borderRadius: 20, padding: '18px 20px',
              background: 'rgba(8,13,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(24px)',
            }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.18em', color: 'rgba(255,255,255,0.36)',
                textTransform: 'uppercase', textAlign: 'center', marginBottom: 14,
              }}>
                Sala de espera · {gameState.players.length} / {store.gameState?.players.length} jogadores
              </div>

              {/* Players in lobby */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {gameState.players.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 12,
                    background: p.id === localPlayerId ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${p.id === localPlayerId ? 'rgba(99,102,241,0.38)' : 'rgba(255,255,255,0.08)'}`,
                    fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
                    color: p.id.startsWith('__bot__') ? '#a78bfa' : p.id === localPlayerId ? '#a5b4fc' : 'rgba(255,255,255,0.85)',
                  }}>
                    {AVATARS[p.avatar % 8]} {p.name}
                    {p.id.startsWith('__bot__') && ' 🤖'}
                    {p.id === localPlayerId && ' ★'}
                    {isHost && p.id.startsWith('__bot__') && (
                      <button
                        onClick={() => getSocket().emit('remove-bot', { botId: p.id })}
                        style={{ marginLeft: 4, color: 'rgba(239,68,68,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Host controls */}
              {isHost ? (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {gameState.players.length < 9 && (
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => getSocket().emit('add-bot')}
                      style={{
                        padding: '9px 16px', borderRadius: 12,
                        background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)',
                        color: '#a78bfa', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      🤖 Adicionar Bot
                    </motion.button>
                  )}
                  {gameState.players.length >= 2 && (
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => getSocket().emit('start-game')}
                      style={{
                        padding: '9px 22px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        border: 'none', color: '#000',
                        fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                        letterSpacing: '0.03em', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(245,158,11,0.42)',
                      }}
                    >
                      🎲 Iniciar Jogo
                    </motion.button>
                  )}
                </div>
              ) : (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.28)', textAlign: 'center' }}>
                  Aguardando o host iniciar...
                </p>
              )}
              {isHost && gameState.players.length < 2 && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 8 }}>
                  Adicione um bot ou convide amigos com o código acima 👆
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Sitting-out banner (joined mid-game) */}
        {isSittingOut && gameState.phase !== 'waiting' && (
          <div style={{ width: '100%', maxWidth: 520, paddingTop: 4 }}>
            <SittingOutBanner phase={gameState.phase} />
          </div>
        )}

        {/* Poker table */}
        <div style={{ width: '100%', maxWidth: '58rem', flex: 1, display: 'flex', alignItems: 'center' }}>
          <PokerTable
            gameState={gameState}
            localPlayerId={localPlayerId}
            turnStartedAt={turnInfo?.turnStartedAt}
            turnTimeoutSeconds={turnInfo?.timeoutSeconds}
          />
        </div>

      </div>

      {/* Fixed action bar — never affects table layout */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        display: 'flex', justifyContent: 'center',
        padding: '0 14px 18px',
        pointerEvents: 'none',
      }}>
        <div style={{ width: '100%', maxWidth: 540, pointerEvents: 'auto' }}>
          <AnimatePresence>
            {showActionBar && (
              <ActionBar
                key="ab"
                turnInfo={turnInfo!}
                onFold={actions.fold}
                onCheck={actions.check}
                onCall={actions.call}
                onRaise={actions.raise}
                disabled={isActionPending}
                playerChips={localPlayer?.chips}
                pot={gameState.pot}
              />
            )}
          </AnimatePresence>
          {isMyTurn && !turnInfo && !isActionPending
            && gameState.phase !== 'showdown' && gameState.phase !== 'waiting'
            && !joiningMidGame && (
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                letterSpacing: '0.18em', color: 'rgba(251,191,36,0.7)',
                textAlign: 'center', padding: '10px 0',
              }}
            >
              SUA VEZ
            </motion.div>
          )}
        </div>
      </div>

      {/* Winner overlay */}
      {gameState.phase === 'showdown' && gameState.handResults && (
        <WinnerOverlay results={gameState.handResults} players={gameState.players} localPlayerId={localPlayerId} />
      )}

      {/* Error toast */}
      <AnimatePresence>
        {store.error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
              padding: '10px 22px', borderRadius: 16,
              background: 'rgba(239,68,68,0.92)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#fff',
              whiteSpace: 'nowrap', zIndex: 60,
            }}
          >
            ⚠️ {store.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave confirmation modal */}
      <LeaveConfirmModal
        isOpen={showLeaveConfirm}
        onConfirm={handleLeaveConfirmed}
        onCancel={() => store.setShowLeaveConfirm(false)}
        isInGame={isInGame}
      />

      <ChatPanel />
    </div>
  );
}
