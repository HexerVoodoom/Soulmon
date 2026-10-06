/**
 * Combate v3 / PR7 — a árvore de talentos do USUÁRIO (o Vínculo é o level dele).
 *
 * Dono único. 1 ponto por Vínculo (`talentPointsFor`), gasto numa árvore de três caminhos (PvP, PvE,
 * Comércio) que NUNCA dá para completar: o custo dos nós pegáveis passa de `TALENT_POINTS_MAX`
 * (teste lê os dois daqui). Persistido SÓ `talentPicks: string[]` (um id por grau comprado); o
 * resto é derivado. Servidor espelha em `functions/api/_talents.js` (`talents.parity.test.js`).
 *
 * Regras que não se negociam:
 *  · O que o talento dá em COMBATE entra pelo canal único `combate/bonus.ts` (`combinedBonus`), com
 *    TETO ÚNICO de 5% somando talento+equipamento+Comércio+Renascimento. Aqui só se calcula a
 *    parcela do talento (`talentBonus`); quem soma e corta é `combinedBonus`.
 *  · O Comércio mexe só em preço e ganho de moeda GANHA, nunca em % de combate.
 *  · Dinheiro real nunca compra ponto, grau nem o %. Respec é SEMPRE pago, em moeda ganha (Bits).
 *  · Vetor inválido é DESCARTADO (volta a `[]`), nunca "corrigido": quem forja não escolhe o que sobra.
 *  · Os talentos sobrevivem à degeneração do Soulmon (o Vínculo nunca desce).
 *
 * PR7b (§2.25, decisões do dono): o canal de PvP é POR ATRIBUTO (`attr`: ATK/DEF/SPD distintos), com o MESMO teto único
 * de 5% somando os três canais e as quatro fontes (`combinedAttrBonus`). `tal-pvp-05` e `tal-com-05` foram REDESENHADOS dentro
 * das linhas vermelhas: o primeiro é rendimento da TORCIDA no Duelo (ação do jogador, só o teu lado, dentro de
 * `CHEER_SCALE_MAX`), o segundo é refazer UM ponto por vez (moeda GANHA, conveniência, nada de combate).
 *
 * Módulo PURO: sem React, sem relógio, sem localStorage. Os TEXTOS dos nós moram em `talentCopy.ts` (só a tela
 * os lê, atrás do `lazy`): este arquivo entra no chunk de entrada pelo `useTalentBonus`, e o orçamento de bytes pesa.
 */

import { cleanCheerScale } from './combate/specials';
import type { AttrBonus } from './combate/bonus';

export type TalentPath = 'pvp' | 'pve' | 'comercio';
export type AttrKey = 'atk' | 'def' | 'spd';

export type TalentEffect =
  /** Soma `perRank × grau` ao canal de bônus de combate do `scope`. Só PvP no Duelo; só PvE nas lutas da fenda. */
  | { readonly kind: 'combatBonus'; readonly scope: 'pvp' | 'pve'; readonly perRank: number; /** PvP: o canal (ATK/DEF/SPD). */ readonly attr?: AttrKey }
  /** Soma `perRank × grau` ao rendimento da torcida do Duelo (1 + soma, até `CHEER_SCALE_MAX`). Só o seu lado, só quando você torce. */
  | { readonly kind: 'cheerBoost'; readonly perRank: number }
  /** Comércio: refazer UM ponto (o que você escolher) em vez da árvore toda. Só moeda GANHA (Bits). */
  | { readonly kind: 'respecOne' }
  /** Comércio (PR8): equipamento mais barato em Bits (`equipment.ts › equipPriceDiscount`, só preço). */
  | { readonly kind: 'equipPrice' }
  /** Comércio (PR8): mais fragmentos por prêmio (`equipment.ts › fragmentGain`, dentro do +25%). */
  | { readonly kind: 'fragmentGain' }
  /** Comércio (PR12b): +1 espaço por grau na MOCHILA do equipamento (`equipment.ts › backpackCapacity`). Capacidade, não combate. */
  | { readonly kind: 'backpack' }
  /** Comércio (PR12b): +% por grau nos Bits do dia completo (`equipment.ts › missionBitsGain`). Sem fonte nova; dentro do +25%. */
  | { readonly kind: 'missionBits' }
  /** Comércio (PR12b): desconto semanal determinístico em UM item do equipamento (`equipment.ts › weeklyDiscountItem`). */
  | { readonly kind: 'weeklyDiscount' }
  /** Reduz o custo do respec em `perRank × grau` (Comércio: só moeda). */
  | { readonly kind: 'respecDiscount'; readonly perRank: number }
  /** O efeito depende de um gancho que ainda não existe (motor/PR8). O nó aparece, mas não se compra. */
  | { readonly kind: 'pendente' };

export interface TalentNode {
  readonly id: string;
  readonly path: TalentPath;
  /** Só visual (fileira da árvore). */
  readonly tier: 1 | 2 | 3;
  readonly maxRank: number;
  readonly effect: TalentEffect;
}

/** Teto de pontos de talento: o Vínculo acima disto não rende ponto novo (a árvore tem de ficar maior que isto). */
export const TALENT_POINTS_MAX = 20;

/** Passo de cada grau dos nós de combate (fração; 0,004 = 0,4%). Os graus de um caminho cabem nos 5%. */
export const PVP_STEP = 0.004;
export const PVE_STEP = 0.006;
export const RESPEC_STEP = 0.1;
/** Rendimento da torcida no Duelo por grau de `tal-pvp-05` (3 graus = +15% = `CHEER_SCALE_MAX`). */
export const CHEER_STEP = 0.05;


export const TALENT_TREE: readonly TalentNode[] = [
  // ── PvP ──────────────────────────────────────────────────────────────────
  { id: 'tal-pvp-01', path: 'pvp', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pvp', perRank: PVP_STEP, attr: 'atk' } },
  { id: 'tal-pvp-02', path: 'pvp', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pvp', perRank: PVP_STEP, attr: 'def' } },
  { id: 'tal-pvp-03', path: 'pvp', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pvp', perRank: PVP_STEP, attr: 'spd' } },
  { id: 'tal-pvp-04', path: 'pvp', tier: 2, maxRank: 3, effect: { kind: 'pendente' } },
  { id: 'tal-pvp-05', path: 'pvp', tier: 2, maxRank: 3, effect: { kind: 'cheerBoost', perRank: CHEER_STEP } },
  { id: 'tal-pvp-06', path: 'pvp', tier: 2, maxRank: 3, effect: { kind: 'pendente' } },
  { id: 'tal-pvp-07', path: 'pvp', tier: 3, maxRank: 1, effect: { kind: 'pendente' } },
  // ── PvE ──────────────────────────────────────────────────────────────────
  { id: 'tal-pve-01', path: 'pve', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pve', perRank: PVE_STEP } },
  { id: 'tal-pve-02', path: 'pve', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pve', perRank: PVE_STEP } },
  { id: 'tal-pve-03', path: 'pve', tier: 2, maxRank: 3, effect: { kind: 'pendente' } },
  { id: 'tal-pve-04', path: 'pve', tier: 2, maxRank: 3, effect: { kind: 'pendente' } },
  { id: 'tal-pve-05', path: 'pve', tier: 2, maxRank: 3, effect: { kind: 'pendente' } },
  { id: 'tal-pve-06', path: 'pve', tier: 2, maxRank: 3, effect: { kind: 'pendente' } },
  { id: 'tal-pve-07', path: 'pve', tier: 3, maxRank: 1, effect: { kind: 'pendente' } },
  // ── Comércio (só preço e ganho de moeda GANHA; nunca % de combate) ──────
  { id: 'tal-com-01', path: 'comercio', tier: 1, maxRank: 3, effect: { kind: 'equipPrice' } },
  { id: 'tal-com-02', path: 'comercio', tier: 1, maxRank: 3, effect: { kind: 'fragmentGain' } },
  { id: 'tal-com-03', path: 'comercio', tier: 1, maxRank: 4, effect: { kind: 'respecDiscount', perRank: RESPEC_STEP } },
  { id: 'tal-com-04', path: 'comercio', tier: 2, maxRank: 3, effect: { kind: 'backpack' } },
  { id: 'tal-com-05', path: 'comercio', tier: 2, maxRank: 1, effect: { kind: 'respecOne' } },
  { id: 'tal-com-06', path: 'comercio', tier: 2, maxRank: 3, effect: { kind: 'missionBits' } },
  { id: 'tal-com-07', path: 'comercio', tier: 3, maxRank: 1, effect: { kind: 'weeklyDiscount' } },
];

export const TALENT_BY_ID: ReadonlyMap<string, TalentNode> = new Map(TALENT_TREE.map((n) => [n.id, n]));

/** Só os nós com efeito ligado se compram. */
export function isPickable(node: TalentNode): boolean {
  return node.effect.kind !== 'pendente';
}

/** O custo (em pontos) de tudo o que dá para comprar hoje: grau a grau, 1 ponto cada. */
export function pickableTreeCost(): number {
  return TALENT_TREE.filter(isPickable).reduce((s, n) => s + n.maxRank, 0);
}

/** O custo de TODA a árvore (nós ainda sem efeito incluídos). */
export function fullTreeCost(): number {
  return TALENT_TREE.reduce((s, n) => s + n.maxRank, 0);
}

function levelOf(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
}

/** 1 ponto por Vínculo, até `TALENT_POINTS_MAX`. */
export function talentPointsFor(bondLevel: unknown): number {
  return Math.min(TALENT_POINTS_MAX, levelOf(bondLevel));
}

/** Graus comprados por nó. */
export function ranksOf(picks: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of picks) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

/**
 * O vetor é VÁLIDO para este Vínculo? Todos são strings de nós pegáveis, nenhum passa do grau
 * máximo e o total não passa dos pontos do level.
 */
export function isValidPicks(raw: unknown, bondLevel: unknown): raw is string[] {
  if (!Array.isArray(raw)) return false;
  if (raw.length > talentPointsFor(bondLevel)) return false;
  const counts = new Map<string, number>();
  for (const id of raw) {
    if (typeof id !== 'string') return false;
    const node = TALENT_BY_ID.get(id);
    if (!node || !isPickable(node)) return false;
    const c = (counts.get(id) ?? 0) + 1;
    if (c > node.maxRank) return false;
    counts.set(id, c);
  }
  return true;
}

/** Vetor inválido é DESCARTADO (`[]`), nunca corrigido. */
export function sanitizeTalentPicks(raw: unknown, bondLevel: unknown): string[] {
  return isValidPicks(raw, bondLevel) ? [...raw] : [];
}

export function pointsLeft(picks: readonly string[], bondLevel: unknown): number {
  return Math.max(0, talentPointsFor(bondLevel) - picks.length);
}

/** Dá para comprar +1 grau de `id`? */
export function canPick(picks: readonly string[], id: string, bondLevel: unknown): boolean {
  return isValidPicks([...picks, id], bondLevel);
}

/** +1 grau de `id`, ou o MESMO vetor se não der (nunca lança). */
export function pickTalent(picks: readonly string[], id: string, bondLevel: unknown): readonly string[] {
  return canPick(picks, id, bondLevel) ? [...picks, id] : picks;
}

/**
 * A parcela do TALENTO no canal de bônus de combate, para o `scope`. Vetor inválido para o Vínculo
 * vale 0. É uma FRAÇÃO (0,05 = 5%). Quem a soma com equipamento/Comércio/Renascimento e corta nos 5%
 * é `combate/bonus.ts › combinedBonus`: nenhum consumidor soma por conta própria.
 */
export function talentBonus(picks: unknown, bondLevel: unknown, scope: 'pvp' | 'pve'): number {
  if (!isValidPicks(picks, bondLevel)) return 0;
  let sum = 0;
  for (const [id, rank] of ranksOf(picks)) {
    const e = TALENT_BY_ID.get(id)!.effect;
    if (e.kind === 'combatBonus' && e.scope === scope) sum += e.perRank * rank;
  }
  return sum;
}

/**
 * PvP por ATRIBUTO (PR7b): a parcela do talento em cada canal (ATK = dano dado, DEF = dano recebido, SPD = ritmo). FRAÇÕES.
 * Inválido para o Vínculo vale 0 nos três. Quem soma com as outras fontes e corta nos 5% (a SOMA dos três canais) é
 * `combate/bonus.ts › combinedAttrBonus`.
 */
export function talentAttrBonus(picks: unknown, bondLevel: unknown): AttrBonus {
  const out = { atk: 0, def: 0, spd: 0 };
  if (!isValidPicks(picks, bondLevel)) return out;
  for (const [id, rank] of ranksOf(picks)) {
    const e = TALENT_BY_ID.get(id)!.effect;
    if (e.kind === 'combatBonus' && e.scope === 'pvp' && e.attr) out[e.attr] += e.perRank * rank;
  }
  return out;
}

/** O multiplicador do rendimento da torcida no Duelo (1 sem o nó; até `CHEER_SCALE_MAX`). Inválido = 1. */
export function talentCheerScale(picks: unknown, bondLevel: unknown): number {
  if (!isValidPicks(picks, bondLevel)) return 1;
  let sum = 0;
  for (const [id, rank] of ranksOf(picks)) {
    const e = TALENT_BY_ID.get(id)!.effect;
    if (e.kind === 'cheerBoost') sum += e.perRank * rank;
  }
  return cleanCheerScale(1 + sum);
}

// ── Respec: SEMPRE pago, em moeda GANHA (Bits) ──────────────────────────────

/** Bits por ponto gasto (default da squad; o dono não fixou o valor). */
export const RESPEC_COST_PER_POINT = 25;

/** Desconto do Comércio (fração em [0, 0,6]); só quem tem o nó. */
export function respecDiscount(picks: readonly string[]): number {
  let d = 0;
  for (const [id, rank] of ranksOf(picks)) {
    const e = TALENT_BY_ID.get(id)?.effect;
    if (e?.kind === 'respecDiscount') d += e.perRank * rank;
  }
  return Math.min(0.6, d);
}

/** Custo em Bits de refazer a árvore. 0 só quando não há nada a refazer (nunca de graça com picks). */
export function respecCost(picks: readonly string[]): number {
  if (picks.length === 0) return 0;
  return Math.max(1, Math.ceil(picks.length * RESPEC_COST_PER_POINT * (1 - respecDiscount(picks))));
}

export interface RespecState {
  talentPicks?: string[];
  gamePoints: number;
}

export type RespecResult<T> = { ok: true; state: T; cost: number } | { ok: false; reason: 'nothing' | 'no-bits'; cost: number };

/** Refaz a árvore pagando em Bits. Sem Bits suficientes, nada muda. Os Bits nunca ficam negativos. */
export function applyRespec<T extends RespecState>(state: T): RespecResult<T> {
  const picks = Array.isArray(state.talentPicks) ? state.talentPicks : [];
  const cost = respecCost(picks);
  if (picks.length === 0) return { ok: false, reason: 'nothing', cost: 0 };
  const bits = typeof state.gamePoints === 'number' && Number.isFinite(state.gamePoints) ? state.gamePoints : 0;
  if (bits < cost) return { ok: false, reason: 'no-bits', cost };
  return { ok: true, cost, state: { ...state, talentPicks: [], gamePoints: bits - cost } };
}

// ── Respec de UM ponto (`tal-com-05`, Comércio): conveniência paga em moeda GANHA ───────────────

/** O jogador tem o nó que deixa refazer um ponto só? */
export function canRespecOne(picks: readonly string[]): boolean {
  return picks.includes('tal-com-05');
}

/** Bits para refazer UM ponto: o preço de um ponto do respec, com a mesma ampulheta. Nunca 0 (e nunca de graça). */
export function respecOneCost(picks: readonly string[]): number {
  return Math.max(1, Math.ceil(RESPEC_COST_PER_POINT * (1 - respecDiscount(picks))));
}

export type RespecOneResult<T> =
  | { ok: true; state: T; cost: number }
  | { ok: false; reason: 'locked' | 'not-picked' | 'no-bits'; cost: number };

/**
 * Tira o ÚLTIMO grau de `id` pagando `respecOneCost` em Bits. Sem o nó `tal-com-05`, sem o grau ou sem Bits suficientes nada
 * muda. O custo vem dos picks ANTES da retirada (a ampulheta vale até o fim da conta). Bits nunca ficam negativos.
 */
export function applyRespecOne<T extends RespecState>(state: T, id: string): RespecOneResult<T> {
  const picks = Array.isArray(state.talentPicks) ? state.talentPicks : [];
  const cost = respecOneCost(picks);
  if (!canRespecOne(picks)) return { ok: false, reason: 'locked', cost };
  const at = picks.lastIndexOf(id);
  if (at < 0) return { ok: false, reason: 'not-picked', cost };
  const bits = typeof state.gamePoints === 'number' && Number.isFinite(state.gamePoints) ? state.gamePoints : 0;
  if (bits < cost) return { ok: false, reason: 'no-bits', cost };
  return { ok: true, cost, state: { ...state, talentPicks: picks.filter((_, k) => k !== at), gamePoints: bits - cost } };
}
