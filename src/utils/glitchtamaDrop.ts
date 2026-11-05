import { mulberry32, type Rng } from './combate/rng';
import { GLITCHTAMA_EMOJI } from './shop';
import { isMilestoneLayer } from './dungeonIdle';
import { playerDayIso, type PlayerDayAnchor } from './playerDay';
import { weekMondayOf } from './premiumFood';

/**
 * O DROP do 🌀 Glitchtama no marco da Masmorra (dono, 05/11/2026) — DONO ÚNICO da regra.
 *
 * Era garantido 1 por descida, no primeiro marco. Evoluía rápido demais: agora é RARO.
 *  · cada marco (camada múltipla de `DUNGEON_MILESTONE_FLOOR`) sorteia `GLITCHTAMA_DROP_CHANCE` (1%);
 *  · no máximo `GLITCHTAMA_DROPS_PER_WEEK` (1) por SEMANA do jogador (segunda a domingo), contado no SAVE (`glitchtamaDrop`).
 * O estoque guardado e o limite de 1 USO por dia (`specialItemUse.ts`) NÃO mudam.
 *
 * A tela (`DungeonGame`) e a descida fora do app (`dungeonAway.ts`) usam as MESMAS funções daqui. O sorteio entra por
 * parâmetro (`rand`): a tela passa `Math.random`; a descida fora passa um sorteio semeado por (seed da descida, camada), então
 * reprocessar o mesmo marco dá a mesma resposta e reabrir o app não re-sorteia.
 */
export const GLITCHTAMA_DROP_CHANCE = 0.01;
export const GLITCHTAMA_DROPS_PER_WEEK = 1;

/** Registro no SAVE (`glitchtamaDrop`): a semana (segunda `YYYY-MM-DD`) do último drop e quantos caíram nela. */
export interface GlitchtamaDropRecord { week: string; dropped: number }
export interface GlitchtamaDropClock { glitchtamaDrop?: GlitchtamaDropRecord; playerDayTz?: PlayerDayAnchor }

/** Higieniza o campo do save. Ausente/lixo → `undefined` (nenhum drop nesta semana: save antigo nunca fica travado). */
export function sanitizeGlitchtamaDrop(v: unknown): GlitchtamaDropRecord | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const r = v as { week?: unknown; dropped?: unknown };
  if (typeof r.week !== 'string' || !r.week) return undefined;
  const dropped = typeof r.dropped === 'number' && Number.isFinite(r.dropped) ? Math.max(0, Math.floor(r.dropped)) : 0;
  return { week: r.week, dropped };
}

/** Quantos Glitchtama já caíram da masmorra na semana de `now` (dia do jogador). */
export function glitchtamaDroppedThisWeek(state: GlitchtamaDropClock, now: Date): number {
  const r = sanitizeGlitchtamaDrop(state.glitchtamaDrop);
  return r && r.week === weekMondayOf(playerDayIso(now, state.playerDayTz)) ? r.dropped : 0;
}

/** O sorteio SEMEADO do marco `layer` de uma descida (`seed`): a tela e a descida fora do app usam o MESMO (a masmorra não lê `Math.random`;
 *  reabrir o app ou reprocessar o marco dá a mesma resposta). */
export function glitchtamaDraw(seed: number, layer: number): Rng {
  return mulberry32((Math.imul(seed | 0, 131) + layer * 17 + 0x61c8) | 0);
}

/** Este marco, limpo agora, rende Glitchtama? (marco + teto semanal + sorteio de 1%.) O sorteio só é gasto se o teto ainda deixa. */
export function glitchtamaDropFor(state: GlitchtamaDropClock, layer: number, now: Date, rand: () => number): boolean {
  if (!isMilestoneLayer(layer)) return false;
  if (glitchtamaDroppedThisWeek(state, now) >= GLITCHTAMA_DROPS_PER_WEEK) return false;
  return rand() < GLITCHTAMA_DROP_CHANCE;
}

/** Aplica o drop (PURA): +1 no inventário e o registro da semana. Reconfere o teto: se já estourou, devolve o MESMO estado. */
export function withGlitchtamaDrop<T extends GlitchtamaDropClock & { foodInventory: Record<string, number> }>(state: T, now: Date): T {
  if (glitchtamaDroppedThisWeek(state, now) >= GLITCHTAMA_DROPS_PER_WEEK) return state;
  const week = weekMondayOf(playerDayIso(now, state.playerDayTz));
  return {
    ...state,
    foodInventory: { ...state.foodInventory, [GLITCHTAMA_EMOJI]: (state.foodInventory[GLITCHTAMA_EMOJI] ?? 0) + 1 },
    glitchtamaDrop: { week, dropped: glitchtamaDroppedThisWeek(state, now) + 1 },
  };
}
