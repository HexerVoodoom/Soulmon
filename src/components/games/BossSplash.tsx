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

export function BossSplash({ monster, art, portrait, kicker, title, titleArt, intro, cards, okLabel, tapHint, onDone }: {
  monster: string;
  art: string;
  portrait?: string;
  kicker: string;
  title: string;
  /** Arte do título ("BOSS BATTLE"); sem ela o título é texto claro com contorno (contraste forte sobre a arte do boss). */
  titleArt?: string;
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
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'hidden',
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
      <div style={{ position: usePortrait ? 'absolute' : 'relative', left: 0, right: 0, bottom: 0, flex: 'none', boxSizing: 'border-box', maxHeight: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '24px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
        background: 'linear-gradient(to top, var(--sm2-bg) 62%, transparent)' }}>
        {/* SEM rolagem (dono, 18/11/2026): título pequeno, espaços curtos e cartões compactos para as 3 regras caberem em 375×667. */}
        <div data-boss-splash-body style={{ flex: '0 1 auto', minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {titleArt ? (
          <h2 id="boss-splash-title" data-boss-splash-title-art style={{ margin: 0, lineHeight: 0 }}>
            <img src={titleArt} alt={title} draggable={false} style={{ display: 'block', height: 'clamp(44px, 8vh, 64px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
          </h2>
        ) : (
          <h2 id="boss-splash-title" data-boss-splash-title-text style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-lg)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--sm2-gold-ink)', textShadow: '0 2px 0 var(--sm2-bg), 0 0 6px var(--sm2-bg), 0 0 12px var(--sm2-bg), 1px 1px 0 var(--sm2-bg), -1px -1px 0 var(--sm2-bg)' }}>{title}</h2>
        )}
        <p data-boss-splash-kicker className="sm2-sr-only">{kicker}</p>
        <p data-boss-splash-name style={{ ...sm2Text, margin: 0, textAlign: 'center', fontWeight: 700, textShadow: '0 1px 0 var(--sm2-bg)' }}>{monster}</p>
        {intro && <p data-boss-splash-intro style={{ ...sm2Hint, margin: 0, textAlign: 'center', maxWidth: 420 }}>{intro}</p>}
        {cards && cards.length > 0 && (
          <ol data-m3-boss-rules style={{ margin: 0, padding: 0, listStyle: 'none', width: 'min(100%, 420px)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {cards.map(c => (
              <li key={c.id} data-m3-boss-rule-card={c.id} style={{ ...sm2Text, fontSize: 'var(--sm2-text-xs)', lineHeight: 1.25, padding: '6px 10px', borderRadius: 'var(--sm2-radius-md)', border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)' }}>
                <strong style={{ display: 'block', fontSize: 'var(--sm2-text-sm)' }}>{c.name}</strong>
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
