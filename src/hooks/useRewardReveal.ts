/**
 * `useRewardReveal` — EXECUTA o cronograma de `utils/rewardReveal.ts`: quem já estourou (`isShown`), quem pousou (`isLanded`),
 * quando tocar cada som, e o "toque para pular". É o ÚNICO chamador de `playRewardPop`/`playCoinRoll`/`playCoinLand`.
 *
 *  · Movimento reduzido / `instant`: nada é agendado; tudo nasce no estado final e MUDO (nada acontece, nada soa).
 *  · Som: pedido do dono (28/10/2026); a D11 mora AQUI — só soa com a aba visível e o áudio JÁ liberado por um gesto da sessão
 *    (a tela de resultado vem depois de gestos do jogo, então na prática soa; aberta fria, nasce muda).
 *  · O valor final nunca depende desta animação: o chamador sempre renderiza o número/estado final no DOM.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { rewardTimeline, type RevealStep } from '../utils/rewardReveal';
import { barramentoAtual } from '../utils/audioBus';
import { playRewardPop, playCoinRoll, playCoinLand } from '../utils/sounds';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** D11: aba visível + áudio já liberado por um gesto. */
export function sonoLiberado(): boolean {
  try {
    if (typeof document !== 'undefined' && document.hidden) return false;
    return barramentoAtual()?.ctx.state === 'running';
  } catch { return false; }
}

export interface RewardReveal {
  /** O passo `key` já estourou (ou o cronograma não o conhece / terminou / foi pulado). */
  isShown: (key: string) => boolean;
  /** O contador da linha `key` já pousou. */
  isLanded: (key: string) => boolean;
  /** O contador da linha `key` já pode girar. */
  isRolling: (key: string) => boolean;
  /** Pula para o estado final (sem som). */
  skip: () => void;
  /** Ainda há animação em curso. */
  animated: boolean;
}

export function useRewardReveal(steps: readonly RevealStep[], opts: { active: boolean; instant?: boolean; sound?: boolean }): RewardReveal {
  const [still] = useState(() => !!opts.instant || prefersReducedMotion());
  const sig = steps.map(s => `${s.key}${s.roll ? '~' : ''}${s.silent ? '_' : ''}${s.after ?? ''}`).join('|');
  const timeline = useMemo(() => rewardTimeline(steps), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const [shown, setShown] = useState<Record<string, true>>({});
  const [rolling, setRolling] = useState<Record<string, true>>({});
  const [landed, setLanded] = useState<Record<string, true>>({});
  const [over, setOver] = useState(still);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const started = useRef(false);
  const soundOn = opts.sound !== false;

  useEffect(() => {
    if (still || !opts.active || started.current) return undefined;
    started.current = true;
    const som = (fn: () => void) => { if (soundOn && sonoLiberado()) { try { fn(); } catch { /* som é enfeite */ } } };
    timers.current = timeline.events.map(ev => setTimeout(() => {
      if (ev.type === 'pop') { setShown(s => ({ ...s, [ev.key]: true })); if (!ev.silent) som(() => playRewardPop(ev.pitch)); }
      else if (ev.type === 'roll') setRolling(s => ({ ...s, [ev.key]: true }));
      else if (ev.type === 'tick') som(() => playCoinRoll());
      else { setLanded(s => ({ ...s, [ev.key]: true })); som(() => playCoinLand()); }
    }, ev.at));
    timers.current.push(setTimeout(() => setOver(true), timeline.totalMs));
    return () => { timers.current.forEach(clearTimeout); timers.current = []; started.current = false; };
    // O cronograma nasce uma vez por ativação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.active, still]);

  const skip = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setOver(true);
  }, []);

  const final = still || over;
  return {
    isShown: key => final || !(key in timeline.popAt) || !!shown[key],
    isLanded: key => final || !!landed[key],
    isRolling: key => !final && !!rolling[key],
    skip,
    animated: !final,
  };
}
