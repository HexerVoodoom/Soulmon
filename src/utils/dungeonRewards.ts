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
import { rosterEntryOfKey } from './enemyRoster';
import { applyElementsDefeated, elementIdOfFoe } from './elementDex';
import { applyEssences, applyEssencesAway, essenceDropOfFoe } from './essences';

/** Conta uma missão semanal (a mesma conta de `contarMissao` do App, sem o setState). */
export function countWeeklyMission<T extends Pick<GameState, 'weeklyMissions' | 'playerDayTz'>>(prev: T, id: WeeklyMissionId, now: Date): T {
  const semana = isoWeekKey(playerDayKey(now, prev.playerDayTz));
  if (!semana) return prev;
  return { ...prev, weeklyMissions: bumpWeekly(forWeek(prev.weeklyMissions, semana), id) };
}

/** Um inimigo vencido: abate, bestiário e elemento do dex (a mesma conta de `handleDungeonEnemyDefeated`). */
export function applyEnemyDefeated<T extends Pick<GameState, 'dungeonKills' | 'bestiary' | 'defeatedElements' | 'essences' | 'essenceAway'>>(prev: T, enemyKey?: string, away?: { dayKey: string }): T {
  const abatido: T = {
    ...prev,
    dungeonKills: (prev.dungeonKills ?? 0) + 1,
    bestiary: enemyKey && !(prev.bestiary ?? []).includes(enemyKey) ? [...(prev.bestiary ?? []), enemyKey] : prev.bestiary,
  };
  // Dex de elementos (27/10/2026): vencer um inimigo IDENTIFICADO libera o elemento dele (composto = só o composto).
  const comDex = applyElementsDefeated(abatido, [elementIdOfFoe(rosterEntryOfKey(enemyKey)?.elements)]);
  // Essências (28/10/2026, REGISTRO §183): a do PRÓPRIO elemento, pelo estágio. Luta ativa = sem teto; descida automática (`away`) = teto diário.
  const e = rosterEntryOfKey(enemyKey);
  const drop = e ? essenceDropOfFoe(e.elements, e.stage) : undefined;
  return away ? applyEssencesAway(comDex, drop, away.dayKey) : applyEssences(comDex, [drop]);
}

/** Um inimigo VISTO sem abate (Elemental Fusion, M10): entra no bestiário (chave do roster `<id>-<estágio>`), IDEMPOTENTE, sem tocar `dungeonKills`. */
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
