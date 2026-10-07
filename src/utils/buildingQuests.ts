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

/** O prédio dono de cada material: o único que o paga. Nomes e ícones moram em `buildingQuestsCopy.ts` (só a folha lazy os lê). */
export const MATERIAL_BUILDING: Readonly<Record<MaterialId, BuildingId>> = {
  spark: 'jogos.salao', moss: 'jogos.refugio', prism: 'jogos.mente',
  pebble: 'exploracao.passeio', ore: 'exploracao.masmorra', ink: 'exploracao.caderno', gear: 'exploracao.oficina',
  fang: 'arena.duelo', laurel: 'arena.torneio', ribbon: 'arena.feira',
  essence: 'laboratorio.evolucao', down: 'laboratorio.pet', cipher: 'laboratorio.stats',
  page: 'hall.biblioteca', keepsake: 'hall.amigos', crest: 'hall.guilda',
};

export const MATERIAL_IDS = Object.keys(MATERIAL_BUILDING) as MaterialId[];

/** Os prédios que dão missão: todos menos `mercado.*`. */
export const QUEST_BUILDINGS: readonly BuildingId[] = (Object.keys(BUILDING_GATES) as BuildingId[]).filter(id => !id.startsWith('mercado.'));

const BY_BUILDING = new Map(MATERIAL_IDS.map(id => [MATERIAL_BUILDING[id], id] as const));

export function materialOf(building: BuildingId): MaterialId | undefined { return BY_BUILDING.get(building); }
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
  const had = cur.materials[mat] ?? 0;
  const next = Math.min(MATERIAL_CAP, had + MATERIAL_PER_QUEST);
  return {
    state: { ...cur, claimed: [...cur.claimed, id], materials: { ...cur.materials, [mat]: next } },
    paid: mat,
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
