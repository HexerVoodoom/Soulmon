/**
 * Extras da tela de resultado (pedido do dono, 03/11/2026): a barra de Bits do dia (só quando o teto está em 100%) e a linha da
 * missão do dia do jogo que acabou. Puro: o `App` monta isto a cada render a partir do save e o entrega pelo
 * `ResultExtrasContext` (`components/games/ResultExtrasContext.ts`); o `ResultScreen` só lê.
 */
import { MINIGAME_BITS_PER_DAY, minigameBitsToday, type MinigameBitsState } from './currencies';
import { dailyCount, dailyMissionsFor, dailyStatus, type DailyEvent, type DailyMissionsState, type DailyStatus } from './dailyMissions';

export interface ResultMission { label: string; count: number; target: number; status: DailyStatus }
export interface ResultExtras {
  bitsToday: number;
  bitsCap: number;
  /** A missão do dia por evento (a primeira que conta aquele evento). Ausente = o jogo não tem missão hoje. */
  missions: Partial<Record<DailyEvent, ResultMission>>;
}

export function buildResultExtras(state: MinigameBitsState & { dailyMissions?: DailyMissionsState }, day: string, bondLevel: unknown, isPt: boolean): ResultExtras {
  const missions: ResultExtras['missions'] = {};
  for (const m of dailyMissionsFor(day, bondLevel)) {
    if (missions[m.event]) continue;
    missions[m.event] = { label: isPt ? m.descPt : m.descEn, count: dailyCount(state.dailyMissions, day, m), target: m.target, status: dailyStatus(state.dailyMissions, day, m) };
  }
  return { bitsToday: minigameBitsToday(state, day), bitsCap: MINIGAME_BITS_PER_DAY, missions };
}
