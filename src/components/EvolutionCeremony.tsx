import { useEffect, useRef, useState } from 'react';
import { getSpriteForStage } from '../utils/sprites';

// ---------------------------------------------------------------------------
// EvolutionCeremony — tela dedicada da evolução manual.
// Efeito: os sprites da forma ATUAL e da PRÓXIMA intercalam em velocidade
// progressiva (cada vez mais rápido) por ~3s, 100% BRANCOS, até estabilizar
// na forma evoluída — aí a cor volta e o processo conclui.
// Fundo: "vídeo" cósmico animado em CSS (placeholder até termos vídeo real).
// ---------------------------------------------------------------------------

interface EvolutionCeremonyProps {
  fromStage: string;
  toStage: string;
  toName: string;
  language: 'pt-BR' | 'en-US' | string;
  /** Modo demo (utils/monetization.ts): personagem pré-pronto — sobrepõe os sprites. */
  demoCharacterId?: string;
  /** Chamado quando a animação termina (commit da evolução no estado). */
  onEvolved: () => void;
  /** Fecha a tela (depois do resultado). */
  onClose: () => void;
}

const TOTAL_MS = 3000;

// Agenda de alternância: intervalos progressivamente menores somando ~3s.
function buildSchedule(): number[] {
  const steps: number[] = [];
  let t = 0;
  let interval = 420;
  while (t + interval < TOTAL_MS) {
    steps.push(t + interval);
    t += interval;
    interval = Math.max(55, interval * 0.82); // acelera
  }
  return steps;
}

export function EvolutionCeremony({ fromStage, toStage, toName, language, demoCharacterId, onEvolved, onClose }: EvolutionCeremonyProps) {
  const isPt = language === 'pt-BR';
  const [showNext, setShowNext] = useState(false);
  const [done, setDone] = useState(false);
  const evolvedRef = useRef(false);

  const fromSprite = getSpriteForStage(fromStage, 'tapirmon', demoCharacterId);
  const toSprite = getSpriteForStage(toStage, 'tapirmon', demoCharacterId);

  useEffect(() => {
    const timers: number[] = [];
    buildSchedule().forEach((at, i) => {
      timers.push(window.setTimeout(() => setShowNext(i % 2 === 0), at));
    });
    timers.push(window.setTimeout(() => {
      setShowNext(true);
      setDone(true);
      if (!evolvedRef.current) {
        evolvedRef.current = true;
        onEvolved();
      }
    }, TOTAL_MS));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Fundo cósmico animado (placeholder de vídeo) */}
      <div className="evo-bg" style={{ position: 'absolute', inset: 0 }} />

      {/* Sprite: branco durante a intercalação, cor ao concluir */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <img
          src={showNext ? toSprite : fromSprite}
          alt=""
          style={{
            width: 160, height: 160, objectFit: 'contain', imageRendering: 'pixelated',
            filter: done ? 'drop-shadow(0 0 24px rgba(255,255,255,0.8))' : 'brightness(0) invert(1)',
            transition: done ? 'filter .6s ease' : 'none',
            animation: done ? 'evo-pop .5s ease' : undefined,
          }}
        />
        {done && (
          <div style={{ marginTop: 24, animation: 'evo-fade-in .6s ease both' }}>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, letterSpacing: 3, fontWeight: 700, margin: 0 }}>
              {isPt ? 'EVOLUIU PARA' : 'EVOLVED INTO'}
            </p>
            <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: '6px 0 26px', letterSpacing: -0.5 }}>
              {toName}
            </h1>
            <button className="sm-btn sm-btn-gold" style={{ minWidth: 200 }} onClick={onClose}>
              {isPt ? 'Continuar' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
