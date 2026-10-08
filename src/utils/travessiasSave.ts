/**
 * TRAVESSIAS — o pedaço do SAVE que não precisa do catálogo.
 *
 * Mora separado de `utils/travessias.ts` por causa do orçamento de bytes
 * (`src/deploy/orcamentoDeBytes.contract.test.ts`): o `GameStateContext` e o
 * `App` estão no chunk de entrada, e o catálogo das regiões (texto EN + PT de
 * oito reinos) não pode ir junto. Aqui fica só o que o load e a Home precisam
 * — a higienização e a pergunta "este save já mexeu no mapa?" —, e
 * `utils/travessias.ts` reexporta tudo, então a regra continua tendo UM dono.
 *
 * O save guarda só ids, enum e `dayKey` (parecer de menores e marca, 04 R-4):
 * nada de texto livre, lugar, foto ou pessoa. A higienização descarta o que
 * não for isso.
 */
import { CROSSINGS_EMPTY, HOME_REGION, LOG_MAX, MISSION_WINDOW_MS, STROLL_MIN_MS, type CrossingsState, type RegionId } from '../types/travessias';
import { dayKeyToIso } from './playerDay';

/**
 * Os oito reinos, na ordem da bíblia (§7.2). É a lista de valores do tipo
 * `RegionId` — há teste conferindo que bate, um a um, com o catálogo.
 */
export const REGION_IDS: readonly RegionId[] = [
  'campina', 'floresta', 'oceano', 'deserto', 'picos', 'pantano', 'cavernas', 'gelo',
];

export const isRegionId = (v: unknown): v is RegionId =>
  typeof v === 'string' && (REGION_IDS as readonly string[]).includes(v);

/**
 * `AAAA-MM-DD` — o formato do dia no mapa. Qualquer outra coisa é lixo, EXCETO a
 * forma `toDateString` ("Sat Oct 03 2026"), que o App chegou a gravar aqui (a
 * `date` do relatório diário entrava em `settleNight`/`markDone` sem conversão):
 * descartá-la fazia a região aberta pela noite SUMIR no próximo load (ela já
 * saíra de `pending`). Em vez de perder, converte para ISO.
 */
const asDayKey = (v: unknown): string | null => dayKeyToIso(v);

/** Id de desafio: só o formato de id do catálogo (nunca texto livre no save). */
const isChallengeId = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9-]{1,64}$/.test(v);

/**
 * Tolera ausência e lixo, nunca derruba o load: é camada opcional, e perder
 * uma linha dela vale infinitamente menos que perder o save. Casa nunca entra
 * em `opened` (é implícita), região repetida fica só na PRIMEIRA abertura, e
 * `pending` nunca repete nem inclui região já aberta.
 */
export function normalizeCrossings(raw: unknown): CrossingsState {
  if (!raw || typeof raw !== 'object') return CROSSINGS_EMPTY;
  const r = raw as Record<string, unknown>;

  const opened: CrossingsState['opened'] = [];
  const vistas = new Set<RegionId>([HOME_REGION]);
  for (const e of Array.isArray(r.opened) ? r.opened : []) {
    const o = (e ?? {}) as Record<string, unknown>;
    const dia = asDayKey(o.day);
    if (!isRegionId(o.region) || !dia || vistas.has(o.region)) continue;
    vistas.add(o.region);
    opened.push({ region: o.region, day: dia });
  }

  const pending: RegionId[] = [];
  for (const p of Array.isArray(r.pending) ? r.pending : []) {
    if (!isRegionId(p) || vistas.has(p)) continue;
    vistas.add(p);
    pending.push(p);
  }

  const a = (r.active ?? null) as Record<string, unknown> | null;
  // F5 (02/10/2026): a Travessia se repete todo dia, então a ativa pode estar
  // numa região já aberta ou com "Fiz" guardado. Só a casa não tem desafio.
  const active = a && typeof a === 'object' && isRegionId(a.region) && a.region !== HOME_REGION
    && isChallengeId(a.challenge)
    ? { region: a.region, challenge: a.challenge }
    : null;

  const aberta = (id: RegionId) => id === HOME_REGION || opened.some(o => o.region === id);
  const destination = isRegionId(r.destination) && r.destination !== HOME_REGION && aberta(r.destination)
    ? r.destination : null;

  // Missões diárias (04/10/2026): o dia da escolha, o total de Marcos e a viagem
  // da noite. Tudo opcional num save antigo; lixo vira o valor vazio.
  const pickDay = active ? asDayKey(r.pickDay) : null;
  const score = typeof r.score === 'number' && Number.isFinite(r.score)
    ? Math.min(SCORE_MAX, Math.max(0, Math.floor(r.score))) : 0;
  const t = (r.trip ?? null) as Record<string, unknown> | null;
  const tripDay = t && typeof t === 'object' ? asDayKey(t.day) : null;
  const trip = t && tripDay && isRegionId(t.region) && t.region !== HOME_REGION
    ? { day: tripDay, region: t.region }
    : null;

  const pickAt = active && typeof r.pickAt === 'number' && Number.isFinite(r.pickAt) && r.pickAt > 0
    ? Math.floor(r.pickAt) : null;

  // O registro (rodada 7, M6): só dia + região + id; lixo é descartado; fica o fim.
  const log: CrossingsState['log'] = [];
  for (const e of Array.isArray(r.log) ? r.log : []) {
    const o = (e ?? {}) as Record<string, unknown>;
    const dia = asDayKey(o.day);
    if (!dia || !isRegionId(o.region) || o.region === HOME_REGION || !isChallengeId(o.challenge)) continue;
    log.push({ day: dia, region: o.region, challenge: o.challenge });
  }

  return {
    opened, active, pending, destination, hidden: r.hidden === true,
    doneDay: asDayKey(r.doneDay), pickDay, pickAt, log: log.slice(-LOG_MAX), score, trip,
    claimDay: asDayKey(r.claimDay),
  };
}

/** Teto de sanidade do total de Marcos (um por dia, então ~27 anos). */
const SCORE_MAX = 9999;

/**
 * O marcador de MISSÃO sobre o lote do Passeio (04/10/2026), à la World of
 * Warcraft: `'available'` = "!" (há missões do dia para escolher), `'progress'`
 * = "?" (uma escolhida, ainda sem o "Fiz"), `null` = nada (feita hoje, ou a
 * camada escondida). Mora aqui, fora do catálogo, porque a Exploração precisa
 * dele sem carregar as regiões. Sem número, sem som, sem animação.
 */
export type MissionMark = 'available' | 'progress' | null;

export function missionMark(c: CrossingsState, dayKey: string, now?: number): MissionMark {
  // Rodada 7 (M7): a camada não se esconde mais — `hidden` de save antigo é ignorado.
  if (c.doneDay === dayKey) return null;
  return missionLive(c, dayKey, now) ? 'progress' : 'available';
}

/**
 * A missão escolhida ainda vale? (rodada 7, M4.) Com `pickAt` e `now`: vale por
 * 24 h a partir da escolha, mesmo virando o dia. Sem `pickAt` (save antigo, ou
 * missão já feita) ou sem `now`: vale só no dia da escolha.
 */
export function missionLive(c: CrossingsState, dayKey: string, now?: number): boolean {
  if (!c.active) return false;
  if (c.pickAt !== null && now !== undefined) return now < c.pickAt + MISSION_WINDOW_MS;
  return c.pickDay === dayKey;
}

/**
 * Este save já mexeu no mapa? Sem região aberta nem "Fiz" guardado, o achado
 * da noite é EXATAMENTE a Aventura comum — e o `App` nem precisa carregar o
 * catálogo das regiões para saber disso.
 */
export const crossingsTouchMap = (c: CrossingsState): boolean =>
  c.opened.length > 0 || c.pending.length > 0;

/**
 * Quanto falta (ms) para o passeio poder ser concluído: a espera de `STROLL_MIN_MS` conta da ESCOLHA (`pickAt`). Vive AQUI e não em
 * `travessias.ts` de propósito: o `App` precisa dela na entrada, e `travessias.ts` carrega os catálogos de regiões/viagens
 * (importá-lo estaticamente custou ~37 KB no chunk de entrada). `travessias.ts` a reexporta para os demais chamadores.
 */
export function strollWaitMs(s: CrossingsState, now?: number): number {
  if (s.pickAt === null || now === undefined) return 0;
  return Math.max(0, s.pickAt + STROLL_MIN_MS - now);
}

/**
 * A LINHA "Faça um passeio" do menu de Missões da Home (07/10/2026). O Passeio
 * inteiro (propostas, card, relógio de 30 min, "Concluir") vive no NPC; o menu só
 * mostra a linha:
 *  - `point`   = ainda não concluído hoje no NPC ("!"; a linha só APONTA);
 *  - `ready`   = concluído hoje no NPC e ainda sem resgate ("?" + Resgatar);
 *  - `claimed` = resgatado hoje.
 * `dayKey` é o dia do jogador (`AAAA-MM-DD`).
 */
export type StrollLineState = 'point' | 'ready' | 'claimed';
export function strollLineState(c: CrossingsState, dayKey: string): StrollLineState {
  if (c.doneDay !== dayKey) return 'point';
  return c.claimDay === dayKey ? 'claimed' : 'ready';
}

/**
 * O Resgatar da linha. Idempotente por dia do jogador e PURO sobre `prev`
 * (footgun 6): só vale com o passeio concluído hoje, e a 2ª chamada devolve o MESMO
 * objeto. Não paga nada — o pagamento já saiu no `markDone` (ver `claimDay`).
 */
export function claimStroll(c: CrossingsState, dayKey: string): CrossingsState {
  if (strollLineState(c, dayKey) !== 'ready') return c;
  return { ...c, claimDay: dayKey };
}
