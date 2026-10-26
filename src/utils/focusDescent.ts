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
  dungeonLayerCap, hpAgora, podeDescer, sanitizeDepthRecord, sanitizeDungeonAway, soulmonNaMasmorra, spendLayer, startLayerFor, type DungeonAway,
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

/** A descida em andamento é a do FOCO (tem `until`)? A descida manual da masmorra nunca tem — cancelar/pausar o foco não mexe nela. */
export function isFocusDescent(state: Pick<GameState, 'dungeonAway'>): boolean {
  const a = sanitizeDungeonAway(state.dungeonAway);
  return !!a && a.until !== undefined;
}

/** O timer de foco foi PAUSADO: a descida congela em `nowMs` (nada rende parado). Sem descida de foco, ou já pausada → a mesma referência. */
export function pauseFocusDescent(prev: GameState, nowMs: number): GameState {
  const a = sanitizeDungeonAway(prev.dungeonAway);
  if (!a || a.until === undefined || a.pausedAt !== undefined) return prev;
  return { ...prev, dungeonAway: { ...a, pausedAt: nowMs } };
}

/** O timer de foco CONTINUOU: o tempo parado não conta (`since` anda junto) e o fim passa a ser `focusEndsAt` (o novo `endAt` do timer). */
export function resumeFocusDescent(prev: GameState, nowMs: number, focusEndsAt?: number): GameState {
  const a = sanitizeDungeonAway(prev.dungeonAway);
  if (!a || a.pausedAt === undefined) return prev;
  const parado = Math.max(0, nowMs - a.pausedAt);
  const { pausedAt: _p, ...resto } = a;
  void _p;
  const until = focusEndsAt !== undefined && focusEndsAt > nowMs ? focusEndsAt : (a.until ?? nowMs) + parado;
  return { ...prev, dungeonAway: { ...resto, since: a.since + parado, until } };
}
