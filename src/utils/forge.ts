/**
 * O SOULSMITH — equipamento por MISSÃO e APRIMORAMENTO (decisão do dono, 07/10/2026). Dono único das tabelas e do bônus por nível;
 * espelho no servidor: `functions/api/_forge.js`, travado por `forge.parity.test.js`.
 *
 * A regra (o que MUDOU desde a compra por Bits, REGISTRO §24 nova linha):
 *  · NÍVEL 1 vem de MISSÃO: cada peça tem UM prédio de origem (`FORGE_PIECES[].building`) e é concedida ao resgatar a missão
 *    daquele prédio pela 1ª vez — o resgate já exige o prédio aberto por Vínculo (`buildingQuests.ts › claimBuildingQuest`).
 *    Escolhido o resgate (e não "cumprir a missão do dia") porque é o MESMO ponto único que já paga o material: um gatilho só.
 *  · NÍVEIS 2–15 vêm do APRIMORAMENTO no Soulsmith, pagos com MATERIAIS (os de prédio, `buildingQuests.materials`). Cada nível pede
 *    1–2 materiais e quantidades crescentes (`UPGRADE_COST`); cada nível exige um Vínculo mínimo (`LEVEL_MIN_BOND`).
 *    ⚠️ 11/10/2026 (pedido do dono: "está fácil de upar… tem de levar tempo para colocar tudo no máximo; mesmo depois do nível ultra
 *    o jogador ainda não terá todos os itens no máximo"): eram 5 níveis (5–9 dias de material), hoje são 15, cada um valendo 0,1% —
 *    o MESMO teto por peça (1,5%), em passos menores — com custo crescente. Tempo até o máximo, simulado em `forge.tempo.test.ts` e
 *    documentado em `docs/BALANCO-SOULSMITH.md`: passa do Ultra (59 dias perfeitos) com folga, para quem joga todo dia.
 *  · A cada aprimoramento a pessoa ESCOLHE entre 2 opções IGUAIS (o atributo do slot e o vizinho, `ALT_ATTR`; mesmo valor, muda onde a
 *    peça ajuda). A escolha é REFAZÍVEL pagando Bits GANHOS (nunca Créditos, nunca `paidLeft`) ou fragmentos da Masmorra; o material não volta.
 *  · SEM SORTEIO: custos, opções e valores são tabela. NADA de dinheiro real nem Créditos entra aqui.
 *  · O TETO é um só (`COMBAT_BONUS_CAP`, 5%, `combate/bonus.ts`): este módulo só devolve a parcela da peça POR ATRIBUTO e quem
 *    soma com talento e corta é `combinedAttrBonus`. Uma peça no nível máximo vale no máximo `PIECE_MAX_PCT` (1,5% = 30% do teto);
 *    três peças equipadas, 4,5%: o equipamento sozinho nunca estoura o teto, e somado ao talento o canal único reduz o conjunto.
 *  · MIGRAÇÃO sem confisco: quem JÁ comprou uma peça (tiers 1/2/3, 0,5/1,0/1,5%) a mantém, DERIVADA na leitura — peça possuída
 *    sem registro em `forge.levels` vale o nível `LEGACY_LEVEL` do tier (5/11/15 = 0,5/1,1/1,5%, nunca menos que o que valia) com a
 *    opção A em todos os níveis. Nada é gravado nem reembolsado; ao aprimorar, o registro nasce a partir daquele nível.
 *  · MIGRAÇÃO do esquema de 5 níveis (11/10/2026): um `forge` SEM `v: 2` é o esquema antigo e é convertido na leitura (`sanitizeForge`)
 *    para o nível novo de MESMO bônus (`OLD_LEVEL_TO_NEW`: 1→3, 2→5, 3→8, 4→11, 5→15 = 0,3/0,5/0,8/1,1/1,5%), com a escolha de cada
 *    nível antigo repetida nos níveis novos que ele cobre — atributo por atributo, o bônus de antes é exatamente o de depois.
 *
 * Estado persistido: UM objeto, `GameState.forge = { v: 2, levels, picks }` (níveis por peça 1..15 e as escolhas dos níveis 2..N).
 * Módulo FOLHA e PURO (só tipos importados): sem React, sem relógio, sem localStorage. Os textos moram em `forgeCopy.ts`.
 */

import type { EquipSlot, EquipAttr } from './equipment';
import type { MaterialId } from './buildingQuests';
import type { BuildingId } from './gates';

export type ForgeChoice = 'a' | 'b';
export type ForgeAttrBonus = { atk: number; def: number; spd: number };

export const FORGE_MAX_LEVEL = 15;
/** A versão do esquema persistido (`forge.v`): sem ela, o registro é o esquema antigo de 5 níveis e é convertido na leitura. */
export const FORGE_SCHEMA = 2;

/** O ganho de cada nível (fração; índice = nível − 1). O nível 1 é fixo (sem escolha); 2..15 vão na opção escolhida. Soma 1,5%. */
export const LEVEL_PCT: readonly number[] = Array.from({ length: FORGE_MAX_LEVEL }, () => 0.001);
/** Máximo de UMA peça no nível máximo: 30% do teto de 5% (três peças = 4,5%). */
export const PIECE_MAX_PCT = 0.015;

/** O atributo do slot (opção A) e o vizinho (opção B). */
export const PRIMARY_ATTR: Readonly<Record<EquipSlot, EquipAttr>> = { nucleo: 'atk', carapaca: 'def', rastro: 'spd' };
export const ALT_ATTR: Readonly<Record<EquipSlot, EquipAttr>> = { nucleo: 'def', carapaca: 'spd', rastro: 'atk' };

/**
 * Vínculo mínimo para aprimorar PARA o nível (índice = nível; 0/1 não se aprimoram). Os níveis altos abrem junto com o Vínculo — mas
 * quem segura o ritmo é o MATERIAL (1 por prédio por dia), não o Vínculo: o 15 pede Vínculo 10 (~3.700 XP, pouco mais de um mês de uso).
 */
export const LEVEL_MIN_BOND: readonly number[] = [0, 0, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9, 10];

/**
 * Quanto de cada um dos DOIS materiais da peça pede o aprimoramento PARA o nível (2..15): [material 1, material 2]. Crescente, com o
 * material de apoio entrando no nível 3. Total por peça: 98 do material do prédio de origem e 56 do de apoio — e cada prédio paga 1
 * material por dia, então o máximo de UMA peça já pede ~100 dias de missão daquele prédio, e as três peças correm em paralelo
 * (prédios diferentes). Tempo medido em `forge.tempo.test.ts`.
 */
export const UPGRADE_COST: Readonly<Record<number, readonly [number, number]>> = {
  2: [2, 0], 3: [3, 1], 4: [3, 1], 5: [4, 2], 6: [5, 2], 7: [5, 3], 8: [6, 3], 9: [7, 4],
  10: [8, 5], 11: [9, 5], 12: [10, 6], 13: [11, 7], 14: [12, 8], 15: [13, 9],
};

/** O nível NOVO (1..15) que carrega o MESMO bônus de cada nível do esquema antigo de 5 níveis (índice = nível antigo − 1). */
export const OLD_LEVEL_TO_NEW: readonly number[] = [3, 5, 8, 11, 15];
/** Quantos níveis novos cada nível antigo cobre (3, 2, 3, 3, 4 décimos de ponto percentual — os ganhos antigos de 0,3/0,2/0,3/0,3/0,4%). */
const OLD_LEVEL_SPAN: readonly number[] = [3, 2, 3, 3, 4];

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
export const LEGACY_LEVEL: readonly [5, 11, 15] = [5, 11, 15];

export interface ForgeState {
  /** O esquema persistido (`FORGE_SCHEMA`). Ausente = o esquema antigo de 5 níveis (convertido na leitura). */
  readonly v?: number;
  /** Nível 1..15 por peça (só as que ganharam registro: concedidas por missão ou já aprimoradas). */
  readonly levels: Readonly<Record<string, number>>;
  /** As escolhas dos níveis 2..N, na ordem (`picks[id][0]` é a do nível 2). Faltando = opção A. */
  readonly picks: Readonly<Record<string, readonly ForgeChoice[]>>;
}

export const EMPTY_FORGE: ForgeState = { levels: {}, picks: {} };

const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * Higieniza o save (também o que vem da nuvem): lista fechada de peças, nível inteiro 1..15, escolhas só 'a'|'b' e no máximo nível−1.
 * Registro SEM `v: 2` = esquema antigo de 5 níveis: o nível e as escolhas são convertidos para o nível novo de MESMO bônus (ver o
 * cabeçalho). Idempotente: o que sai já traz `v: 2` e passa intacto por uma segunda higienização.
 */
export function sanitizeForge(raw: unknown): ForgeState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY_FORGE;
  const r = raw as Record<string, unknown>;
  const legacy = r.v !== FORGE_SCHEMA;
  const lv = r.levels && typeof r.levels === 'object' && !Array.isArray(r.levels) ? (r.levels as Record<string, unknown>) : {};
  const pk = r.picks && typeof r.picks === 'object' && !Array.isArray(r.picks) ? (r.picks as Record<string, unknown>) : {};
  const levels: Record<string, number> = {};
  const picks: Record<string, ForgeChoice[]> = {};
  for (const p of FORGE_PIECES) {
    const v = own(lv, p.id) ? lv[p.id] : undefined;
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const arr = own(pk, p.id) && Array.isArray(pk[p.id]) ? (pk[p.id] as unknown[]) : [];
    if (legacy) {
      const old = Math.min(OLD_LEVEL_TO_NEW.length, Math.max(1, Math.floor(v)));
      const level = OLD_LEVEL_TO_NEW[old - 1];
      const list: ForgeChoice[] = [];
      for (let k = 1; k <= old; k++) {
        // O nível antigo 1 é o fixo (atributo do slot, 'a'); o antigo k ≥ 2 cobre `OLD_LEVEL_SPAN[k-1]` níveis novos com a MESMA escolha.
        const c: ForgeChoice = k >= 2 && arr[k - 2] === 'b' ? 'b' : 'a';
        const span = OLD_LEVEL_SPAN[k - 1] - (k === 1 ? 1 : 0); // o nível novo 1 é o fixo e não tem escolha
        for (let i = 0; i < span; i++) list.push(c);
      }
      levels[p.id] = level;
      if (list.includes('b')) picks[p.id] = list;
      continue;
    }
    const level = Math.min(FORGE_MAX_LEVEL, Math.max(1, Math.floor(v)));
    levels[p.id] = level;
    const list: ForgeChoice[] = [];
    for (let i = 0; i < level - 1; i++) list.push(arr[i] === 'b' ? 'b' : 'a');
    if (list.includes('b')) picks[p.id] = list;
  }
  return Object.keys(levels).length === 0 ? EMPTY_FORGE : { v: FORGE_SCHEMA, levels, picks };
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
  // 15 somas de 0,001 em ponto flutuante dão 0,015000000000000006: arredonda (1e-9 sobra para os décimos de ponto percentual).
  out.atk = Math.round(out.atk * 1e9) / 1e9; out.def = Math.round(out.def * 1e9) / 1e9; out.spd = Math.round(out.spd * 1e9) / 1e9;
  return out;
}

/** O bônus de uma peça POSSUÍDA, lendo nível e escolhas do `forge`. */
export function ownedPieceBonus(id: string, forge: unknown): ForgeAttrBonus {
  const level = pieceLevel(id, forge, true);
  return pieceBonus(id, level, pieceChoices(id, level, forge));
}
