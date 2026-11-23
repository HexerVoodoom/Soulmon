/**
 * Reroll e fim de run da Arena (parte PURA e leve de `arenaSorteio.ts`): o `App` (entrada) e o `GameStateContext` só precisam
 * do preço, do contador e dos updaters do save; importar `arenaSorteio` inteiro puxava o motor da Arena e o elenco de
 * inimigos para o chunk de entrada (orçamento de bytes, REGISTRO §497). `arenaSorteio.ts` reexporta tudo daqui.
 */
import { arenaRollover, nextArenaLadder } from './arenaLadder';
import { spendBitsPaidFirst, type BitsOriginState } from './bitsOrigin';

export const ARENA_REROLL_FREE_PER_HOUR = 3;
/** Preço em Bits do 4º reroll da HORA em diante: 15, 30, 45; depois fica em 45. */
export const ARENA_REROLL_PRICES = [15, 30, 45] as const;
/** Teto do contador no save (sanidade; o preço já estabilizou em 45 muito antes). */
export const ARENA_REROLL_MAX_COUNT = 999;

/**
 * `day`/`count` = rerolls do DIA (entram na semente dos cards); `hour`/`hcount` (22/11/2026) = rerolls da HORA UTC ("AAAA-MM-DDTHH"), que decidem
 * os 3 grátis e o preço. Os campos da hora são opcionais: save antigo (só dia) começa a hora zerada. Espelho: `functions/api/_dayCounters.js`.
 */
export interface ArenaReroll { day: string; count: number; hour?: string; hcount?: number }
const HOUR_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}$/;
/** A hora UTC de um instante ("AAAA-MM-DDTHH"): a janela dos giros grátis. */
export const arenaHourKey = (now: Date | number = Date.now()): string => new Date(now).toISOString().slice(0, 13);

/** Preço (Bits) do PRÓXIMO reroll, dado quantos já foram feitos no dia. 0 = grátis. */
export function arenaRerollCost(done: number): number {
  const n = Math.max(0, Math.floor(done) || 0);
  if (n < ARENA_REROLL_FREE_PER_HOUR) return 0;
  return ARENA_REROLL_PRICES[Math.min(n - ARENA_REROLL_FREE_PER_HOUR, ARENA_REROLL_PRICES.length - 1)];
}
export const arenaRerollsFreeLeft = (done: number): number => Math.max(0, ARENA_REROLL_FREE_PER_HOUR - Math.max(0, Math.floor(done) || 0));

/** Registro bom ou nada (mesma regra de `sanitizeCheckIns`; espelho em `functions/api/_dayCounters.js`). */
export function sanitizeArenaReroll(raw: unknown): ArenaReroll | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { day?: unknown; count?: unknown };
  if (typeof r.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day) || typeof r.count !== 'number' || !Number.isFinite(r.count)) return undefined;
  const hour = (raw as { hour?: unknown }).hour; const hc = (raw as { hcount?: unknown }).hcount;
  const comHora = typeof hour === 'string' && HOUR_KEY.test(hour) && typeof hc === 'number' && Number.isFinite(hc);
  return { day: r.day, count: Math.min(ARENA_REROLL_MAX_COUNT, Math.max(0, Math.floor(r.count))), ...(comHora ? { hour, hcount: Math.min(ARENA_REROLL_MAX_COUNT, Math.max(0, Math.floor(hc))) } : {}) };
}

/** Quantos rerolls já foram feitos NO DIA `dayIso` (registro de outro dia = 0). */
export function arenaRerollsToday(rec: unknown, dayIso: string): number {
  const s = sanitizeArenaReroll(rec);
  // Dia gravado À FRENTE do de hoje (relógio/fuso/aparelho adiantado, e o servidor só deixa o dia andar para frente): é o dia corrente.
  // Antes só `===` contava, o contador visível ficava em 0 para sempre e o Draw again não mudava os cards (P0 item 3, 22/11/2026).
  return s && s.day >= dayIso ? s.count : 0;
}

/** Quantos rerolls já foram feitos NESTA HORA UTC (registro de outra hora = 0; hora gravada à frente conta como a atual, pelo mesmo motivo do dia). */
export function arenaRerollsThisHour(rec: unknown, now: Date | number = Date.now()): number {
  const s = sanitizeArenaReroll(rec);
  return s?.hour !== undefined && s.hour >= arenaHourKey(now) ? (s.hcount ?? 0) : 0;
}

/** Registro depois de mais um reroll. Dia anterior ao gravado (relógio que voltou) não zera: segue contando no gravado. */
export function nextArenaReroll(rec: unknown, dayIso: string, now: Date | number = Date.now()): ArenaReroll {
  const s = sanitizeArenaReroll(rec);
  const hour = s?.hour !== undefined && s.hour > arenaHourKey(now) ? s.hour : arenaHourKey(now);
  const hcount = Math.min(ARENA_REROLL_MAX_COUNT, arenaRerollsThisHour(s, now) + 1);
  if (s && s.day > dayIso) return { day: s.day, count: Math.min(ARENA_REROLL_MAX_COUNT, s.count + 1), hour, hcount };
  return { day: dayIso, count: Math.min(ARENA_REROLL_MAX_COUNT, arenaRerollsToday(s, dayIso) + 1), hour, hcount };
}

/**
 * O reroll aplicado sobre o save (PURA, roda dentro do updater do `setGameState`): reconfere o preço no `prev` (dois toques no mesmo lote
 * não compram com o saldo de um), desconta SÓ Bits (pago primeiro, `spendBitsPaidFirst`) e soma 1 ao contador do dia. Sem saldo = `prev`.
 */
export function applyArenaReroll<T extends BitsOriginState & { arenaReroll?: ArenaReroll }>(prev: T, dayIso: string, now: Date | number = Date.now()): T {
  const cost = arenaRerollCost(arenaRerollsThisHour(prev.arenaReroll, now));
  const bits = prev.gamePoints ?? 0;
  if (bits < cost) return prev;
  const next = { ...prev, arenaReroll: nextArenaReroll(prev.arenaReroll, dayIso, now), gamePoints: bits - cost };
  return cost > 0 ? spendBitsPaidFirst(next, cost) : next;
}

/**
 * Runs da Arena TERMINADAS no dia (`arenaRuns {day,count}`, mesma forma do `arenaReroll`). Cada fim de run soma 1 e
 * re-sorteia os cards (`arenaCards(..., runsDone)`), SEM tocar no contador do reroll (que é o pago/limitado).
 */
export function applyArenaRunEnd<T extends { arenaRuns?: ArenaReroll; arenaLadder?: number; arenaSeason?: string }>(prev: T, dayIso: string, outcome: 'win' | 'loss' | 'draw' = 'loss', now: Date | number = Date.now()): T {
  // §222: vitória sobe 1 degrau da escada; derrota e empate seguram. Sem valor gravado = 0 (começa de baixo).
  const r = arenaRollover(prev.arenaLadder, prev.arenaSeason, now); // temporada nova: a escada recomeça em 0 antes de contar esta run
  return { ...prev, arenaRuns: nextArenaReroll(prev.arenaRuns, dayIso), arenaLadder: nextArenaLadder(r.ladder, outcome), arenaSeason: r.season };
}
