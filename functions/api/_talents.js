/**
 * Espelho de `src/utils/talents.ts` (Combate v3 / PR7), so a parte que o SERVIDOR usa: validar o
 * vetor `talentPicks` do save e dar a parcela de talento do canal de bonus do duelo.
 * Pages Functions nao importam de `src/`: o catalogo e copiado e travado por `talents.parity.test.js`.
 * Malformado e DESCARTADO (`[]`); so violar pre-requisito poda (sanitize); o servidor nunca confia no cliente.
 */

import { cleanCheerScale, COMBAT_BONUS_CAP, START_ENERGY_MAX, DOT_RESIST_MAX } from './_combate.js';

/** Tarefa B (§2.38): tetos dos nos que entraram "em breve" (espelham `src/utils/talents.ts`). */
export const HEAL_BOOST_MAX = 0.015;
export const RIFT_BITS_MAX = 0.09;
export const START_SHIELD_MAX = 0.01;

export const TALENT_POINTS_MAX = 20;

/** Pre-requisito: o no `id` com pelo menos `rank` graus (espelha `req` de `src/utils/talents.ts`). */
const req = (id, rank) => ({ id, rank });

/**
 * id -> grau maximo e efeito, so dos nos PEGAVEIS (os `pendente` nao se compram).
 * @type {Readonly<Record<string, { maxRank: number, kind: 'combatBonus' | 'respecDiscount' | 'cheerBoost' | 'respecOne' | 'equipPrice' | 'fragmentGain' | 'backpack' | 'missionBits' | 'weeklyDiscount' | 'startEnergy' | 'dotResist' | 'allAttr' | 'healBoost' | 'riftBits' | 'startShield', scope?: 'pvp' | 'pve' | 'nightmare', attr?: 'atk' | 'def' | 'spd', perRank?: number, requires?: readonly { id: string, rank: number }[], requiresAny?: readonly { id: string, rank: number }[] }>>}
 */
export const PICKABLE = {
  'tal-pvp-01': { maxRank: 4, kind: 'combatBonus', scope: 'pvp', attr: 'atk', perRank: 0.004 },
  'tal-pvp-02': { maxRank: 4, kind: 'combatBonus', scope: 'pvp', attr: 'def', perRank: 0.004, requires: [req('tal-pvp-01', 2)] },
  'tal-pvp-03': { maxRank: 4, kind: 'combatBonus', scope: 'pvp', attr: 'spd', perRank: 0.004, requires: [req('tal-pvp-01', 2)] },
  'tal-pvp-04': { maxRank: 3, kind: 'startEnergy', perRank: 3, requires: [req('tal-pvp-03', 2)] },
  'tal-pvp-05': { maxRank: 3, kind: 'cheerBoost', perRank: 0.05, requiresAny: [req('tal-pvp-02', 2), req('tal-pvp-03', 2)] },
  'tal-pvp-06': { maxRank: 3, kind: 'dotResist', perRank: 0.06, requires: [req('tal-pvp-02', 2)] },
  'tal-pvp-07': { maxRank: 1, kind: 'allAttr', perRank: 0.002, requires: [req('tal-pvp-05', 3), req('tal-pvp-04', 1), req('tal-pvp-06', 1)] },
  'tal-pve-01': { maxRank: 4, kind: 'combatBonus', scope: 'pve', perRank: 0.006 },
  'tal-pve-02': { maxRank: 4, kind: 'combatBonus', scope: 'pve', perRank: 0.006, requires: [req('tal-pve-01', 2)] },
  'tal-pve-03': { maxRank: 3, kind: 'healBoost', perRank: 0.005, requires: [req('tal-pve-01', 2)] },
  'tal-pve-04': { maxRank: 3, kind: 'riftBits', perRank: 0.03, requires: [req('tal-pve-03', 1)] },
  'tal-pve-05': { maxRank: 3, kind: 'combatBonus', scope: 'nightmare', perRank: 0.004, requires: [req('tal-pve-03', 1)] },
  'tal-pve-06': { maxRank: 3, kind: 'combatBonus', scope: 'pve', perRank: 0.004, requires: [req('tal-pve-02', 2)] },
  'tal-pve-07': { maxRank: 1, kind: 'startShield', perRank: 0.01, requires: [req('tal-pve-05', 1), req('tal-pve-06', 1)] },
  'tal-com-01': { maxRank: 3, kind: 'equipPrice' },
  'tal-com-02': { maxRank: 3, kind: 'fragmentGain', requires: [req('tal-com-01', 2)] },
  'tal-com-03': { maxRank: 4, kind: 'respecDiscount', perRank: 0.1, requires: [req('tal-com-01', 2)] },
  'tal-com-04': { maxRank: 3, kind: 'backpack', requires: [req('tal-com-02', 2)] },
  'tal-com-05': { maxRank: 1, kind: 'respecOne', requires: [req('tal-com-03', 2)] },
  'tal-com-06': { maxRank: 3, kind: 'missionBits', requires: [req('tal-com-02', 1)] },
  'tal-com-07': { maxRank: 1, kind: 'weeklyDiscount', requires: [req('tal-com-04', 1), req('tal-com-05', 1)] },
};

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** @param {unknown} bondLevel */
export function talentPointsFor(bondLevel) {
  const lvl = typeof bondLevel === 'number' && Number.isFinite(bondLevel) ? Math.max(1, Math.floor(bondLevel)) : 1;
  return Math.min(TALENT_POINTS_MAX, lvl);
}

/** @param {{ id: string, rank: number }} r @param {Record<string, number>} ranks */
const reqOk = (r, ranks) => (ranks[r.id] ?? 0) >= r.rank;

/**
 * Pre-requisitos do no atendidos? `requires` = TODOS; `requiresAny` = pelo menos UM (espelha `prereqsMet`).
 * @param {string} id @param {Record<string, number>} ranks
 */
function prereqsMet(id, ranks) {
  const n = PICKABLE[id];
  if (n.requires && !n.requires.every((r) => reqOk(r, ranks))) return false;
  if (n.requiresAny && !n.requiresAny.some((r) => reqOk(r, ranks))) return false;
  return true;
}

/** Dados bem formados (ids pegaveis, grau maximo, pontos do Vinculo), sem olhar pre-requisito. @param {unknown} raw @param {unknown} bondLevel @returns {raw is string[]} */
function isWellFormed(raw, bondLevel) {
  if (!Array.isArray(raw)) return false;
  if (raw.length > talentPointsFor(bondLevel)) return false;
  /** @type {Record<string, number>} */
  const counts = Object.create(null);
  for (const id of raw) {
    if (typeof id !== 'string' || !has(PICKABLE, id)) return false;
    counts[id] = (counts[id] ?? 0) + 1;
    if (counts[id] > PICKABLE[id].maxRank) return false;
  }
  return true;
}

/**
 * Reproduz a compra na ordem em que os pre-requisitos vao sendo atendidos (ponto fixo): o que cabe e o que sobra.
 * @param {string[]} picks
 */
function replay(picks) {
  /** @type {string[]} */ const kept = [];
  /** @type {Record<string, number>} */ const ranks = Object.create(null);
  let rest = [...picks];
  for (let moved = true; moved && rest.length > 0;) {
    moved = false;
    /** @type {string[]} */ const next = [];
    for (const id of rest) {
      if (prereqsMet(id, ranks)) { kept.push(id); ranks[id] = (ranks[id] ?? 0) + 1; moved = true; } else next.push(id);
    }
    rest = next;
  }
  return { kept, dropped: rest };
}

/** Vetor VALIDO: bem formado E com todos os pre-requisitos atendidos (§2.37). @param {unknown} raw @param {unknown} bondLevel @returns {raw is string[]} */
export function isValidPicks(raw, bondLevel) {
  return isWellFormed(raw, bondLevel) && replay(raw).dropped.length === 0;
}

/**
 * Malformado (id inventado, grau/pontos a mais, tipo errado) e DESCARTADO (`[]`), nunca corrigido. Quem so viola PRE-REQUISITO
 * (save de antes da arvore com ramos) fica com os graus que se conseguem comprar e perde os outros (os pontos voltam, sem cobrar respec).
 * @param {unknown} raw @param {unknown} bondLevel @returns {string[]}
 */
export function sanitizeTalentPicks(raw, bondLevel) {
  if (!isWellFormed(raw, bondLevel)) return [];
  const { kept, dropped } = replay(raw);
  return dropped.length === 0 ? [...raw] : kept;
}

/**
 * Parcela do TALENTO no canal de bonus (fracao), para o escopo. Invalido para o Vinculo = 0.
 * Quem soma com as outras fontes e corta nos 5% e `combinedBonus` (`_combate.js`).
 * @param {unknown} picks @param {unknown} bondLevel @param {'pvp' | 'pve' | 'nightmare'} scope
 */
export function talentBonus(picks, bondLevel, scope) {
  if (!isValidPicks(picks, bondLevel)) return 0;
  let sum = 0;
  for (const id of picks) {
    const n = PICKABLE[id];
    if (n.kind === 'combatBonus' && (n.scope === scope || (scope === 'nightmare' && n.scope === 'pve'))) sum += n.perRank ?? 0;
  }
  return Math.min(sum, COMBAT_BONUS_CAP);
}

/**
 * PvP por ATRIBUTO (PR7b): a parcela do talento em cada canal (fracoes). Invalido para o Vinculo = 0 nos tres.
 * Quem soma e corta nos 5% (a SOMA dos tres canais) e `combinedAttrBonus` (`_combate.js`).
 * @param {unknown} picks @param {unknown} bondLevel @returns {{ atk: number, def: number, spd: number }}
 */
export function talentAttrBonus(picks, bondLevel) {
  const out = { atk: 0, def: 0, spd: 0 };
  if (!isValidPicks(picks, bondLevel)) return out;
  for (const id of picks) {
    const n = PICKABLE[id];
    if (n.kind === 'combatBonus' && n.scope === 'pvp' && n.attr) out[n.attr] += n.perRank ?? 0;
    if (n.kind === 'allAttr') { out.atk += n.perRank ?? 0; out.def += n.perRank ?? 0; out.spd += n.perRank ?? 0; }
  }
  return out;
}

/** @param {unknown} picks @param {unknown} bondLevel @param {string} kind @param {number} max */
function sumKind(picks, bondLevel, kind, max) {
  if (!isValidPicks(picks, bondLevel)) return 0;
  let sum = 0;
  for (const id of /** @type {string[]} */ (picks)) if (PICKABLE[id].kind === kind) sum += PICKABLE[id].perRank ?? 0;
  return Math.min(max, sum);
}
/** `tal-pvp-04`: energia (de 100) com que o Duelo comeca. @param {unknown} picks @param {unknown} bondLevel */
export const talentStartEnergy = (picks, bondLevel) => sumKind(picks, bondLevel, 'startEnergy', START_ENERGY_MAX);
/** `tal-pvp-06`: fracao do dano contínuo recebido que nao chega. @param {unknown} picks @param {unknown} bondLevel */
export const talentDotResist = (picks, bondLevel) => sumKind(picks, bondLevel, 'dotResist', DOT_RESIST_MAX);
/** `tal-pve-03`. @param {unknown} picks @param {unknown} bondLevel */
export const talentHealBoost = (picks, bondLevel) => sumKind(picks, bondLevel, 'healBoost', HEAL_BOOST_MAX);
/** `tal-pve-04`. @param {unknown} picks @param {unknown} bondLevel */
export const talentRiftBits = (picks, bondLevel) => sumKind(picks, bondLevel, 'riftBits', RIFT_BITS_MAX);
/** `tal-pve-07`. @param {unknown} picks @param {unknown} bondLevel */
export const talentStartShield = (picks, bondLevel) => sumKind(picks, bondLevel, 'startShield', START_SHIELD_MAX);

/**
 * Multiplicador do rendimento da torcida do Duelo (1 sem o no; limitado por `CHEER_SCALE_MAX`). Invalido = 1.
 * @param {unknown} picks @param {unknown} bondLevel
 */
export function talentCheerScale(picks, bondLevel) {
  if (!isValidPicks(picks, bondLevel)) return 1;
  let sum = 0;
  for (const id of /** @type {string[]} */ (picks)) if (PICKABLE[id].kind === 'cheerBoost') sum += PICKABLE[id].perRank ?? 0;
  return cleanCheerScale(1 + sum);
}
