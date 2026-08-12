import { useEffect, useState } from 'react';
import { getSpriteForStage } from '../utils/sprites';

/**
 * Faixa horizontal baixa com o pet andando de um lado pro outro — o
 * movimento lateral que existia na Home saiu de lá (o dono pediu o pet
 * parado ali) e passou a viver só aqui, na tela de Evolução/galhos.
 * Deliberadamente simples: sem cuidado/fala/HUD, só o passeio.
 */
export function WalkingPetStrip({ stageId, demoCharacterId }: { stageId: string; demoCharacterId?: string }) {
  const [position, setPosition] = useState(10);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [squash, setSquash] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(prev => {
        const next = direction === 'right' ? prev + 0.35 : prev - 0.35;
        if (next >= 88) { setDirection('left'); return 88; }
        if (next <= 12) { setDirection('right'); return 12; }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [direction]);

  useEffect(() => {
    const squashInterval = setInterval(() => setSquash(s => (s + 1) % 2), 1200);
    return () => clearInterval(squashInterval);
  }, []);

  const sprite = getSpriteForStage(stageId, demoCharacterId);

  return (
    <div
      className="sm-card"
      style={{
        position: 'relative',
        height: 84,
        overflow: 'hidden',
        marginBottom: 16,
        background: 'radial-gradient(ellipse 70% 100% at 50% 100%, color-mix(in srgb, var(--sm-primary) 14%, transparent), transparent)',
      }}
      aria-hidden="true"
    >
      <img
        src={sprite}
        alt=""
        style={{
          position: 'absolute',
          left: `${position}%`,
          bottom: 6,
          width: 56, height: 56,
          objectFit: 'contain',
          imageRendering: 'pixelated',
          transform: `translateX(-50%) scaleX(${direction === 'left' ? -1 : 1}) scaleY(${squash === 0 ? 1 : 0.96})`,
          transformOrigin: 'bottom',
          transition: 'left 0.1s linear, transform 0.3s ease',
        }}
      />
    </div>
  );
}
