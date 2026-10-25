/**
 * A DESCIDA DO FOCO (beta3 F1): com o timer de foco da Focus Workshop rodando, a masmorra desce em BACKGROUND pelo mecanismo que já
 * existe (`dungeonAway` do save + `applyDungeonAway`). Esta função só ABRE o registro; quem acerta a conta (volta sozinho, resumo)
 * é o fluxo de sempre (`settleDungeonAwayNow` / o retorno automático da Home).
 *
 * O jogador da descida é o `soulCombatant` do save SEM bônus de talento e com a família "direct" (a tela da masmorra, que sabe os talentos
 * e o ofício, não está montada aqui) — uma descida de foco rende um pouco menos que uma jogada na tela, e isso é declarado ao jogador.
 * Pura e conferida sobre o `prev` (updater do `setGameState`): recusa devolve a MESMA referência.
 */
import type { GameState } from '../contexts/GameStateContext';
import { bondLevelFor } from './bond';
import { newDefenseSeed } from './autoDefesa';
import {
  dungeonLayerCap, hpAgora, podeDescer, sanitizeDepthRecord, soulmonNaMasmorra, spendLayer, startLayerFor, type DungeonAway,
} from './dungeonIdle';
import { soulCombatant } from './soulXP';

export type FocusDescentRefusal = 'busy' | 'no-hp' | 'no-energy';

/** Por que a descida de foco NÃO pode abrir agora (`undefined` = pode). */
export function focusDescentRefusal(state: GameState, nowMs: number): FocusDescentRefusal | undefined {
  if (soulmonNaMasmorra(state)) return 'busy';
  if (state.guildMission) return 'busy';
  if (!podeDescer({ dungeonHp: state.dungeonHp }, nowMs)) return 'no-hp';
  const paid = spendLayer(state, nowMs);
  if (paid === state) return 'no-energy';
  return undefined;
}

/** Abre a descida do foco: paga a 1ª camada (como a tela) e grava `dungeonAway`. `focusEndsAt` = fim do timer de foco: a descida acaba aí (campo `until`), ou antes se a energia/HP acabar. Recusa → a mesma referência. */
export function startFocusDescent(prev: GameState, nowMs: number, seed: number = newDefenseSeed(), focusEndsAt?: number): GameState {
  if (focusDescentRefusal(prev, nowMs)) return prev;
  const paid = spendLayer(prev, nowMs);
  const c = soulCombatant({
    evolutionStage: prev.evolutionStage, perfectDays: prev.perfectDays, powerPoints: prev.powerPoints, harmonyPoints: prev.harmonyPoints,
    benevolencePoints: prev.benevolencePoints, degeneratedByHP: prev.degeneratedByHP,
  });
  const cap = dungeonLayerCap(c.level, bondLevelFor(prev.totalXP ?? 0));
  const layer = startLayerFor(sanitizeDepthRecord(prev.dungeonDepthRecord), cap);
  const reg: DungeonAway = {
    since: nowMs, seed, layer, slot: 0, hp: hpAgora({ dungeonHp: prev.dungeonHp }, nowMs), en: 0, ms: false,
    ...(focusEndsAt !== undefined && focusEndsAt > nowMs ? { until: focusEndsAt } : {}),
    player: { level: c.level, atk: c.atk, def: c.def, spd: c.spd, hp: c.hp, bonus: c.bonus, fam: 'direct', sh: 0, hb: 0, rb: 0, stage: prev.evolutionStage },
  };
  return { ...paid, dungeonAway: reg };
}
