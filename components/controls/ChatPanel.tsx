'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../stores/gameStore';

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const messages = useGameStore(s => s.chatMessages);
  const roomId = useGameStore(s => s.roomId);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!text.trim() || !roomId) return;
    getSocket().emit('chat-message', { text: text.trim() });
    setText('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-72 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              height: 320,
            }}
          >
            <div className="px-4 py-3 font-bold text-white text-sm border-b border-white/10">
              💬 Table Chat
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {messages.length === 0 && (
                <p className="text-white/30 text-xs text-center mt-4">No messages yet...</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-yellow-400 text-xs font-semibold">{msg.playerName}</span>
                  <span className="text-white/80 text-sm">{msg.text}</span>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder:text-white/30 border border-white/10 focus:border-white/30"
              />
              <button
                onClick={send}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
              >
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-all hover:scale-110"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
            : 'linear-gradient(135deg, #374151, #1F2937)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
