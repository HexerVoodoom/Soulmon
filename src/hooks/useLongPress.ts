/**
 * TOCAR E SEGURAR (~500 ms) — o gesto secundário das linhas da lista do dia.
 *
 * Regras (pedido do dono, 04/11/2026):
 *  · segurar NÃO dispara o toque curto: depois que o segurar disparou, o
 *    `click` seguinte é engolido na fase de captura;
 *  · segurar NÃO rola a lista por engano: mexer o dedo mais que `MOVE_TOL_PX`
 *    (ou o navegador assumir a rolagem → `pointercancel`) cancela o segurar —
 *    rolar continua sendo rolar;
 *  · acessível: o menu de contexto (botão direito, tecla Menu, Shift+F10 e o
 *    toque longo nativo do Android) dispara a mesma ação.
 */
import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';

export const LONG_PRESS_MS = 500;
export const MOVE_TOL_PX = 10;

export function useLongPress(onLongPress: (() => void) | undefined) {
  const timer = useRef<number | null>(null);
  const origem = useRef<{ x: number; y: number } | null>(null);
  const disparou = useRef(false);

  const limpar = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    origem.current = null;
  }, []);
  useEffect(() => limpar, [limpar]);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    disparou.current = false;
    if (!onLongPress || (e.pointerType === 'mouse' && e.button !== 0)) return;
    origem.current = { x: e.clientX, y: e.clientY };
    timer.current = window.setTimeout(() => {
      timer.current = null;
      disparou.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }, [onLongPress]);

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const o = origem.current;
    if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > MOVE_TOL_PX) limpar();
  }, [limpar]);

  const onClickCapture = useCallback((e: ReactMouseEvent) => {
    if (disparou.current) { e.stopPropagation(); e.preventDefault(); disparou.current = false; }
  }, []);

  const onContextMenu = useCallback((e: ReactMouseEvent) => {
    if (!onLongPress) return;
    e.preventDefault();
    // O toque longo nativo também chega aqui: se o temporizador já disparou, não repete.
    if (disparou.current) return;
    limpar();
    disparou.current = true;
    onLongPress();
  }, [onLongPress, limpar]);

  if (!onLongPress) return {};
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: limpar,
    onPointerCancel: limpar,
    onPointerLeave: limpar,
    onClickCapture,
    onContextMenu,
  };
}
