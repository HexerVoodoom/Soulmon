import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Language } from '../../utils/i18n';

/**
 * `LoadingBar` — O indicador de carregamento do app (decisão do dono, 14/10/2026, REGISTRO §50).
 *
 * UMA barra fina turquesa que vai sendo preenchida da esquerda para a direita. Sem texto, sem
 * spinner, sem ilustração. É o único componente de "carregando": a splash do `index.html` usa o
 * MESMO visual (`.sm2-loadbar` em `index.css`, markup estático porque pinta antes do bundle) e o
 * `ScreenSkeleton` (fallback de `lazy()`) a desenha por dentro.
 *
 * · `progress` (0–1) = determinado: o preenchimento segue o valor real (chunks, etapas de boot).
 * · sem `progress` = simulado e assintótico: sobe rápido, desacelera e NUNCA passa de 94% sozinho.
 * · `done` completa a 100% e some num fade curto; depois chama `onExited` e não desenha mais nada.
 * · `prefers-reduced-motion`: o preenchimento anda em PASSOS (sem transição) e sem brilho.
 * · altura fixa (3px) dentro de uma caixa de altura fixa: nada salta quando a barra entra ou sai.
 * · cor = `--sm2-primary-fill` (turquesa do tema); na splash, `--sm2-primary-ink` do visor.
 */

export interface LoadingBarProps {
  /** Progresso real 0–1. Ausente = simulado (assintótico). */
  progress?: number;
  /** Terminou: completa, faz fade e some. */
  done?: boolean;
  /** Chamado depois do fade, quando a barra já saiu. */
  onExited?: () => void;
  language?: Language;
  /** Rótulo só para leitor de tela (padrão: Carregando/Loading). */
  label?: string;
  style?: CSSProperties;
}

/** O teto do simulado: nunca chega a 100% antes de terminar. */
export const SIMULATED_CEILING = 0.94;
const TICK_MS = 120;
const FADE_MS = 220;

/** Um passo do simulado: fecha 9% da distância até o teto (sobe rápido, desacelera). */
export function simulatedStep(v: number): number {
  return v + (SIMULATED_CEILING - v) * 0.09;
}

/** Reduced-motion: passos de 20%, parando em 80% enquanto não termina. */
export function steppedStep(v: number): number {
  return Math.min(0.8, Math.round((v + 0.2) * 5) / 5);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function LoadingBar({ progress, done = false, onExited, language = 'en-US', label: rotulo, style }: LoadingBarProps) {
  const reduced = usePrefersReducedMotion();
  const determinate = typeof progress === 'number';
  const [sim, setSim] = useState(0.08);
  const [gone, setGone] = useState(false);
  const exited = useRef(onExited);
  exited.current = onExited;

  // Simulado: só roda quando não há progresso real e ainda não terminou.
  useEffect(() => {
    if (determinate || done) return;
    const id = window.setInterval(() => setSim(v => (reduced ? steppedStep(v) : simulatedStep(v))), reduced ? 500 : TICK_MS);
    return () => window.clearInterval(id);
  }, [determinate, done, reduced]);

  // Terminou: fade curto e sai.
  useEffect(() => {
    if (!done) { setGone(false); return; }
    const id = window.setTimeout(() => { setGone(true); exited.current?.(); }, reduced ? 0 : FADE_MS);
    return () => window.clearTimeout(id);
  }, [done, reduced]);

  if (gone) return null;

  const raw = done ? 1 : determinate ? progress! : sim;
  const value = Math.max(0, Math.min(1, Number.isFinite(raw) ? raw : 0));
  const pct = Math.round(value * 100);
  const label = rotulo ?? (language === 'pt-BR' ? 'Carregando' : 'Loading');

  return (
    <div
      className={`sm2-loadbar${reduced ? ' sm2-loadbar-still' : ''}${done ? ' is-done' : ''}`}
      role="progressbar"
      aria-busy={!done}
      aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={determinate ? pct : undefined}
      data-loadbar
      style={style}
    >
      <i data-loadbar-fill style={{ width: `${pct}%` }} />
    </div>
  );
}

export default LoadingBar;
