import { useEffect, useRef, useState } from 'react';
import { PixelIcon } from '../ui/PixelIcon';
import { ModalSheet, sm2Button, sm2Hint } from '../form/FormKit';
import type { Language } from '../../utils/i18n';

/**
 * Modal entre rodadas da Arena (04/11/2026, dono): o MODAL PADRÃO do app (`ModalSheet` centralizado),
 * por cima da própria luta congelada — o cenário da Arena continua visível atrás do véu.
 * A vida aparece como 3 corações (ícone `hp`, cada um = 1/3 do HP) que enchem do "antes" ao "depois".
 */
const HEARTS = 3;
const AUTO_S = 3;

interface Props {
  language: Language;
  /** HP em fração (0..1) antes e depois do fôlego. */
  antes: number;
  depois: number;
  /** HP recuperado em pontos. */
  pontos: number;
  rodada: number;
  totalRodadas: number;
  onNext: () => void;
}

export function ArenaCuraModal({ language, antes, depois, pontos, rodada, totalRodadas, onNext }: Props) {
  const isPt = language === 'pt-BR';
  const [cheio, setCheio] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCheio(true), 300); return () => clearTimeout(t); }, []);
  const hp = cheio ? depois : antes;
  const fill = (k: number) => Math.max(0, Math.min(1, hp * HEARTS - k));
  const label = isPt ? 'Pronto pro combate' : 'Ready to fight';
  /* Segue sozinho em 3 s se ninguém tocar (dono, 04/11/2026). */
  const [resta, setResta] = useState(AUTO_S);
  const nextRef = useRef(onNext);
  nextRef.current = onNext;
  useEffect(() => {
    if (resta <= 0) { nextRef.current(); return; }
    const t = setTimeout(() => setResta(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resta]);
  return (
    <ModalSheet open placement="center" closeSide="none" dismissOnBackdrop={false} language={language} maxWidth={360}
      title={isPt ? `Rodada ${rodada} de ${totalRodadas} vencida` : `Round ${rodada} of ${totalRodadas} cleared`}
      onClose={onNext}
      footer={(
        <button type="button" data-arena-proxima onClick={onNext} aria-label={label} style={{ ...sm2Button('primary'), width: '100%' }}>
          {label} ({resta})
        </button>
      )}>
      <div data-arena-cura-modal style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div role="img" aria-label={isPt ? `Vida em ${Math.round(depois * 100)}%` : `Health at ${Math.round(depois * 100)}%`}
          style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
          {Array.from({ length: HEARTS }, (_, k) => {
            const f = fill(k);
            return (
              <span key={k} data-heart-fill={f.toFixed(2)} style={{ position: 'relative', width: 32, height: 32, lineHeight: 0 }}>
                <PixelIcon name="hp" size={32} style={{ position: 'absolute', inset: 0, filter: 'grayscale(1) brightness(.35)' }} />
                <span style={{ position: 'absolute', inset: 0, clipPath: `inset(${(1 - f) * 100}% 0 0 0)`, transition: `clip-path .8s var(--sm2-ease) ${k * 0.12}s` }}>
                  <PixelIcon name="hp" size={32} />
                </span>
              </span>
            );
          })}
        </div>
        <p className="sm2-num" style={{ ...sm2Hint, margin: 0, textAlign: 'center', fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-ink)' }}>
          {isPt ? `Você recuperou +${pontos} de vida` : `You recovered +${pontos} health`}
        </p>
      </div>
    </ModalSheet>
  );
}
