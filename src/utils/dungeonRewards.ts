// 🎁 As recompensas PURAS da Masmorra (REGISTRO §36): a tela (`App.tsx`, pelos callbacks da `DungeonGame`) e a descida que continua
// sozinha (`utils/dungeonAway.ts`) leem as MESMAS funções — uma só conta de abate/bestiário, Vínculo, item do marco e missão semanal.
// Módulo leve de propósito (só importa o que o `App` já carrega): o simulador da descida fica no chunk preguiçoso.
import type { GameState } from '../contexts/GameStateContext';
import { awardBondXP, bondLevelFor } from './bond';
import { playerDayKey } from './playerDay';
import { addFragments, fragmentGain, FRAGMENTS_PER_RUN } from './equipment';
import { sanitizeTalentPicks } from './talents';
import { isoWeekKey } from './offerMoment';
import { bumpWeekly, forWeek, type WeeklyMissionId } from './weeklyMissions';
import { GLITCHTAMA_EMOJI } from './shop';

/** Conta uma missão semanal (a mesma conta de `contarMissao` do App, sem o setState). */
export function countWeeklyMission<T extends Pick<GameState, 'weeklyMissions' | 'playerDayTz'>>(prev: T, id: WeeklyMissionId, now: Date): T {
  const semana = isoWeekKey(playerDayKey(now, prev.playerDayTz));
  if (!semana) return prev;
  return { ...prev, weeklyMissions: bumpWeekly(forWeek(prev.weeklyMissions, semana), id) };
}

/** Um inimigo vencido: abate e bestiário (a mesma conta de `handleDungeonEnemyDefeated`). */
export function applyEnemyDefeated<T extends Pick<GameState, 'dungeonKills' | 'bestiary'>>(prev: T, enemyKey?: string): T {
  return {
    ...prev,
    dungeonKills: (prev.dungeonKills ?? 0) + 1,
    bestiary: enemyKey && !(prev.bestiary ?? []).includes(enemyKey) ? [...(prev.bestiary ?? []), enemyKey] : prev.bestiary,
  };
}

/** Um inimigo VISTO sem abate (Combina 3, M10): entra no bestiário (chave do roster `<id>-<estágio>`), IDEMPOTENTE, sem tocar `dungeonKills`. */
export function applyBestiarySeen<T extends Pick<GameState, 'bestiary'>>(prev: T, enemyKey?: string): T {
  if (!enemyKey || (prev.bestiary ?? []).includes(enemyKey)) return prev;
  return { ...prev, bestiary: [...(prev.bestiary ?? []), enemyKey] };
}

/** Uma camada limpa: Vínculo (a mesma de `handleDungeonFloorCleared`). */
export function applyFloorCleared<T extends GameState>(prev: T, now: Date): T {
  return awardBondXP(prev, { kind: 'dungeonFloor' }, playerDayKey(now, prev.playerDayTz));
}

/** O item do marco (o 🌀): item, Vínculo e fragmentos da run (a mesma do handler do marco no App). A missão semanal "dungeon-runs" é contada à parte (`contarMissao` no App; `countWeeklyMission` na descida fora do app). */
export function applyMilestoneItem<T extends GameState>(prev: T, now: Date): T {
  const base: T = {
    ...awardBondXP(prev, { kind: 'dungeonRun' }, playerDayKey(now, prev.playerDayTz)),
    foodInventory: { ...prev.foodInventory, [GLITCHTAMA_EMOJI]: (prev.foodInventory[GLITCHTAMA_EMOJI] ?? 0) + 1 },
    dungeonRunsCompleted: (prev.dungeonRunsCompleted ?? 0) + 1,
  };
  // PR8b: a run COMPLETA rende fragmentos de equipamento (moeda ganha jogando; o Comércio soma até +25%).
  const comFragmentos = addFragments(base, fragmentGain(FRAGMENTS_PER_RUN, sanitizeTalentPicks(prev.talentPicks, bondLevelFor(prev.totalXP ?? 0))));
  return comFragmentos;
}
