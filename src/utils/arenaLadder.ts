/**
 * Escada e temporada da Arena fora de `arena.ts`: o `GameStateContext` e o `App` (entrada) só precisam sanear/rolar o número ao
 * carregar o save, e importar `arena.ts` inteiro puxava junto o motor de combate e o elenco de inimigos (orçamento de bytes, REGISTRO §497).
 */
export const ARENA_LADDER_MAX = 999;

/** Valor bom ou 0 (espelho em `functions/api/_dayCounters.js`). */
export function sanitizeArenaLadder(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  return Math.min(ARENA_LADDER_MAX, Math.max(0, Math.floor(raw)));
}

/**
 * TEMPORADA DA ARENA (decisão do dono, 22/11/2026): mensal, alinhada ao mês em UTC ("AAAA-MM"). Na virada a escada volta a 0 (nível 1);
 * ranking, prêmios e histórico NÃO são tocados. A 1ª temporada é a de agora: save sem `arenaSeason` adota o mês atual SEM zerar.
 * Espelho do servidor em `functions/api/_dayCounters.js` (`enforceArenaLadder`), travado por `dayCounters.parity.test.js`.
 */
export const arenaSeasonKey = (now: Date | number = Date.now()): string => new Date(now).toISOString().slice(0, 7);
export function sanitizeArenaSeason(raw: unknown): string | undefined {
  return typeof raw === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : undefined;
}
/** A escada e a temporada no mês de `now`: temporada mais velha (ou virada de mês) → escada 0; sem temporada → adota o mês, mantém a escada; temporada no futuro (relógio que voltou) → mantém. */
export function arenaRollover(ladder: unknown, season: unknown, now: Date | number = Date.now()): { ladder: number; season: string } {
  const cur = arenaSeasonKey(now);
  const l = sanitizeArenaLadder(ladder);
  const s = sanitizeArenaSeason(season);
  if (s === undefined) return { ladder: l, season: cur };
  if (s < cur) return { ladder: 0, season: cur };
  return { ladder: l, season: s };
}

/** Depois de uma run: vitória sobe 1; derrota e empate SEGURAM (param de subir, não descem). */
export const nextArenaLadder = (ladder: unknown, outcome: 'win' | 'loss' | 'draw'): number => {
  const l = sanitizeArenaLadder(ladder);
  return outcome === 'win' ? Math.min(ARENA_LADDER_MAX, l + 1) : l;
};
