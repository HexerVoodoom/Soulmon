/**
 * O BAÚ DA SESSÃO (§300, 12/11/2026, pedido do dono): no canto inferior ESQUERDO da jornada, alinhado às chaves. Cada item achado
 * sai do baú do mapa e ENTRA neste (animação; com prefers-reduced-motion só o contador muda). Tocar abre um tooltip com o que já
 * foi coletado na sessão (ícone, nome, quantidade); tocar FORA (ou Voltar) fecha. Ícone de material em imagem quando o slot existe.
 */
import { forwardRef, useEffect, useRef, useState } from 'react';
import { sm2Hint, sm2Text } from '../form/FormKit';
import { useBackLayer } from '../../utils/backStack';
import type { Language } from '../../utils/i18n';
import type { JourneyItem } from '../../utils/focusJourney';
import { journeyItemInfo, totalQty } from '../../utils/journeyItemInfo';
import { CHEST_ART } from './journeyArt';

export const BAG_SIZE = 44;

export function ItemIcon({ item, isPt, size }: { item: JourneyItem; isPt: boolean; size: number }) {
  const info = journeyItemInfo(item, isPt);
  return info.src
    ? <img src={info.src} alt="" data-item-icon="img" width={size} height={size} style={{ display: 'block', objectFit: 'contain' }} />
    : <span aria-hidden="true" data-item-icon="glyph" style={{ fontSize: `${Math.round(size * 0.8)}px`, lineHeight: 1, width: size, height: size, display: 'grid', placeItems: 'center' }}>{info.glyph}</span>;
}

export const FocusBag = forwardRef<HTMLButtonElement, { language: Language; items: readonly JourneyItem[]; /** Quantidade ainda em voo (não entrou no contador). */ pending?: number }>(
  function FocusBag({ language, items, pending = 0 }, ref) {
    const isPt = language === 'pt-BR';
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLSpanElement>(null);
    useBackLayer(open, () => setOpen(false));
    useEffect(() => {
      if (!open) return;
      const away = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
      document.addEventListener('pointerdown', away, true);
      return () => document.removeEventListener('pointerdown', away, true);
    }, [open]);
    const count = Math.max(0, totalQty(items) - pending);
    const label = isPt ? `Baú da sessão: ${count} ${count === 1 ? 'item' : 'itens'}` : `Session chest: ${count} ${count === 1 ? 'item' : 'items'}`;
    return (
      <span ref={box} data-journey-bag-box style={{ position: 'absolute', zIndex: 3, left: 16, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', width: BAG_SIZE, height: BAG_SIZE }}>
        {open && <div role="dialog" aria-label={isPt ? 'Itens coletados na sessão' : 'Items collected this session'} data-journey-bag-tip
          style={{ position: 'absolute', left: 0, bottom: BAG_SIZE + 8, width: 'min(260px, calc(100vw - 32px))', maxHeight: '40dvh', overflowY: 'auto', padding: '10px 12px', borderRadius: 12, background: 'color-mix(in srgb, var(--sm2-surface) 94%, transparent)', color: 'var(--sm2-ink)', boxShadow: '0 6px 18px rgba(0,0,0,.4)' }}>
          {items.length === 0
            ? <p data-journey-bag-empty style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Nada coletado ainda.' : 'Nothing collected yet.'}</p>
            : <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              {items.map(it => {
                const info = journeyItemInfo(it, isPt);
                return <li key={`${it.kind}:${it.id}`} data-journey-bag-item={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ItemIcon item={it} isPt={isPt} size={28} />
                  <span style={{ ...sm2Text, flex: 1 }}>{info.name}</span>
                  <span className="sm2-num" style={sm2Text}>×{it.qty}</span>
                </li>;
              })}
            </ul>}
        </div>}
        <button ref={ref} type="button" data-journey-bag aria-expanded={open} aria-haspopup="dialog" aria-label={label} onClick={() => setOpen(v => !v)}
          style={{ position: 'relative', width: BAG_SIZE, height: BAG_SIZE, padding: 0, border: 'none', borderRadius: 12, background: 'rgba(4,16,18,.6)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          {CHEST_ART.common ? <img src={CHEST_ART.common} alt="" width={34} height={34} style={{ display: 'block', imageRendering: 'pixelated' }} /> : <span aria-hidden="true" style={{ fontSize: 'var(--sm2-text-2xl)' }}>🧰</span>}
          <span data-journey-bag-count className="sm2-num" aria-hidden="true" style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9, background: 'var(--sm2-ink)', color: 'var(--sm2-surface)', fontSize: 'var(--sm2-text-xs)', fontWeight: 700, display: 'grid', placeItems: 'center' }}>{count}</span>
        </button>
      </span>
    );
  });

/** Um item voando do baú do mapa até o baú da sessão. Sem Web Animations (ou com movimento reduzido), chega na hora. */
export function FlyingItem({ item, isPt, from, to, onDone }: { item: JourneyItem; isPt: boolean; from: { x: number; y: number }; to: { x: number; y: number }; onDone: () => void }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = el.current;
    const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
    if (!node || reduce || typeof node.animate !== 'function') { onDone(); return; }
    const dx = to.x - from.x; const dy = to.y - from.y;
    const anim = node.animate([
      { transform: 'translate(0,0) scale(.5)', opacity: 0 },
      { transform: 'translate(0,-22px) scale(1.15)', opacity: 1, offset: 0.3 },
      { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0.9 },
    ], { duration: 900, easing: 'ease-in-out', fill: 'forwards' });
    let done = false;
    const fin = () => { if (!done) { done = true; onDone(); } };
    anim.onfinish = fin; anim.oncancel = fin;
    return () => { anim.cancel(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={el} data-journey-flying={item.id} aria-hidden="true" style={{ position: 'fixed', zIndex: 4, left: from.x - 16, top: from.y - 16, width: 32, height: 32, pointerEvents: 'none', display: 'grid', placeItems: 'center' }}><ItemIcon item={item} isPt={isPt} size={32} /></span>;
}
