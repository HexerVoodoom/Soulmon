import { useEffect } from 'react';

/**
 * PREFETCH DOS CHUNKS DE JOGAR (rodada 7 · J1, 04/10/2026).
 *
 * Causa-raiz do "Opening…" demorado: o APK carrega o app de uma URL remota
 * (`capacitor.config.json` → `server.url`), e cada `lazy()` só começava a baixar
 * NO TOQUE. Abrir um jogo era uma cascata de idas à rede em série: lote →
 * `PlaySheets` (que importa estático a `DungeonGame` e o `RPSGame`, só por
 * constantes) → CTA → chunk do jogo → `GameKit`/`BattleStage`/`dungeonScenes` →
 * a arte. Os chunks são pequenos (6–30 KB cada, ver `docs/AJUSTES-RODADA-7`), o
 * que pesa é a LATÊNCIA de cada ida, não o tamanho.
 *
 * O conserto é antecipar: os MESMOS `import()` que o `lazy()` usa são chamados
 * em tempo ocioso (o Vite deduplica por módulo, então o toque encontra a
 * promessa já resolvida) e, ao abrir uma folha de jogos, os jogos dela.
 * Nenhum trabalho síncrono: um chunk por tick ocioso, falha silenciosa (offline
 * ou rede ruim → o `lazy()` normal tenta de novo no toque).
 */
export const loadAreaView = () => import('./AreaView');
export const loadPlaySheets = () => import('../play/PlaySheets');
export const loadDungeonGame = () => import('../DungeonGame');
export const loadDinoGame = () => import('../DinoGame');
export const loadRPSGame = () => import('../RPSGame');
export const loadEcoGame = () => import('../mente/EcoGame');
export const loadBolhasGame = () => import('../mente/BolhasGame');
export const loadTrocaGame = () => import('../mente/TrocaGame');
export const loadPicrossGame = () => import('../mente/PicrossGame');
export const loadRevisaoGame = () => import('../mente/RevisaoGame');
export const loadRespiracaoGame = () => import('../refugio/RespiracaoGame');

type Loader = () => Promise<unknown>;

/** Ordem: o que o dono mais abre primeiro. */
const GAME_LOADERS: Loader[] = [
  loadDungeonGame, loadDinoGame, loadRPSGame, loadEcoGame, loadBolhasGame,
  loadTrocaGame, loadPicrossGame, loadRevisaoGame, loadRespiracaoGame,
];

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Agenda `cb` para quando o navegador estiver ocioso (cai para setTimeout). */
function whenIdle(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const w = window as IdleWindow;
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout: 2500 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 600);
  return () => window.clearTimeout(id);
}

/** Baixa os loaders UM POR TICK OCIOSO. Devolve o cancelamento. */
export function prefetchSequence(loaders: Loader[]): () => void {
  let cancelled = false;
  let cancelIdle: () => void = () => {};
  let i = 0;
  const step = () => {
    if (cancelled || i >= loaders.length) return;
    const next = loaders[i++];
    next().catch(() => { /* offline: o lazy() tenta de novo no toque */ }).then(() => {
      if (!cancelled) cancelIdle = whenIdle(step);
    });
  };
  cancelIdle = whenIdle(step);
  return () => { cancelled = true; cancelIdle(); };
}

/** Home → `AreaView` (o chunk que toda área abre) em tempo ocioso. */
export function useAreaViewPrefetch(): void {
  useEffect(() => prefetchSequence([loadAreaView, loadPlaySheets]), []);
}

/** Dentro das áreas de jogar: sobe a folha e depois os jogos, sem bloquear. */
export function usePlayPrefetch(active: boolean, sheetOpen: boolean): void {
  useEffect(() => (active ? prefetchSequence([loadPlaySheets]) : undefined), [active]);
  // Abriu uma folha de jogo: a pessoa está a um toque de jogar — os jogos já.
  useEffect(() => (active && sheetOpen ? prefetchSequence(GAME_LOADERS) : undefined), [active, sheetOpen]);
}
