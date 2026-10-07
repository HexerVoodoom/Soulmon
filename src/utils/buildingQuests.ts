// ---------------------------------------------------------------------------
// MISSÃO POR PRÉDIO + MATERIAIS (decisão do dono, 07/10/2026): "todo prédio,
// exceto os de Mercado, dá 1 missão por dia", e a missão paga 1 MATERIAL PRÓPRIO
// daquele prédio (ex.: Masmorra → Minério). Os materiais serão gastos depois no
// aprimoramento de equipamentos (outro módulo); aqui só nascem a missão, o
// material e o inventário.
//
// Dono único desta regra. Funções PURAS (sem React, sem localStorage; `day` e
// `bondLevel` SEMPRE por parâmetro). Constantes num lugar só, aqui.
//
// O que NÃO é (e há teste varrendo):
//   - NÃO é sorteio: a variante do texto do dia é determinística por
//     `playerDayKey` + id do prédio, como `weeklyMissions` é por `weekKey`;
//   - NÃO premia contagem de tarefas: o gatilho é PRESENÇA — entrar no prédio;
//   - NÃO é dinheiro real, NÃO é moeda: material não se compra, não se troca por
//     Bits/Emblemas/Créditos e não aparece com o estilo de nenhuma das três;
//   - NÃO cobra: quem não entra não perde nada; a missão do dia seguinte é nova,
//     e o estoque de material nunca diminui por falta de uso.
//
// Estado (UM objeto no save, `GameState.buildingQuests`):
//   day       dia do JOGADOR (`playerDayKey`) a que `visited`/`claimed` pertencem
//   visited   prédios em que a pessoa entrou hoje (a missão fica "pronta")
//   claimed   prédios cuja missão já foi paga hoje (idempotência do resgate)
//   materials estoque por material, 0..MATERIAL_CAP
// Dia novo zera `visited`/`claimed` NA LEITURA (`forDay`), o estoque passa intacto.
//
// Estoque no teto (`MATERIAL_CAP` = 99): o resgate continua valendo (a missão
// conta como paga), o material excedente simplesmente não entra. Nunca uma
// recusa que faça a pessoa sentir que perdeu o dia.
//
// COR DAS MARCAS: "!" disponível e "?" pronta no lote do prédio, em tom `gold`
// (o mesmo do Passeio e das Conquistas — `utils/questMarks.ts`; azul é só da
// missão SEMANAL). No ícone do canto da Home, só o "?" dos prédios acende (um
// "!" de 16 prédios quase sempre ligado deixaria de dizer algo).
// ---------------------------------------------------------------------------

import { BUILDING_GATES, buildingGateFor, type BuildingId } from './gates';
import { hashString } from './oracle/base';
import type { QuestMark } from './questMarks';

export type MaterialId =
  | 'spark' | 'moss' | 'prism'
  | 'pebble' | 'ore' | 'ink' | 'gear'
  | 'fang' | 'laurel' | 'ribbon'
  | 'essence' | 'down' | 'cipher'
  | 'page' | 'keepsake' | 'crest';

/** Teto de estoque por material. */
export const MATERIAL_CAP = 99;
/** Material pago por missão resgatada. */
export const MATERIAL_PER_QUEST = 1;

export interface MaterialDef {
  id: MaterialId;
  /** O prédio dono: o único que paga este material. */
  building: BuildingId;
  nameEn: string;
  namePt: string;
  /** Emoji pelado (ícone nunca dentro de box). Nenhum coincide com 🪙/🎖️/💎. */
  icon: string;
}

/** 1 material por prédio fora do Mercado. A ordem é a do Mapa. */
export const MATERIALS: readonly MaterialDef[] = [
  { id: 'spark', building: 'jogos.salao', nameEn: 'Spark', namePt: 'Faísca', icon: '✨' },
  { id: 'moss', building: 'jogos.refugio', nameEn: 'Moss', namePt: 'Musgo', icon: '🌿' },
  { id: 'prism', building: 'jogos.mente', nameEn: 'Prism', namePt: 'Prisma', icon: '🔷' },
  { id: 'pebble', building: 'exploracao.passeio', nameEn: 'Pebble', namePt: 'Seixo', icon: '🗿' },
  { id: 'ore', building: 'exploracao.masmorra', nameEn: 'Ore', namePt: 'Minério', icon: '⛏️' },
  { id: 'ink', building: 'exploracao.caderno', nameEn: 'Ink', namePt: 'Tinta', icon: '🖋️' },
  { id: 'gear', building: 'exploracao.oficina', nameEn: 'Gear', namePt: 'Engrenagem', icon: '⚙️' },
  { id: 'fang', building: 'arena.duelo', nameEn: 'Fang', namePt: 'Presa', icon: '🦷' },
  { id: 'laurel', building: 'arena.torneio', nameEn: 'Laurel', namePt: 'Louro', icon: '🍃' },
  { id: 'ribbon', building: 'arena.feira', nameEn: 'Ribbon', namePt: 'Fita', icon: '🎀' },
  { id: 'essence', building: 'laboratorio.evolucao', nameEn: 'Essence', namePt: 'Essência', icon: '🧬' },
  { id: 'down', building: 'laboratorio.pet', nameEn: 'Down', namePt: 'Penugem', icon: '☁️' },
  { id: 'cipher', building: 'laboratorio.stats', nameEn: 'Cipher', namePt: 'Cifra', icon: '🔣' },
  { id: 'page', building: 'hall.biblioteca', nameEn: 'Page', namePt: 'Página', icon: '📜' },
  { id: 'keepsake', building: 'hall.amigos', nameEn: 'Keepsake', namePt: 'Lembrança', icon: '🎁' },
  { id: 'crest', building: 'hall.guilda', nameEn: 'Crest', namePt: 'Brasão', icon: '🛡️' },
];

export const MATERIAL_IDS: readonly MaterialId[] = MATERIALS.map(m => m.id);

/** Os prédios que dão missão: todos menos `mercado.*`. */
export const QUEST_BUILDINGS: readonly BuildingId[] = (Object.keys(BUILDING_GATES) as BuildingId[]).filter(id => !id.startsWith('mercado.'));

const BY_BUILDING = new Map(MATERIALS.map(m => [m.building, m]));
const BY_ID = new Map(MATERIALS.map(m => [m.id, m]));

export function materialOf(building: BuildingId): MaterialDef | undefined { return BY_BUILDING.get(building); }
export function materialDef(id: MaterialId): MaterialDef | undefined { return BY_ID.get(id); }
export function isQuestBuilding(id: unknown): id is BuildingId {
  return typeof id === 'string' && (QUEST_BUILDINGS as readonly string[]).includes(id);
}

export interface BuildingQuestState {
  day: string;
  visited: BuildingId[];
  claimed: BuildingId[];
  materials: Partial<Record<MaterialId, number>>;
}

export type BuildingQuestStatus = 'locked' | 'available' | 'ready' | 'claimed';

/** Três redações por prédio: só TEXTO, o gatilho é o mesmo (entrar). EN primeiro. */
const FLAVOR: Record<string, readonly [string, string][]> = {
  default: [
    ['Step inside and look around', 'Entre e dê uma olhada'],
    ['Drop by for a moment', 'Passe por aqui um instante'],
    ['Visit and take a breath', 'Visite e respire um pouco'],
  ],
};

/** O texto do dia deste prédio — determinístico por `day` + id (nunca muda a cada abertura). */
export function questText(day: string, id: BuildingId, isPt: boolean): string {
  const pool = FLAVOR[id] ?? FLAVOR.default;
  const pair = pool[hashString(`building-quest:${day}:${id}`) % pool.length];
  return isPt ? pair[1] : pair[0];
}

/** Zera `visited`/`claimed` no dia novo; o estoque passa. Mesmo dia devolve a MESMA referência. */
export function forDay(s: BuildingQuestState | undefined, day: string): BuildingQuestState {
  if (s && s.day === day) return s;
  return { day, visited: [], claimed: [], materials: s?.materials ?? {} };
}

/** Estado da missão do prédio hoje. Prédio de Mercado ou trancado: `locked`. */
export function questStatus(s: BuildingQuestState | undefined, day: string, id: BuildingId, bondLevel: unknown): BuildingQuestStatus {
  if (!isQuestBuilding(id) || !buildingGateFor(id, bondLevel).open) return 'locked';
  const cur = forDay(s, day);
  if (cur.claimed.includes(id)) return 'claimed';
  return cur.visited.includes(id) ? 'ready' : 'available';
}

/**
 * Entrar no prédio. Idempotente e sem efeito colateral: sem mudança devolve o
 * MESMO `s` (inclusive `undefined`), para o chamador não gravar à toa.
 */
export function visitBuilding(s: BuildingQuestState | undefined, day: string, id: BuildingId, bondLevel: unknown): BuildingQuestState | undefined {
  if (questStatus(s, day, id, bondLevel) !== 'available') return s;
  const cur = forDay(s, day);
  return { ...cur, visited: [...cur.visited, id] };
}

/**
 * Resgata a missão: marca como paga e soma 1 do material do prédio (até o teto).
 * A recusa é reconferida aqui, sobre o `s` que chega (o `prev` do updater): só
 * resgata `ready`. Resgate duplo devolve o MESMO `s` e `paid: null`.
 */
export function claimBuildingQuest(s: BuildingQuestState | undefined, day: string, id: BuildingId, bondLevel: unknown): { state: BuildingQuestState | undefined; paid: MaterialId | null } {
  if (questStatus(s, day, id, bondLevel) !== 'ready') return { state: s, paid: null };
  const mat = materialOf(id);
  if (!mat) return { state: s, paid: null };
  const cur = forDay(s, day);
  const had = cur.materials[mat.id] ?? 0;
  const next = Math.min(MATERIAL_CAP, had + MATERIAL_PER_QUEST);
  return {
    state: { ...cur, claimed: [...cur.claimed, id], materials: { ...cur.materials, [mat.id]: next } },
    paid: mat.id,
  };
}

/** A marca do lote (`!` disponível, `?` pronta). Pago/trancado/Mercado: `null`. */
export function buildingMarks(s: BuildingQuestState | undefined, day: string, bondLevel: unknown): Partial<Record<BuildingId, QuestMark>> {
  const out: Partial<Record<BuildingId, QuestMark>> = {};
  for (const id of QUEST_BUILDINGS) {
    const st = questStatus(s, day, id, bondLevel);
    if (st === 'available') out[id] = 'available';
    else if (st === 'ready') out[id] = 'ready';
  }
  return out;
}

/** Quantidade em estoque (0 se nunca houve). */
export function stockOf(s: BuildingQuestState | undefined, id: MaterialId): number {
  return s?.materials?.[id] ?? 0;
}

/**
 * Higienização do load (também do que vem da nuvem): lista fechada de materiais,
 * estoque inteiro em 0..MATERIAL_CAP, ids de prédio só da lista de prédios com
 * missão, sem repetição. Sem `day` string => `undefined`.
 */
export function sanitizeBuildingQuests(raw: unknown): BuildingQuestState | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || r.day.length === 0 || r.day.length > 40) return undefined;
  const ids = (v: unknown): BuildingId[] => {
    const out: BuildingId[] = [];
    if (Array.isArray(v)) for (const x of v) if (isQuestBuilding(x) && !out.includes(x)) out.push(x);
    return out;
  };
  const m = r.materials && typeof r.materials === 'object' && !Array.isArray(r.materials) ? r.materials as Record<string, unknown> : {};
  const materials: Partial<Record<MaterialId, number>> = {};
  for (const id of MATERIAL_IDS) {
    const v = Object.prototype.hasOwnProperty.call(m, id) ? m[id] : undefined;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) materials[id] = Math.min(MATERIAL_CAP, Math.floor(v));
  }
  const visited = ids(r.visited);
  const claimed = ids(r.claimed);
  // pago implica ter entrado (uma missão não se resgata sem a presença)
  for (const c of claimed) if (!visited.includes(c)) visited.push(c);
  return { day: r.day, visited, claimed, materials };
}
