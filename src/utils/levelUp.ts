/**
 * LEVEL UP — a regra do display (pedido do dono, 11/10/2026). Funções PURAS.
 *
 * O nível NUNCA é persistido (footgun 9 do CLAUDE.md): é sempre `bondLevelFor(totalXP)`. O que o save
 * guarda é só o ÚLTIMO nível CELEBRADO (`lastCelebratedLevel`) — o evento "subiu" é a diferença entre os
 * dois, derivada na leitura. Por isso o evento não se perde se o app fechar: o próximo load ainda enxerga
 * `bondLevelFor(totalXP) > lastCelebratedLevel`.
 *
 *  · Vários níveis de uma vez (check-in + dia completo + masmorra no mesmo lote) viram UM display,
 *    "Lv A → Lv B" — nunca N cerimônias empilhadas (a fila de intersticiais mostra UM por vez).
 *  · Save sem o campo (todo save anterior a esta versão) NÃO celebra os níveis que já tinha: a linha de
 *    base é o nível de agora (`levelUpBaseline`), gravada uma vez. Celebrar o passado seria um display de
 *    "Lv 1 → Lv 14" para quem já joga — e este é um app que não cobra nem faz fanfarra do que já passou.
 *  · O que o nível dá vem dos donos: 1 ponto de talento por Vínculo (`talentPointsFor`), as recompensas de
 *    `bondRewardFor` e os portões de `gatesOpenedBetween`. Nada é calculado aqui.
 */
import { BOND_MAX_LEVEL, bondLevelFor, bondRewardFor, type BondReward } from './bond';
import { gatesOpenedBetween, type GateFeature } from './gates';
import { talentPointsFor } from './talents';

export interface LevelUpEvent {
  /** O último nível celebrado (o que a pessoa já viu). */
  from: number;
  /** O nível de agora (`bondLevelFor(totalXP)`). */
  to: number;
}

/** O valor inicial de `lastCelebratedLevel` num save que ainda não o tem: o nível de agora, sem celebrar. */
export function levelUpBaseline(totalXP: unknown): number {
  return bondLevelFor(typeof totalXP === 'number' ? totalXP : 0);
}

/** Higieniza o campo vindo do save/nuvem: inteiro em [1, teto]; qualquer outra coisa = ausente. */
export function sanitizeCelebratedLevel(raw: unknown): number | undefined {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) return undefined;
  return Math.min(BOND_MAX_LEVEL, Math.floor(raw));
}

/**
 * Há um level up por celebrar? `null` quando não (inclusive campo ausente — ver a linha de base — e demo,
 * onde ninguém ganha XP).
 */
export function levelUpPending(
  totalXP: unknown,
  lastCelebratedLevel: unknown,
  demo = false,
): LevelUpEvent | null {
  if (demo) return null;
  const from = sanitizeCelebratedLevel(lastCelebratedLevel);
  if (from === undefined) return null;
  const to = levelUpBaseline(totalXP);
  return to > from ? { from, to } : null;
}

export interface LevelUpGains {
  /** Pontos de talento novos (1 por Vínculo, até o teto de `talentPointsFor`). */
  talentPoints: number;
  /** Recompensas dos níveis cruzados, do mais alto ao mais baixo (no máximo `MAX_REWARDS_SHOWN`). */
  rewards: BondReward[];
  /** Portões de recurso que abriram nesta subida. */
  gates: GateFeature[];
}

/** Quantas recompensas o display lista: o display é uma pausa, não um extrato. */
export const MAX_REWARDS_SHOWN = 3;

export function levelUpGains(from: number, to: number): LevelUpGains {
  const rewards: BondReward[] = [];
  for (let lvl = Math.min(to, BOND_MAX_LEVEL); lvl > from && rewards.length < MAX_REWARDS_SHOWN; lvl--) {
    const r = bondRewardFor(lvl);
    if (r) rewards.push(r);
  }
  return {
    talentPoints: Math.max(0, talentPointsFor(to) - talentPointsFor(from)),
    rewards,
    gates: gatesOpenedBetween(from, to),
  };
}
