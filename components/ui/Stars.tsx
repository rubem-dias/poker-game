'use client';
import { useState, useEffect } from 'react';

interface StarData {
  width: number; height: number;
  left: number; top: number;
  opacity: number; duration: number; delay: number;
}

export function Stars({ count = 55, maxTop = 58 }: { count?: number; maxTop?: number }) {
  const [stars, setStars] = useState<StarData[]>([]);

  useEffect(() => {
    setStars(Array.from({ length: count }, () => ({
      width:    1 + Math.random() * 2,
      height:   1 + Math.random() * 2,
      left:     Math.random() * 100,
      top:      Math.random() * maxTop,
      opacity:  0.06 + Math.random() * 0.3,
      duration: 2 + Math.random() * 5,
      delay:    Math.random() * 4,
    })));
  }, [count, maxTop]);

  return (
    <>
      {stars.map((s, i) => (
        <div key={i} className="fixed rounded-full bg-white" style={{
          position: 'absolute',
          borderRadius: '50%',
          background: '#fff',
          width: s.width,
          height: s.height,
          left: `${s.left}%`,
          top: `${s.top}%`,
          opacity: s.opacity,
          animation: `twinkle ${s.duration}s ease-in-out infinite ${s.delay}s`,
        }} />
      ))}
    </>
  );
}
