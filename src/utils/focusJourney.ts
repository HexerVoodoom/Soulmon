/**
 * A JORNADA DO FOCO (§247, plano `D:/Soulmon/planos/focus-jornada.md`): dono único da regra pura da jornada.
 * Espelho no servidor: `functions/api/_focusJourney.js` (paridade em `focusJourney.parity.test.ts`). O servidor é a autoridade
 * do relógio e do pagamento; aqui mora o desenho (trilha), a mesma lista de baús pela seed e os tetos.
 * Puro: sem React, sem storage, `now` por parâmetro.
 */
import { FOCUS_ENVIRONMENTS, type FocusEnvironmentId } from './focusExpedition';
import type { MaterialId } from './buildingQuests';

/** As 6 chaves, uma por técnica de preparo (a etapa antiga de `focoSessao.ts`). */
export const JOURNEY_KEYS = ['bancada', 'relampago', 'quadrantes', 'brejo', 'elo', 'pena'] as const;
export type JourneyKeyId = typeof JOURNEY_KEYS[number];
export const KEY_OF_STEP: Record<JourneyKeyId, 'preparar' | 'dois-minutos' | 'eisenhower' | 'sapo' | 'se-entao' | 'esvaziar'> = {
  bancada: 'preparar', relampago: 'dois-minutos', quadrantes: 'eisenhower', brejo: 'sapo', elo: 'se-entao', pena: 'esvaziar',
};
export const isJourneyKey = (v: unknown): v is JourneyKeyId => (JOURNEY_KEYS as readonly unknown[]).includes(v);

export const JOURNEY_MODES = { p25: { focusMin: 25, chests: 6 }, p50: { focusMin: 50, chests: 10 } } as const;
export type JourneyMode = keyof typeof JOURNEY_MODES;
export const SPECIAL_CHANCE = 0.4;

/** Tetos diários (D-6, dono 08/11/2026). */
export const JOURNEY_ITEMS_DAILY_CAP = 28;
export const JOURNEY_ESSENCES_DAILY_CAP = 8;
/** Teto de itens por sessão (dono, 22/11/2026): 1 item por baú, então = nº de baús. Essência tem teto próprio (diário). */
export const JOURNEY_SESSION_ITEMS_CAP = { p25: 6, p50: 10 } as const;
/** Essência por nº de elementos do cenário (1..4): chance no baú comum e qty no baú especial de essência (dono, 22/11/2026). */
export const ESSENCE_BY_ELEMENTS: Record<1 | 2 | 3 | 4, { common: number; special: number }> = {
  1: { common: 0.10, special: 1 }, 2: { common: 0.15, special: 1 }, 3: { common: 0.20, special: 2 }, 4: { common: 0.25, special: 2 },
};
export const JOURNEY_COMPLETIONS_REWARDED = 4;
/** Focos extras por dia (depois dos 4 recompensados) que ainda dão um item simples (§302). */
export const JOURNEY_EXTRA_COMPLETIONS = 3;
/** Pausas por foco (D-4). */
export const JOURNEY_MAX_PAUSES = 3;
export const JOURNEY_MAX_PAUSED_MS = 30 * 60_000;

/** Essência por cenário (ids de `CLASS_ELEMENT_ORDER`). */
export const ENV_ELEMENT: Record<FocusEnvironmentId, string> = {
  forest: 'planta', shore: 'agua', cavern: 'terra', garden: 'fada', workshop: 'industrial', observatory: 'espaco',
};
// Ordem FIXA e igual à do servidor (functions/api/_focusJourney.js): a ordem alimenta o sorteio, então não derivar de UNIQUE_FOODS (que segue a ordem das categorias).
export const JOURNEY_FOODS: readonly string[] = ['🥩', '🥗', '🍎', '☕', '🧃', '🍚', '🍕', '🍭'];

export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface JourneyChest { k: number; at: number; type: 'common' | JourneyKeyId }

/** Os baús da jornada: posição `at` (0..1 do foco) e tipo, só pela seed. */
export function journeyChests(seed: number, mode: JourneyMode): JourneyChest[] {
  const n = JOURNEY_MODES[mode].chests;
  const rng = mulberry(seed ^ 0x51ed);
  const out: JourneyChest[] = [];
  for (let k = 0; k < n; k++) {
    const jitter = (rng() - 0.5) * (0.5 / n);
    const special = rng() < SPECIAL_CHANCE;
    const type = special ? JOURNEY_KEYS[Math.min(JOURNEY_KEYS.length - 1, Math.floor(rng() * JOURNEY_KEYS.length))] : 'common';
    out.push({ k, at: Math.round(((k + 0.5) / n + jitter) * 1e6) / 1e6, type });
  }
  return out;
}

export interface JourneyClock { startAt: number; pausedMs: number; pausedAt: number | null; mode: JourneyMode }

/** Tempo de foco decorrido (sem as pausas; parado além de 30 min volta a contar, D-4). */
export function focusElapsed(c: JourneyClock, now: number): number {
  const parado = Math.min(JOURNEY_MAX_PAUSED_MS, c.pausedMs + (c.pausedAt !== null ? Math.max(0, now - c.pausedAt) : 0));
  return Math.max(0, now - c.startAt - parado);
}
/** Instante (relógio do servidor) em que o foco acaba, ou `null` em pausa (o fim anda enquanto pausado). Dono do aviso "hora do descanso". */
export function focusEndAt(c: JourneyClock): number | null {
  if (c.pausedAt !== null) return null;
  return c.startAt + JOURNEY_MODES[c.mode].focusMin * 60_000 + Math.min(JOURNEY_MAX_PAUSED_MS, c.pausedMs);
}
/** Progresso 0..1 do foco. */
export function journeyProgress(c: JourneyClock, now: number): number {
  return Math.min(1, focusElapsed(c, now) / (JOURNEY_MODES[c.mode].focusMin * 60_000));
}

export type JourneyItem = { kind: 'material'; id: MaterialId; qty: number } | { kind: 'food'; id: string; qty: number } | { kind: 'essence'; id: string; qty: number };

/** O que um baú dá. Especial sem a chave dá o comum (D-2). Determinístico pela seed e pelo índice. */
export function chestLoot(seed: number, chest: JourneyChest, keys: readonly string[], env: FocusEnvironmentId, elems = 1): JourneyItem[] {
  const tier = ESSENCE_BY_ELEMENTS[Math.max(1, Math.min(4, Math.floor(elems) || 1)) as 1 | 2 | 3 | 4];
  const rng = mulberry((seed ^ Math.imul(chest.k + 1, 0x9e3779b1)) >>> 0);
  const mats = FOCUS_ENVIRONMENTS.find(e => e.id === env)!.materials as readonly MaterialId[];
  const pick = <T,>(a: readonly T[]): T => a[Math.min(a.length - 1, Math.floor(rng() * a.length))];
  const mat = (): JourneyItem => ({ kind: 'material', id: pick(mats), qty: 1 });
  const food = (): JourneyItem => ({ kind: 'food', id: pick(JOURNEY_FOODS), qty: 1 });
  const ess = (qty: number): JourneyItem => ({ kind: 'essence', id: ENV_ELEMENT[env], qty });
  const common = (): JourneyItem[] => (rng() < tier.common ? [ess(1)] : [Math.floor(rng() * 5) < 4 ? mat() : food()]);
  if (chest.type === 'common' || !keys.includes(chest.type)) return common();
  /* Baú especial paga 1 item raro (teto por sessão = 1 item/baú). */
  switch (chest.type) {
    case 'bancada': return [food()];
    case 'relampago': return [mat()];
    case 'quadrantes': return [mat()];
    case 'brejo': return [ess(tier.special)];
    case 'elo': return [mat()];
    case 'pena': return [mat()];
  }
}

/** Prêmio de concluir a n-ésima sessão do dia (1-based). A 1ª dá a chave da masmorra (fora daqui) + um baú comum. */
export function completionLoot(seed: number, nth: number, env: FocusEnvironmentId): JourneyItem[] {
  if (nth === 1) return chestLoot(seed, { k: 999, at: 1, type: 'common' }, [], env);
  if (nth <= JOURNEY_COMPLETIONS_REWARDED) {
    const rng = mulberry((seed ^ 0xc0ffee) >>> 0);
    return [{ kind: 'essence', id: ENV_ELEMENT[env], qty: 1 }, { kind: 'food', id: JOURNEY_FOODS[Math.min(JOURNEY_FOODS.length - 1, Math.floor(rng() * JOURNEY_FOODS.length))], qty: 1 }];
  }
  /* Ciclos extras do Pomodoro (§302): do 5º ao 7º foco do dia, UM item simples (baú comum), sem Bits; depois disso nada. */
  if (nth <= JOURNEY_COMPLETIONS_REWARDED + JOURNEY_EXTRA_COMPLETIONS) return chestLoot(seed, { k: 998, at: 1, type: 'common' }, [], env);
  return [];
}

export interface JourneyLedger { day: string; items: number; ess: number; done: number; claims: string[] }
export const emptyLedger = (day: string): JourneyLedger => ({ day, items: 0, ess: 0, done: 0, claims: [] });

/** O que o servidor já pagou no dia, por recibo (o cliente credita o que ainda não está no save). */
export type JourneyGrants = Record<string, JourneyItem[]>;

/** O teto diário de itens já foi usado? Daí em diante os baús abrem vazios (`capLoot` corta em silêncio): a UI avisa em vez de mostrar baú vazio. */
export const journeyItemsCapReached = (ledger: Pick<JourneyLedger, 'items'> | null | undefined): boolean => !!ledger && ledger.items >= JOURNEY_ITEMS_DAILY_CAP;

/** Aplica os tetos do dia: corta o que passa e devolve o que entrou + o razão novo. Idempotente por `claimId`. */
export function capLoot(ledger: JourneyLedger, claimId: string, items: readonly JourneyItem[]): { granted: JourneyItem[]; ledger: JourneyLedger } {
  if (ledger.claims.includes(claimId)) return { granted: [], ledger };
  let { items: it, ess } = ledger;
  const granted: JourneyItem[] = [];
  for (const x of items) {
    if (x.kind === 'essence') { const q = Math.min(x.qty, JOURNEY_ESSENCES_DAILY_CAP - ess); if (q > 0) { granted.push({ ...x, qty: q }); ess += q; } }
    else { const q = Math.min(x.qty, JOURNEY_ITEMS_DAILY_CAP - it); if (q > 0) { granted.push({ ...x, qty: q }); it += q; } }
  }
  return { granted, ledger: { ...ledger, items: it, ess, claims: [...ledger.claims, claimId].slice(-80) } };
}

// ── Desenho da trilha (só cliente) ───────────────────────────────────────────
export interface TrailPoint { x: number; y: number }
/** Espinha da trilha em coordenadas 0..1 (x) e 0..blocos (y, de baixo para cima). */
export function trailSpine(seed: number, mode: JourneyMode, blocks = mode === 'p25' ? 6 : 10): TrailPoint[] {
  const rng = mulberry(seed ^ 0x7a11);
  const pts: TrailPoint[] = [];
  let x = 0.5;
  for (let i = 0; i <= blocks * 8; i++) {
    pts.push({ x, y: i / 8 });
    const g = (rng() + rng() + rng() - 1.5) * 0.24;
    x = Math.min(0.8, Math.max(0.2, x + g));
  }
  return pts;
}
/** Ponto da espinha na fração `f` (0..1) do comprimento, por interpolação linear entre pontos (o traçado suaviza no render). */
export function trailAt(spine: readonly TrailPoint[], f: number): TrailPoint {
  const seg: number[] = [0];
  for (let i = 1; i < spine.length; i++) seg.push(seg[i - 1] + Math.hypot(spine[i].x - spine[i - 1].x, spine[i].y - spine[i - 1].y));
  const total = seg[seg.length - 1];
  const s = Math.min(1, Math.max(0, f)) * total;
  let i = 1;
  while (i < seg.length - 1 && seg[i] < s) i++;
  const t = seg[i] === seg[i - 1] ? 0 : (s - seg[i - 1]) / (seg[i] - seg[i - 1]);
  return { x: spine[i - 1].x + (spine[i].x - spine[i - 1].x) * t, y: spine[i - 1].y + (spine[i].y - spine[i - 1].y) * t };
}
