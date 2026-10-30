/**
 * GUILDA DOS MERCENÁRIOS (plano do onboarding velado §11, M1–M5; 30/10/2026)
 * ==========================================================================
 *
 * Por dia do jogador o jogo oferece UMA missão, de UMA Ordem principal (Filtradores = Benevolência,
 * Tecelões = Harmonia, Rompentes = Poder; D22: "Ordem", não "clã"). A atividade é sorteada DENTRO do
 * tipo, só entre itens do catálogo com evidência A ou B. Confirmação pela pergunta de honestidade.
 * Recompensa: só pontos do tipo (3 se `effort` 1, 5 se 2–3) pelo mesmo caminho do `feedFood`
 * (`powerPoints`… + `attributesSinceLastEvolution`). Sem XP, sem Bits, fora da meta diária.
 * Só a partir do rookie (BB recusa).
 *
 * LINHAS VERMELHAS: a missão é CONVITE. "Ainda não" não custa nada, não há contador de missões
 * perdidas nem sequência. A copy diz o que a atividade É, nunca o que ela cura (L8).
 *
 * Estado: `GameState.mercMission {day, ordem, activityId, done}` (leitura tolerante abaixo; espelho
 * em `functions/api/_mercMission.js`, paridade em `mercMission.parity.test.js`).
 */
import { ACTIVITY_CATALOG } from '../data/activityCatalog';
import { CATEGORY_ATTRIBUTES, type BranchType } from '../types/attributes';
import type { CatalogItem } from '../types/activityCatalog';
import { isBBStage } from './bbStage';

export type MercOrdem = 'filtrador' | 'tecelao' | 'rompente';
export const MERC_ORDENS: readonly MercOrdem[] = ['filtrador', 'tecelao', 'rompente'];

export interface MercMissionState { day: string; ordem: MercOrdem; activityId: string; done: boolean }

/** Tipo (atributo) de cada Ordem principal. */
export const MERC_TIPO: Record<MercOrdem, BranchType> = {
  filtrador: 'benevolence', tecelao: 'harmony', rompente: 'power',
};

export const MERC_NOME: Record<MercOrdem, { pt: string; en: string; ordemPt: string; ordemEn: string }> = {
  filtrador: { pt: 'Desbravador dos Filtradores', en: 'Filterer Pathfinder', ordemPt: 'Ordem dos Filtradores', ordemEn: 'Order of the Filterers' },
  tecelao: { pt: 'Desbravador dos Tecelões', en: 'Weaver Pathfinder', ordemPt: 'Ordem dos Tecelões', ordemEn: 'Order of the Weavers' },
  rompente: { pt: 'Desbravador dos Rompentes', en: 'Breaker Pathfinder', ordemPt: 'Ordem dos Rompentes', ordemEn: 'Order of the Breakers' },
};

/** Retratos placeholder esperados (a arte final vem da `/squad-arte`; ausente = silhueta nomeada). */
export const MERC_RETRATO: Record<MercOrdem, string> = {
  filtrador: 'merc-filtrador.png', tecelao: 'merc-tecelao.png', rompente: 'merc-rompente.png',
};

/** Leitura tolerante: forma errada = ausente. Idempotente. Espelho exato: `functions/api/_mercMission.js`. */
export function sanitizeMercMission(raw: unknown): MercMissionState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || r.day.length === 0 || r.day.length > 40) return undefined;
  if (typeof r.ordem !== 'string' || !(MERC_ORDENS as readonly string[]).includes(r.ordem)) return undefined;
  if (typeof r.activityId !== 'string' || r.activityId.length === 0 || r.activityId.length > 64) return undefined;
  return { day: r.day, ordem: r.ordem as MercOrdem, activityId: r.activityId, done: r.done === true };
}

/** A Ordem de uma categoria: a do maior valor em `CATEGORY_ATTRIBUTES` (dono único da tabela, sem segunda cópia). */
export function ordemDaCategoria(c: CatalogItem['category']): MercOrdem {
  const a = CATEGORY_ATTRIBUTES[c];
  if (a.benevolence > a.power && a.benevolence > a.harmony) return 'filtrador';
  if (a.harmony > a.power && a.harmony > a.benevolence) return 'tecelao';
  return 'rompente';
}

/** Itens elegíveis: evidência A/B (M2). Itens `optInOnly` (aviso de crise) nunca viram convite. */
export function mercPool(ordem: MercOrdem): CatalogItem[] {
  return ACTIVITY_CATALOG
    .filter(i => (i.evidence.level === 'A' || i.evidence.level === 'B') && !i.optInOnly && ordemDaCategoria(i.category) === ordem)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Sorteio determinístico: semente = dia do jogador + Ordem. Reabrir o app não troca a missão. */
export function sortearMerc(dayKey: string, ordem: MercOrdem): CatalogItem | undefined {
  const pool = mercPool(ordem);
  return pool.length ? pool[fnv1a(`${dayKey}|${ordem}`) % pool.length] : undefined;
}

/** Pontos de tipo (M4): 3 se o `effort` é 1, 5 se 2–3. O esforço é o do nível 1, o que a missão pede. */
export function pontosMerc(item: Pick<CatalogItem, 'levels'>): 3 | 5 {
  return item.levels[0].effort === 1 ? 3 : 5;
}

export type MercRecusa = 'bb' | 'ja-escolheu' | 'sem-atividade';

type MercState = {
  evolutionStage?: unknown;
  mercMission?: MercMissionState;
  powerPoints: number; harmonyPoints: number; benevolencePoints: number;
  attributesSinceLastEvolution?: { power: number; harmony: number; benevolence: number };
};

/** A missão de HOJE (a de outro dia não conta: o convite renova sozinho, sem castigo). */
export function mercDeHoje(s: Pick<MercState, 'mercMission'>, dayKey: string): MercMissionState | null {
  return s.mercMission && s.mercMission.day === dayKey ? s.mercMission : null;
}

/** Escolhe a Ordem do dia. Recusa BB (M5), 2ª escolha no dia (M1) e Ordem sem atividade elegível. Pura. */
export function escolherMerc<T extends MercState>(s: T, ordem: MercOrdem, dayKey: string): { state: T; recusa?: MercRecusa } {
  if (isBBStage(s.evolutionStage)) return { state: s, recusa: 'bb' };
  if (mercDeHoje(s, dayKey)) return { state: s, recusa: 'ja-escolheu' };
  const item = sortearMerc(dayKey, ordem);
  if (!item) return { state: s, recusa: 'sem-atividade' };
  return { state: { ...s, mercMission: { day: dayKey, ordem, activityId: item.id, done: false } } };
}

/** Soma pontos de tipo pelo MESMO caminho do `feedFood`: totais + `attributesSinceLastEvolution`. */
export function darPontosDeTipo<T extends MercState>(s: T, tipo: BranchType, pts: number): T {
  const add = { power: 0, harmony: 0, benevolence: 0, [tipo]: pts };
  const since = s.attributesSinceLastEvolution;
  return {
    ...s,
    powerPoints: s.powerPoints + add.power,
    harmonyPoints: s.harmonyPoints + add.harmony,
    benevolencePoints: s.benevolencePoints + add.benevolence,
    attributesSinceLastEvolution: {
      power: (since?.power ?? 0) + add.power,
      harmony: (since?.harmony ?? 0) + add.harmony,
      benevolence: (since?.benevolence ?? 0) + add.benevolence,
    },
  };
}

/** "Sim, fiz": fecha a missão de hoje e paga uma vez só (idempotente: 2ª chamada é no-op). */
export function concluirMerc<T extends MercState>(s: T, dayKey: string): T {
  const m = mercDeHoje(s, dayKey);
  if (!m || m.done || isBBStage(s.evolutionStage)) return s;
  const item = ACTIVITY_CATALOG.find(i => i.id === m.activityId);
  const pago = item ? darPontosDeTipo(s, MERC_TIPO[m.ordem], pontosMerc(item)) : s;
  return { ...pago, mercMission: { ...m, done: true } };
}
