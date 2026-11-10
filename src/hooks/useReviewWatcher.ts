import { useCallback, useEffect, useRef, useState } from 'react';
import {
  checkReviews, isActive, isReviewableSpriteUrl, reviewPollDelay, submitReview,
  type ReviewMotivo, type ReviewReport, type ReviewSnapshot,
} from '../utils/reviewSoulmon';

/**
 * O acompanhamento do "Pedir revisao do meu Soulmon". O estado de cada pedido mora no SERVIDOR (por forma); aqui so se le:
 *  - 1 GET ao abrir o app e ao VOLTAR a ele (foco/visibilidade) — assim fechar o app nao perde o pedido;
 *  - enquanto ha pedido ativo na forma equipada: checagem a cada 2 min nos primeiros 10 min e a cada 10 min ate 24 h
 *    (`reviewPollDelay`), SEM timer com o app em segundo plano e sem pedido ativo nada de timer;
 *  - ao concluir: aplica o sprite novo (so a forma dele), avisa UMA vez (`onFinished`) e o botao volta.
 */
export type ReviewRequestError = 'network' | 'cooldown' | 'limit' | 'server' | 'no-sprite' | null;

export interface UseReviewWatcherArgs {
  snapshot: ReviewSnapshot | undefined;
  onApplyFix: (formId: string, url: string) => void;
  onFinished: (reports: ReviewReport[]) => void;
  /** Injetaveis nos testes. */
  now?: () => number;
}

export interface ReviewWatcher {
  /** O pedido mais recente da forma equipada (ou null). */
  current: ReviewReport | null;
  /** Ativo = botao inativo + "Seu Soulmon esta em revisao". */
  active: boolean;
  /** Ativo e entregue à equipe (e-mail), não à IA. */
  team: boolean;
  sending: boolean;
  error: ReviewRequestError;
  request: (motivo?: ReviewMotivo) => Promise<void>;
}

export function useReviewWatcher({ snapshot, onApplyFix, onFinished, now = Date.now }: UseReviewWatcherArgs): ReviewWatcher {
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ReviewRequestError>(null);
  const ref = useRef({ snapshot, onApplyFix, onFinished, now });
  ref.current = { snapshot, onApplyFix, onFinished, now };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const busy = useRef(false);
  const checkRef = useRef<() => Promise<void>>(async () => {});

  const formId = snapshot?.formId;
  const currentOf = (list: ReviewReport[]) => (formId ? list.find(r => r.formId === formId) ?? null : null);

  const schedule = useCallback((list: ReviewReport[]) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (!alive.current || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return;
    const t = ref.current.now();
    // O proximo passo vem do pedido ativo MAIS NOVO (um por forma; a forma equipada manda, mas qualquer ativo da conta merece o conserto).
    const ativos = list.filter(r => isActive(r, t));
    if (ativos.length === 0) return;
    const age = Math.min(...ativos.map(r => t - r.createdAt));
    const delay = reviewPollDelay(age);
    if (delay == null) return;
    timer.current = setTimeout(() => { void checkRef.current(); }, delay);
  }, []);

  const check = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const r = await checkReviews((f, u) => ref.current.onApplyFix(f, u), fetch, ref.current.now());
      if (!alive.current) return;
      if (r.reports) { setReports(r.reports); schedule(r.reports); }
      if (r.finished.length > 0) ref.current.onFinished(r.finished);
    } finally { busy.current = false; }
  }, [schedule]);
  checkRef.current = check;

  useEffect(() => {
    alive.current = true;
    void check();
    const onVisible = () => {
      if (document.visibilityState === 'hidden') { if (timer.current) { clearTimeout(timer.current); timer.current = null; } return; }
      void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [check]);

  const request = useCallback(async (motivo?: ReviewMotivo) => {
    const snap = ref.current.snapshot;
    if (!snap || sending) return;
    if (!isReviewableSpriteUrl(snap.spriteUrl)) { setError('no-sprite'); return; }
    setSending(true);
    setError(null);
    const r = await submitReview(snap, fetch, motivo);
    setSending(false);
    if (r.ok && r.report) {
      setReports(prev => { const next = [r.report as ReviewReport, ...prev.filter(x => x.id !== r.report?.id)]; schedule(next); return next; });
      return;
    }
    setError(r.status === 0 ? 'network' : r.error === 'review-cooldown' ? 'cooldown' : r.status === 429 ? 'limit' : 'server');
    // Pode ser que ja haja pedido ativo (outro aparelho): relê para a tela dizer a verdade.
    void check();
  }, [check, schedule]);

  const current = currentOf(reports);
  return { current, active: sending || isActive(current, now()), team: current?.status === 'aguardando-equipe' && isActive(current, now()), sending, error, request };
}
