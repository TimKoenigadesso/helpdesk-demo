import { useEffect, useRef } from 'react';

interface EmojiParticle {
  id: number;
  x: number;
  emoji: string;
  duration: number;
  delay: number;
  size: number;
}

interface Props {
  active: boolean;
  onDone: () => void;
}

const EMOJIS = ['🙂', '😊', '😄', '😁', '🎉', '✨', '🌟'];

function generateParticles(count: number): EmojiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    duration: 1500 + Math.random() * 1000,
    delay: Math.random() * 800,
    size: 16 + Math.floor(Math.random() * 20),
  }));
}

export function EmojiRain({ active, onDone }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particles = useRef<EmojiParticle[]>(generateParticles(30));

  useEffect(() => {
    if (active) {
      // Neue Partikel bei jeder Aktivierung generieren
      particles.current = generateParticles(30);
      // Animation nach max. 3 Sekunden beenden
      timerRef.current = setTimeout(() => {
        onDone();
      }, 3000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, onDone]);

  if (!active) return null;

  return (
    <div
      data-testid="emoji-rain"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {particles.current.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-3rem',
            fontSize: `${p.size}px`,
            animation: `emoji-fall ${p.duration}ms ease-in forwards`,
            animationDelay: `${p.delay}ms`,
            userSelect: 'none',
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
