/**
 * O FERREIRO — as AÇÕES puras (conceder, aprimorar, refazer a escolha). Rodam DENTRO de um updater do `setGameState` (footgun 6):
 * cada uma reconfere a recusa sobre o `prev` que recebe e devolve a MESMA referência quando não muda nada (idempotente: dois toques
 * no mesmo lote não pagam duas vezes). As tabelas e o bônus moram em `forge.ts`; o canal único de 5% é `combate/bonus.ts`.
 *
 * Sem sorteio. Nada de Créditos nem dinheiro real: o único Bit que paga é o GANHO (`earnedBits`), e o material nunca fica negativo.
 */

import { sanitizeEquipment, discounted, equipPriceDiscount, weeklyDiscountFor, type EquipmentState } from './equipment';
import { stockOf, MATERIAL_CAP, type BuildingQuestState, type MaterialId } from './buildingQuests';
import { earnedBits, type BitsOrigin } from './bitsOrigin';
import { bondLevelFor } from './bond';
import type { BuildingId } from './gates';
import {
  FORGE_MAX_LEVEL, LEVEL_MIN_BOND, PIECE_BY_BUILDING, PIECE_BY_ID, REDO_BITS, REDO_FRAGMENTS, UPGRADE_COST, pieceChoices, pieceLevel, sanitizeForge,
  type ForgeChoice, type ForgePiece, type ForgeState,
} from './forge';

export interface ForgeGameState {
  gamePoints?: number;
  bitsOrigin?: BitsOrigin;
  equipment?: EquipmentState;
  forge?: ForgeState;
  buildingQuests?: BuildingQuestState;
  totalXP?: number;
  talentPicks?: string[];
  /** A semana ISO do dia do jogador (`isoWeekKey`), só para o desconto semanal do Comércio ao refazer. */
  weekKey?: string | null;
}

export type ForgeRefusal = 'unknown' | 'not-owned' | 'max-level' | 'bond' | 'no-materials' | 'bad-choice' | 'bad-level' | 'same' | 'no-funds' | 'not-earned' | 'no-fragments';
export type RedoPay = 'bits' | 'fragments';

/** O custo em materiais do aprimoramento PARA o nível `to` (2..5): lista de [material, quantidade], sem as quantidades zero. */
export function upgradeCost(piece: ForgePiece, to: number): { material: MaterialId; n: number }[] {
  const c = UPGRADE_COST[to as 2 | 3 | 4 | 5];
  if (!c) return [];
  return piece.mats.map((material, i) => ({ material, n: c[i] })).filter((x) => x.n > 0);
}

/** A peça possuída e seu nível atual (`forge` + migração derivada). */
export function levelNow(state: ForgeGameState, id: string): number {
  return pieceLevel(id, state.forge, sanitizeEquipment(state.equipment).owned.includes(id));
}

/** A recusa do aprimoramento da peça para o próximo nível (ou `undefined`). A tela desabilita o botão com este MESMO motivo. */
export function upgradeRefusal(state: ForgeGameState, id: string): ForgeRefusal | undefined {
  const piece = PIECE_BY_ID.get(id);
  if (!piece) return 'unknown';
  const level = levelNow(state, id);
  if (level === 0) return 'not-owned';
  if (level >= FORGE_MAX_LEVEL) return 'max-level';
  const to = level + 1;
  const vinculo = bondLevelFor(state.totalXP ?? 0);
  if (vinculo < LEVEL_MIN_BOND[to]) return 'bond';
  for (const c of upgradeCost(piece, to)) if (stockOf(state.buildingQuests, c.material) < c.n) return 'no-materials';
  return undefined;
}

/**
 * Aprimora a peça para o próximo nível com a opção `choice`, debitando os materiais. Recusa reconferida sobre `prev`; devolve o MESMO
 * `prev` se recusar. `ok:false` traz o motivo para a tela explicar.
 */
export function applyUpgrade<T extends ForgeGameState>(prev: T, id: string, choice: ForgeChoice): { ok: true; state: T } | { ok: false; reason: ForgeRefusal } {
  if (choice !== 'a' && choice !== 'b') return { ok: false, reason: 'bad-choice' };
  const reason = upgradeRefusal(prev, id);
  if (reason) return { ok: false, reason };
  const piece = PIECE_BY_ID.get(id)!;
  const level = levelNow(prev, id);
  const to = level + 1;
  const bq = prev.buildingQuests!;
  const materials = { ...bq.materials };
  for (const c of upgradeCost(piece, to)) {
    const left = Math.min(MATERIAL_CAP, Math.max(0, (materials[c.material] ?? 0) - c.n));
    if (left > 0) materials[c.material] = left; else delete materials[c.material];
  }
  const f = sanitizeForge(prev.forge);
  const picks = [...pieceChoices(id, level, prev.forge), choice];
  const forge: ForgeState = { levels: { ...f.levels, [id]: to }, picks: { ...f.picks, [id]: picks } };
  return { ok: true, state: { ...prev, buildingQuests: { ...bq, materials }, forge } };
}

/** O preço em Bits de refazer uma escolha, com o Comércio (`tal-com-01` e a peça da semana). */
export function redoBitsPrice(id: string, picks: readonly string[] | undefined, weekKey?: string | null): number {
  return discounted(REDO_BITS, equipPriceDiscount(picks) + weeklyDiscountFor(id, picks, weekKey));
}

/** A recusa de refazer a escolha do `level` (2..nível atual) para `choice`, pagando `pay`. */
export function redoRefusal(state: ForgeGameState, id: string, level: number, choice: ForgeChoice, pay: RedoPay): ForgeRefusal | undefined {
  if (!PIECE_BY_ID.has(id)) return 'unknown';
  if (choice !== 'a' && choice !== 'b') return 'bad-choice';
  const now = levelNow(state, id);
  if (now === 0) return 'not-owned';
  if (!Number.isInteger(level) || level < 2 || level > now) return 'bad-level';
  if (pieceChoices(id, now, state.forge)[level - 2] === choice) return 'same';
  if (pay === 'fragments') return sanitizeEquipment(state.equipment).fragments < REDO_FRAGMENTS ? 'no-fragments' : undefined;
  const price = redoBitsPrice(id, state.talentPicks, state.weekKey);
  const bal = Math.max(0, Math.floor(Number.isFinite(state.gamePoints) ? (state.gamePoints as number) : 0));
  if (bal < price) return 'no-funds';
  // Tem Bits, mas parte deles veio de Crédito: refazer só com Bit GANHO.
  return earnedBits(state) < price ? 'not-earned' : undefined;
}

/** Refaz a escolha do `level` para `choice` pagando Bits ganhos ou fragmentos. Idempotente: repetir a mesma escolha é recusado (`same`). */
export function applyRedo<T extends ForgeGameState>(prev: T, id: string, level: number, choice: ForgeChoice, pay: RedoPay): { ok: true; state: T; price: number } | { ok: false; reason: ForgeRefusal } {
  const reason = redoRefusal(prev, id, level, choice, pay);
  if (reason) return { ok: false, reason };
  const now = levelNow(prev, id);
  const f = sanitizeForge(prev.forge);
  const picks = pieceChoices(id, now, prev.forge);
  picks[level - 2] = choice;
  const forge: ForgeState = { levels: { ...f.levels, [id]: now }, picks: { ...f.picks, [id]: picks } };
  if (pay === 'fragments') {
    const eq = sanitizeEquipment(prev.equipment);
    return { ok: true, price: REDO_FRAGMENTS, state: { ...prev, forge, equipment: { ...eq, fragments: eq.fragments - REDO_FRAGMENTS } } };
  }
  const price = redoBitsPrice(id, prev.talentPicks, prev.weekKey);
  return { ok: true, price, state: { ...prev, forge, gamePoints: (prev.gamePoints ?? 0) - price } };
}

/**
 * O resgate da missão do prédio concede a peça de nível 1 (a 1ª vez). Idempotente: quem já tem a peça (inclusive comprada antes) não
 * ganha nada. NUNCA recusa por mochila — o prêmio de missão sempre chega (a mochila só limita o que se TIRA do slot). Equipa na hora
 * se o slot está vazio.
 */
export function applyForgeGrant<T extends ForgeGameState>(prev: T, building: BuildingId): T {
  const piece = PIECE_BY_BUILDING.get(building);
  if (!piece) return prev;
  const eq = sanitizeEquipment(prev.equipment);
  if (eq.owned.includes(piece.id)) return prev;
  const f = sanitizeForge(prev.forge);
  return {
    ...prev,
    equipment: { ...eq, owned: [...eq.owned, piece.id], equipped: eq.equipped[piece.slot] ? eq.equipped : { ...eq.equipped, [piece.slot]: piece.id } },
    forge: { levels: { ...f.levels, [piece.id]: 1 }, picks: f.picks },
  };
}
