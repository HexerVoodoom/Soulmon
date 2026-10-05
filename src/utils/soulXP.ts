/**
 * XP e level do Soulmon (combate v3, PR2; contexto §2.7/§2.8) — DERIVADOS.
 *
 * Nada aqui é persistido: o level é função pura de fatos que o save já guarda
 * (`evolutionStage`, `perfectDays`, `powerPoints`/`harmonyPoints`/
 * `benevolencePoints`). Por isso:
 *  · degenerar BAIXA o level (`perfectDays` cai e o teto do estágio cai) e
 *    recuperar devolve exatamente o mesmo level e os mesmos stats — não existe
 *    XP guardado para reconciliar;
 *  · o save antigo já abre com o level certo (o retroativo é a própria
 *    derivação) e o `fuzz2` segue em 103 campos;
 *  · o dia perfeito de bônus (o item 🌀 do contexto §2.4) DÁ ponto: ele soma em `perfectDays`, que é a fonte viva.
 *
 * REGRA #16 — XP nunca é por CONTAGEM de tarefas. A unidade é o dia completo
 * (66%) mais o esforço ponderado frente à meta (34%): `dayXP` só lê somas de
 * peso de esforço (`Effort` 1/2/3), nunca quantas tarefas foram.
 *
 * Mirror do servidor: `functions/api/_soulXP.js` (travado por
 * `functions/api/soulXP.parity.test.js`). O servidor nunca aceita level nem
 * stats vindos do cliente: recalcula destes fatos.
 */

import { levelCapFor, stageIndexOf } from '../types/progression';
import { combatantAt, firstLevelOfStage, MAX_LEVEL, type StatWeights } from './combate/level';
import type { Combatant } from './combate/curve';

/** XP que separa um level do próximo. */
export const XP_PER_LEVEL = 100;
/** Parcela do XP do dia que vem do dia completo (o resto é esforço/meta). */
export const XP_COMPLETE_DAY_SHARE = 0.66;
export const XP_COMPLETE_DAY = Math.round(XP_PER_LEVEL * XP_COMPLETE_DAY_SHARE); // 66
export const XP_EFFORT_MAX = XP_PER_LEVEL - XP_COMPLETE_DAY; // 34

export interface DayFacts {
  /** O dia contou como completo (`completeDayReached`). */
  complete: boolean;
  /** Soma dos PESOS de esforço feitos no dia (nunca a contagem de tarefas). */
  effortDone: number;
  /** Soma dos pesos de esforço da meta do dia. */
  effortGoal: number;
}

function safe(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * XP de UM dia: 66 pelo dia completo + até 34 pelo esforço contra a meta.
 * Dobrar o número de tarefas com o mesmo peso total não muda nada.
 */
export function dayXP(day: DayFacts): number {
  const goal = safe(day.effortGoal);
  const ratio = goal > 0 ? Math.min(1, safe(day.effortDone) / goal) : 0;
  return (day.complete ? XP_COMPLETE_DAY : 0) + XP_EFFORT_MAX * ratio;
}

/** XP de um dia completo com a meta cumprida: o valor de cada `perfectDays`. */
export const XP_FULL_DAY = dayXP({ complete: true, effortDone: 1, effortGoal: 1 });

/** Fatia do `GameState` que o XP lê. */
export interface SoulXPState {
  evolutionStage?: string;
  perfectDays?: number;
  powerPoints?: number;
  harmonyPoints?: number;
  benevolencePoints?: number;
  degeneratedByHP?: boolean;
}

/** XP do estágio atual: o piso do estágio mais os dias perfeitos desde que ele começou. */
export function soulXP(state: SoulXPState): number {
  const stage = stageIndexOf(String(state?.evolutionStage ?? 'rookie'));
  const floorXP = (firstLevelOfStage(stage) - 1) * XP_PER_LEVEL;
  return floorXP + Math.floor(safe(state?.perfectDays)) * XP_FULL_DAY;
}

/** Level bruto de um XP (sem o teto do estágio): 1 + floor(xp/100), em [1, MAX_LEVEL]. */
export function levelFor(xp: number): number {
  return Math.min(MAX_LEVEL, 1 + Math.floor(safe(xp) / XP_PER_LEVEL));
}

/** `min(levelFor(soulXP), levelCapFor(stage))`. */
export function soulLevel(state: SoulXPState): number {
  return Math.min(levelFor(soulXP(state)), levelCapFor(String(state?.evolutionStage ?? 'rookie')));
}

/** Pontos totais de ATK/DEF/SPD: 1 por level. O HP sobe sozinho (não custa ponto). */
export function statPoints(level: number): number {
  return Math.max(1, Math.floor(level));
}

/** Pesos da distribuição a partir do galho acumulado: Poder→ATK, Harmonia→SPD, Benevolência→DEF. */
export function soulWeights(state: SoulXPState): StatWeights {
  return { atk: safe(state?.powerPoints), spd: safe(state?.harmonyPoints), def: safe(state?.benevolencePoints) };
}

/** Combatente do Soulmon de um estado (derivado; o bônus entra por `combate/bonus.ts`). */
export function soulCombatant(state: SoulXPState, bonus = 0): Combatant {
  return combatantAt(soulLevel(state), soulWeights(state), bonus);
}

// ── Texto do level (EN primeiro, PT-BR depois). Neutro: nada de perda. ──────

/** Rótulo "Lv N" (NARRATIVA §12 veta "nível" para a criatura). */
export function soulLevelLabel(level: number): string {
  return `Lv ${Math.max(1, Math.floor(level))}`;
}

/**
 * Linha do level. Quando ele desceu (a queda de estágio), o texto só explica a
 * regra e promete a volta, sem falar em perda (`copy.semFomo`).
 */
export function soulLevelLine(level: number, dropped: boolean, language: string): string {
  const pt = language === 'pt-BR';
  const lv = soulLevelLabel(level);
  if (!dropped) return lv;
  return pt
    ? `${lv} · acompanha os seus dias completos e volta junto com eles`
    : `${lv} · follows your full days and returns with them`;
}
