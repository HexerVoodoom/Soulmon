/**
 * O SOULSMITH — equipamento por MISSÃO e APRIMORAMENTO (decisão do dono, 07/10/2026). Dono único das tabelas e do bônus por nível;
 * espelho no servidor: `functions/api/_forge.js`, travado por `forge.parity.test.js`.
 *
 * A regra (o que MUDOU desde a compra por Bits, REGISTRO §24 nova linha):
 *  · NÍVEL 1 vem de MISSÃO: cada peça tem UM prédio de origem (`FORGE_PIECES[].building`) e é concedida ao resgatar a missão
 *    daquele prédio pela 1ª vez — o resgate já exige o prédio aberto por Vínculo (`buildingQuests.ts › claimBuildingQuest`).
 *    Escolhido o resgate (e não "cumprir a missão do dia") porque é o MESMO ponto único que já paga o material: um gatilho só.
 *  · NÍVEIS 2–5 vêm do APRIMORAMENTO no Soulsmith, pagos com MATERIAIS (os de prédio, `buildingQuests.materials`). Cada nível pede
 *    1–2 materiais e quantidades crescentes (`UPGRADE_COST`); cada nível exige um Vínculo mínimo (`LEVEL_MIN_BOND`).
 *  · A cada aprimoramento a pessoa ESCOLHE entre 2 opções (A = atributo do slot, B = o atributo vizinho, `ALT_ATTR`). A escolha é
 *    REFAZÍVEL pagando Bits GANHOS (nunca Créditos, nunca `paidLeft`) ou fragmentos da Masmorra; o material não volta.
 *  · SEM SORTEIO: custos, opções e valores são tabela. NADA de dinheiro real nem Créditos entra aqui.
 *  · O TETO é um só (`COMBAT_BONUS_CAP`, 5%, `combate/bonus.ts`): este módulo só devolve a parcela da peça POR ATRIBUTO e quem
 *    soma com talento e corta é `combinedAttrBonus`. Uma peça no nível 5 vale no máximo `PIECE_MAX_PCT` (1,5% = 30% do teto);
 *    três peças equipadas, 4,5%: o equipamento sozinho nunca estoura o teto, e somado ao talento o canal único reduz o conjunto.
 *  · MIGRAÇÃO sem confisco: quem JÁ comprou uma peça (tiers 1/2/3, 0,5/1,0/1,5%) a mantém, DERIVADA na leitura — peça possuída
 *    sem registro em `forge.levels` vale o nível `LEGACY_LEVEL` do tier (2/4/5 = 0,5/1,1/1,5%, nunca menos que o que valia) com a
 *    opção A em todos os níveis. Nada é gravado nem reembolsado; ao aprimorar, o registro nasce a partir daquele nível.
 *
 * Estado persistido: UM objeto, `GameState.forge = { levels, picks }` (níveis por peça 1..5 e as escolhas dos níveis 2..N).
 * Módulo FOLHA e PURO (só tipos importados): sem React, sem relógio, sem localStorage. Os textos moram em `forgeCopy.ts`.
 */

import type { EquipSlot, EquipAttr } from './equipment';
import type { MaterialId } from './buildingQuests';
import type { BuildingId } from './gates';

export type ForgeChoice = 'a' | 'b';
export type ForgeAttrBonus = { atk: number; def: number; spd: number };

export const FORGE_MAX_LEVEL = 5;

/** O ganho de cada nível (fração; índice = nível − 1). O nível 1 é fixo (sem escolha); 2..5 vão na opção escolhida. Soma 1,5%. */
export const LEVEL_PCT: readonly number[] = [0.003, 0.002, 0.003, 0.003, 0.004];
/** Máximo de UMA peça no nível 5: 30% do teto de 5% (três peças = 4,5%). */
export const PIECE_MAX_PCT = 0.015;

/** O atributo do slot (opção A) e o vizinho (opção B). */
export const PRIMARY_ATTR: Readonly<Record<EquipSlot, EquipAttr>> = { nucleo: 'atk', carapaca: 'def', rastro: 'spd' };
export const ALT_ATTR: Readonly<Record<EquipSlot, EquipAttr>> = { nucleo: 'def', carapaca: 'spd', rastro: 'atk' };

/** Vínculo mínimo para aprimorar PARA o nível (índice = nível; 0/1 não se aprimoram). */
export const LEVEL_MIN_BOND: readonly number[] = [0, 0, 2, 3, 4, 5];

/** Quanto de cada um dos DOIS materiais da peça pede o aprimoramento PARA o nível (2..5): [material 1, material 2]. */
export const UPGRADE_COST: Readonly<Record<2 | 3 | 4 | 5, readonly [number, number]>> = { 2: [1, 0], 3: [2, 1], 4: [3, 2], 5: [4, 3] };

/** Refazer a escolha de UM nível: Bits GANHOS (com o desconto do Comércio) ou fragmentos. Material não volta. */
export const REDO_BITS = 150;
export const REDO_FRAGMENTS = 3;

export interface ForgePiece {
  readonly id: string;
  readonly slot: EquipSlot;
  readonly tier: 1 | 2 | 3;
  /** O prédio cuja missão concede a peça (nível 1). */
  readonly building: BuildingId;
  /** [material do prédio de origem, material de apoio] — o `UPGRADE_COST` fala nesta ordem. */
  readonly mats: readonly [MaterialId, MaterialId];
}

/** Item → prédio de origem → materiais. Os ids são os do catálogo antigo (saves antigos continuam válidos). */
export const FORGE_PIECES: readonly ForgePiece[] = [
  { id: 'eq-nucleo-t1', slot: 'nucleo', tier: 1, building: 'exploracao.masmorra', mats: ['ore', 'gear'] },
  { id: 'eq-nucleo-t2', slot: 'nucleo', tier: 2, building: 'arena.duelo', mats: ['fang', 'ore'] },
  { id: 'eq-nucleo-t3', slot: 'nucleo', tier: 3, building: 'arena.torneio', mats: ['laurel', 'fang'] },
  { id: 'eq-carapaca-t1', slot: 'carapaca', tier: 1, building: 'exploracao.passeio', mats: ['pebble', 'moss'] },
  { id: 'eq-carapaca-t2', slot: 'carapaca', tier: 2, building: 'laboratorio.pet', mats: ['down', 'pebble'] },
  { id: 'eq-carapaca-t3', slot: 'carapaca', tier: 3, building: 'hall.guilda', mats: ['crest', 'down'] },
  { id: 'eq-rastro-t1', slot: 'rastro', tier: 1, building: 'jogos.salao', mats: ['spark', 'moss'] },
  { id: 'eq-rastro-t2', slot: 'rastro', tier: 2, building: 'exploracao.oficina', mats: ['gear', 'spark'] },
  { id: 'eq-rastro-t3', slot: 'rastro', tier: 3, building: 'arena.feira', mats: ['ribbon', 'gear'] },
];

export const PIECE_BY_ID: ReadonlyMap<string, ForgePiece> = new Map(FORGE_PIECES.map((p) => [p.id, p]));
export const PIECE_BY_BUILDING: ReadonlyMap<string, ForgePiece> = new Map(FORGE_PIECES.map((p) => [p.building, p]));

/** O nível equivalente de quem JÁ possuía a peça do tier (migração sem confisco; ver o cabeçalho). */
export const LEGACY_LEVEL: readonly [2, 4, 5] = [2, 4, 5];

export interface ForgeState {
  /** Nível 1..5 por peça (só as que ganharam registro: concedidas por missão ou já aprimoradas). */
  readonly levels: Readonly<Record<string, number>>;
  /** As escolhas dos níveis 2..N, na ordem (`picks[id][0]` é a do nível 2). Faltando = opção A. */
  readonly picks: Readonly<Record<string, readonly ForgeChoice[]>>;
}

export const EMPTY_FORGE: ForgeState = { levels: {}, picks: {} };

const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Higieniza o save (também o que vem da nuvem): lista fechada de peças, nível inteiro 1..5, escolhas só 'a'|'b' e no máximo nível−1. */
export function sanitizeForge(raw: unknown): ForgeState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY_FORGE;
  const r = raw as Record<string, unknown>;
  const lv = r.levels && typeof r.levels === 'object' && !Array.isArray(r.levels) ? (r.levels as Record<string, unknown>) : {};
  const pk = r.picks && typeof r.picks === 'object' && !Array.isArray(r.picks) ? (r.picks as Record<string, unknown>) : {};
  const levels: Record<string, number> = {};
  const picks: Record<string, ForgeChoice[]> = {};
  for (const p of FORGE_PIECES) {
    const v = own(lv, p.id) ? lv[p.id] : undefined;
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const level = Math.min(FORGE_MAX_LEVEL, Math.max(1, Math.floor(v)));
    levels[p.id] = level;
    const arr = own(pk, p.id) && Array.isArray(pk[p.id]) ? (pk[p.id] as unknown[]) : [];
    const list: ForgeChoice[] = [];
    for (let i = 0; i < level - 1; i++) list.push(arr[i] === 'b' ? 'b' : 'a');
    if (list.includes('b')) picks[p.id] = list;
  }
  return Object.keys(levels).length === 0 ? EMPTY_FORGE : { levels, picks };
}

/** O nível da peça: 0 se não é possuída; o registro, ou o nível equivalente do tier (peça comprada antes do Soulsmith). */
export function pieceLevel(id: string, forge: unknown, owned: boolean): number {
  const piece = PIECE_BY_ID.get(id);
  if (!piece || !owned) return 0;
  const f = sanitizeForge(forge);
  return own(f.levels, id) ? f.levels[id] : LEGACY_LEVEL[piece.tier - 1];
}

/** As escolhas dos níveis 2..`level` (completa com A o que não está registrado). */
export function pieceChoices(id: string, level: number, forge: unknown): ForgeChoice[] {
  const f = sanitizeForge(forge);
  const saved = own(f.picks, id) ? f.picks[id] : [];
  return Array.from({ length: Math.max(0, level - 1) }, (_, i) => (saved[i] === 'b' ? 'b' : 'a'));
}

/** A parcela da peça POR ATRIBUTO no nível/escolhas dados (frações). Quem soma com talento e corta nos 5% é o canal único. */
export function pieceBonus(id: string, level: number, choices: readonly ForgeChoice[]): ForgeAttrBonus {
  const out = { atk: 0, def: 0, spd: 0 };
  const piece = PIECE_BY_ID.get(id);
  if (!piece || level < 1) return out;
  const main = PRIMARY_ATTR[piece.slot];
  out[main] += LEVEL_PCT[0];
  for (let k = 2; k <= Math.min(FORGE_MAX_LEVEL, level); k++) {
    out[choices[k - 2] === 'b' ? ALT_ATTR[piece.slot] : main] += LEVEL_PCT[k - 1];
  }
  return out;
}

/** O bônus de uma peça POSSUÍDA, lendo nível e escolhas do `forge`. */
export function ownedPieceBonus(id: string, forge: unknown): ForgeAttrBonus {
  const level = pieceLevel(id, forge, true);
  return pieceBonus(id, level, pieceChoices(id, level, forge));
}
