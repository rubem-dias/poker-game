'use client';
import { useState } from 'react';
import { Stars } from '../ui/Stars';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../stores/gameStore';

const AVATARS = ['🦊', '🐺', '🦁', '🐯', '🐻', '🦅', '🦈', '🐉'];

type Tab = 'create' | 'join';

export function LobbyPage() {
  const [tab, setTab] = useState<Tab>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [avatar, setAvatar] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [bigBlind, setBigBlind] = useState(20);
  const [loading, setLoading] = useState(false);
  const error = useGameStore(s => s.error);

  const handleCreate = () => {
    if (!playerName.trim()) return;
    setLoading(true);
    getSocket().emit('create-room', {
      playerName: playerName.trim(),
      maxPlayers,
      smallBlind: bigBlind / 2,
      bigBlind,
      avatar,
    });
    setTimeout(() => setLoading(false), 4000);
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    setLoading(true);
    getSocket().emit('join-room', {
      code: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      avatar,
    });
    setTimeout(() => setLoading(false), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0" style={{
        background: 'linear-gradient(180deg, #0d0221 0%, #1a0533 25%, #0d1b4a 60%, #071428 100%)',
      }} />

      {/* City skyline glow */}
      <div className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none" style={{
        background: 'linear-gradient(0deg, rgba(99,52,186,0.3) 0%, transparent 100%)',
      }} />

      {/* Floating suit symbols */}
      {['♠', '♥', '♦', '♣'].map((s, i) => (
        <motion.div
          key={s}
          className="fixed text-9xl font-black pointer-events-none select-none"
          style={{
            color: i < 2 ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.04)',
            left: [`8%`, `78%`, `15%`, `72%`][i],
            top: [`8%`, `12%`, `65%`, `60%`][i],
          }}
          animate={{ y: [0, -12, 0], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 7 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {s}
        </motion.div>
      ))}

      {/* Stars */}
      <Stars count={40} maxTop={70} />

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-sm z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: '0.04em',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #fcd34d 60%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.5))',
            }}>
              🃏 POKER
            </h1>
          </motion.div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.42em',
            color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase',
            marginTop: 6,
          }}>com amigos</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl overflow-hidden" style={{
          background: 'rgba(8,15,35,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
        }}>
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {(['create', 'join'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-4 transition-all relative"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: tab === t ? '#fbbf24' : 'rgba(255,255,255,0.35)',
                }}
              >
                {t === 'create' ? '🏠 Criar Mesa' : '🚪 Entrar'}
                {tab === t && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)' }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Avatar */}
            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Avatar</label>
              <div className="grid grid-cols-8 gap-1.5">
                {AVATARS.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => setAvatar(i)}
                    className="aspect-square rounded-xl text-xl flex items-center justify-center transition-all"
                    style={{
                      background: avatar === i ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)',
                      border: avatar === i ? '1.5px solid rgba(250,204,21,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                      transform: avatar === i ? 'scale(1.12)' : 'scale(1)',
                      boxShadow: avatar === i ? '0 0 12px rgba(250,204,21,0.3)' : 'none',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Nome</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Seu apelido..."
                maxLength={20}
                className="w-full rounded-xl outline-none transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  padding: '11px 16px',
                  caretColor: '#fbbf24',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(250,204,21,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
              />
            </div>

            <AnimatePresence mode="wait">
              {tab === 'create' ? (
                <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                  {/* Settings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2 block">Jogadores</label>
                      <select
                        value={maxPlayers}
                        onChange={e => setMaxPlayers(Number(e.target.value))}
                        className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {[2,3,4,5,6,7,8,9].map(n => <option key={n} value={n} className="bg-slate-900">{n} jogadores</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2 block">Big Blind</label>
                      <select
                        value={bigBlind}
                        onChange={e => setBigBlind(Number(e.target.value))}
                        className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {[10,20,50,100,200,500].map(n => <option key={n} value={n} className="bg-slate-900">${n}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={!playerName.trim() || loading}
                    className="w-full py-4 rounded-2xl font-black text-black text-sm tracking-widest uppercase transition-all disabled:opacity-40"
                    style={{
                      background: loading ? 'rgba(245,158,11,0.6)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      boxShadow: '0 4px 24px rgba(245,158,11,0.4)',
                    }}
                  >
                    {loading ? '⏳ Criando...' : '🎲 Criar Mesa'}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="j" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                  <div>
                    <label className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2 block">Código da Mesa</label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={e => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      maxLength={6}
                      className="w-full rounded-xl px-4 py-4 text-white text-2xl font-black tracking-[0.5em] text-center outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    />
                  </div>
                  <button
                    onClick={handleJoin}
                    disabled={!playerName.trim() || !roomCode.trim() || loading}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm tracking-widest uppercase transition-all disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      boxShadow: '0 4px 24px rgba(16,185,129,0.4)',
                    }}
                  >
                    {loading ? '⏳ Entrando...' : '🚪 Entrar na Mesa'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-xl text-red-400 text-sm text-center"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-white/15 text-xs mt-5">Cada jogador começa com $1.000</p>
      </motion.div>
    </div>
  );
}
