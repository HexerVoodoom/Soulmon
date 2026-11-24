import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';

/** Limiares do gesto (24/11/2026): horizontal predominante (|dx| > |dy| * 1.5) e |dx| > 40 px; senão é rolagem vertical e nada acontece. */
export const SWIPE_MIN_PX = 40;
export const SWIPE_RATIO = 1.5;

/** Puro: `'next'` (arrastou para a ESQUERDA), `'prev'` (para a DIREITA) ou `null` (curto demais ou mais vertical que horizontal). */
export function decideSwipe(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) <= SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy) * SWIPE_RATIO) return null;
  return dx < 0 ? 'next' : 'prev';
}

const INTERATIVO = 'button, a, input, select, textarea, [role="button"], [role="slider"]';

/**
 * Navegar entre itens de uma lista por swipe horizontal (pop-ups de detalhe do Drive). Espalhe o retorno no contêiner do conteúdo
 * (com `touch-action: pan-y`). Gesto que começa em controle interativo é ignorado; nos extremos (`hasPrev`/`hasNext` falsos) nada acontece.
 */
export function useSwipeNav({ onPrev, onNext, hasPrev, hasNext }: { onPrev: () => void; onNext: () => void; hasPrev: boolean; hasNext: boolean }) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    const alvo = e.target as Element | null;
    start.current = alvo?.closest?.(INTERATIVO) ? null : { x: e.clientX, y: e.clientY, id: e.pointerId };
  }, []);
  const onPointerUp = useCallback((e: ReactPointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || s.id !== e.pointerId) return;
    const d = decideSwipe(e.clientX - s.x, e.clientY - s.y);
    if (d === 'next' && hasNext) onNext();
    else if (d === 'prev' && hasPrev) onPrev();
  }, [onNext, onPrev, hasNext, hasPrev]);
  const onPointerCancel = useCallback(() => { start.current = null; }, []);
  return { onPointerDown, onPointerUp, onPointerCancel };
}
