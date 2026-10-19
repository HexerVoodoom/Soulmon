import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PRESENTATION_IDLE, isDayStartActive, pickPresentation, runGuarded, withFailed,
  type PresentationId, type PresentationReady,
} from '../utils/presentationQueue';
import { useBackLayer } from '../utils/backStack';

/**
 * Liga a fila pura (`utils/presentationQueue.ts`) ao React. Um hook, um lugar: o `App.tsx` o chama UMA vez.
 *
 *  · `current` é derivado a cada render de `(ready, quem estava na tela, failed, o que já foi mostrado)`; o "quem estava"
 *    mora num `ref` atualizado no próprio render, para que dois itens prontos no mesmo commit não troquem de lugar
 *    (idempotente em StrictMode: mesma entrada, mesma saída);
 *  · `onShow(id)` roda UMA vez por entrada na tela (é onde cada dono grava o "visto"); se lançar, a fila não trava;
 *  · o voltar do Android/navegador fecha o item da tela (`onDismiss`) e a fila avança;
 *  · `fail(id)` — erro de render, chunk que não carregou, tempo de segurança — pula o item até a próxima abertura
 *    e tenta o `onDismiss` dele (para gravar o "visto" e não voltar), sem deixar nada lançar;
 *  · INÍCIO DE DIA (19/10/2026, REGISTRO §111): o hook acumula o que já foi mostrado NESTA abertura do app (`shown`, um `ref`:
 *    abrir o app de novo zera) para o teto de 3 modais; `holdDayStart` segura o início de dia enquanto o Soulmon dorme à
 *    espera de ser acordado; `dayStartActive` diz ao App quando o priming de push e o `welcome` ocioso devem esperar.
 */
export function usePresentationQueue(p: {
  ready: PresentationReady;
  /** O Soulmon dorme à espera de ser acordado: início de dia, celebrações e convites não entram (`utils/dayWake.ts`). */
  holdDayStart?: boolean;
  /** Chamado uma vez quando `id` entra na tela (marcar "visto" aqui). */
  onShow?: (id: PresentationId) => void;
  /** Fecha o item `id` pelo caminho "voltar/pular" do dono dele. Faltando, o voltar não faz nada por ele. */
  onDismiss?: (id: PresentationId) => void;
}) {
  const [failed, setFailed] = useState<ReadonlySet<PresentationId>>(() => new Set());
  const currentRef = useRef<PresentationId>(PRESENTATION_IDLE);
  const shownRef = useRef<Set<PresentationId>>(new Set());
  const ctx = { shown: shownRef.current, holdDayStart: p.holdDayStart };
  const current = pickPresentation(p.ready, currentRef.current, failed, ctx);
  currentRef.current = current;
  const dayStartActive = isDayStartActive(p.ready, ctx, failed);

  const showRef = useRef(p.onShow);
  showRef.current = p.onShow;
  const dismissRef = useRef(p.onDismiss);
  dismissRef.current = p.onDismiss;

  const lastShown = useRef<PresentationId | null>(null);
  useEffect(() => {
    if (current === PRESENTATION_IDLE) { lastShown.current = null; return; }
    if (lastShown.current === current) return;
    lastShown.current = current;
    shownRef.current.add(current);
    runGuarded(() => showRef.current?.(current));
  }, [current]);

  const dismiss = useCallback((id: PresentationId) => {
    if (!runGuarded(() => dismissRef.current?.(id))) setFailed(f => withFailed(f, id));
  }, []);

  const fail = useCallback((id: PresentationId) => {
    setFailed(f => withFailed(f, id));
    runGuarded(() => dismissRef.current?.(id));
  }, []);

  // Voltar do Android / navegador: fecha o item (camadas mais novas — a folha de lote — vêm antes na pilha).
  useBackLayer(current !== PRESENTATION_IDLE, () => dismiss(current));

  return { current, dismiss, fail, dayStartActive };
}
