import { useEffect, useRef, useState } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { prefersReducedMotion } from '../../utils/combatFx';

/**
 * SPLASH DO BOSS dos minigames (04/11/2026, dono): CARTÃO DE TELA CHEIA com a arte grande + (opcional) cartões das regras.
 * Um componente só, nos tokens `--sm2-*`: o Elemental Fusion passa os cartões das 3 regras; o boss especial da Chuva de Almas
 * não passa cartões. A arte é um SLOT: `portrait` (9:16, `assets/soulmon/boss/<id>.webp`) cobre a tela; sem ele (ou se falhar
 * ao carregar) cai no `art` (sprite) grande e centralizado. Toque em qualquer lugar (ou no botão) pula. Sem movimento com
 * `prefers-reduced-motion`.
 */
export interface BossSplashCard { id: string; name: string; line: string }

export function BossSplash({ monster, art, portrait, kicker, title, intro, cards, okLabel, tapHint, onDone }: {
  monster: string;
  art: string;
  portrait?: string;
  kicker: string;
  title: string;
  intro?: string;
  cards?: readonly BossSplashCard[];
  okLabel: string;
  tapHint: string;
  onDone: () => void;
}) {
  const [portraitOk, setPortraitOk] = useState(!!portrait);
  const imgRef = useRef<HTMLImageElement>(null);
  const usePortrait = !!portrait && portraitOk;
  useEffect(() => {
    const el = imgRef.current;
    if (!el || prefersReducedMotion() || typeof el.animate !== 'function') return;
    const a = el.animate([{ transform: 'scale(1.06)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: 'ease-out', fill: 'both' });
    return () => a.cancel();
  }, [usePortrait]);
  return (
    <div
      data-boss-splash
      data-boss-splash-art-kind={usePortrait ? 'portrait' : 'sprite'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="boss-splash-title"
      onClick={onDone}
      style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--sm2-surface) 85%, var(--sm2-danger-ink)) 0%, var(--sm2-bg) 70%)' }}
    >
      {usePortrait ? (
        <img ref={imgRef} data-boss-splash-art={monster} src={portrait} alt="" aria-hidden="true" draggable={false} onError={() => setPortraitOk(false)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
      ) : art ? (
        <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px 0' }}>
          <img ref={imgRef} data-boss-splash-art={monster} src={art} alt="" aria-hidden="true" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
        </div>
      ) : null}
      <div style={{ position: usePortrait ? 'absolute' : 'relative', left: 0, right: 0, bottom: 0, flex: 'none', boxSizing: 'border-box', maxHeight: '62%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
        background: 'linear-gradient(to top, var(--sm2-bg) 62%, transparent)' }}>
        {/* Regras longas rolam aqui; o botão e a dica ficam SEMPRE à vista (QA 04/11/2026: em 360×740 o OK caía fora da tela). */}
        <div data-boss-splash-body style={{ flex: '0 1 auto', minHeight: 0, width: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <p data-boss-splash-kicker style={{ ...sm2Hint, margin: 0, color: 'var(--sm2-danger-ink)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>{kicker}</p>
        <h2 id="boss-splash-title" style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-xl)', color: 'var(--sm2-danger-ink)' }}>{title}</h2>
        <p data-boss-splash-name style={{ ...sm2Text, margin: 0, textAlign: 'center', fontWeight: 700 }}>{monster}</p>
        {intro && <p style={{ ...sm2Hint, margin: 0, textAlign: 'center', maxWidth: 420 }}>{intro}</p>}
        {cards && cards.length > 0 && (
          <ol data-m3-boss-rules style={{ margin: 0, padding: 0, listStyle: 'none', width: 'min(100%, 420px)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cards.map(c => (
              <li key={c.id} data-m3-boss-rule-card={c.id} style={{ ...sm2Text, fontSize: 'var(--sm2-text-sm)', padding: 10, borderRadius: 'var(--sm2-radius-md)', border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)' }}>
                <strong style={{ display: 'block', fontSize: 'var(--sm2-text-md)' }}>{c.name}</strong>
                <span>{c.line}</span>
              </li>
            ))}
          </ol>
        )}
        </div>
        <button type="button" data-m3-boss-ok data-boss-splash-ok onClick={e => { e.stopPropagation(); onDone(); }} style={{ ...sm2Button('primary'), minWidth: 140 }}>{okLabel}</button>
        <p style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>{tapHint}</p>
      </div>
    </div>
  );
}
