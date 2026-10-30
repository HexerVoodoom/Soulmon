// ---------------------------------------------------------------------------
// ARENA LIVRE: SORTEIO GERAL + REROLL (decisão do dono, 28/10/2026 — revoga a "Arena por tema" de 27/10).
//
// Dono único de:
//   1. `arenaFoesOfSeed(seed, rodada)` — a ÚNICA função pura que diz quem é o inimigo de uma rodada da run `seed`. O card da `DueloSheet`
//      e a `ArenaGame.montarRodada` chamam esta mesma, então o card mostra EXATAMENTE o que será lutado. Sem tema: sorteio geral: metade das runs usa o pool BASE
//      (20 elementos, 1 criatura por elemento) e metade o pool COMBINADO (rookies de 2 elementos; `isComboSeed`).
//   2. `arenaCards(...)` — os 3 cards do dia, determinísticos por (dia do jogador, conta, nº de rerolls): fechar e reabrir mostra os
//      mesmos; cada reroll mistura o contador na semente. Elementos DISTINTOS entre os cards quando der (re-sorteio vizinho), no máximo
//      1 Desgarrado (`arenaCardSeeds`).
//   3. A tabela de CUSTO do reroll: 3 grátis por dia do jogador; do 4º em diante só Bits (15, 30, 45 e 45 fixo). Nunca Crédito/Emblema.
//   4. `arenaSceneOfSeed(seed)` — o cenário da run: sempre uma das duas arenas do Torneio, fixa durante a run (escolhida pela semente).
// ---------------------------------------------------------------------------
import { ARENA_COMBO_ELEMENTS, buildArenaRound, type ArenaEnemy } from './arena';
import { NOVOS_DATA } from './novosSoulmonData';
import { mulberry32 } from './combate/rng';
import { arenaCardSeeds, isComboSeed, isStraySeed } from './strayFoes';
import { spendBitsPaidFirst, type BitsOriginState } from './bitsOrigin';
import { ARENA_BG_SCENES, type DungeonScene } from './dungeonScenes';

export const ARENA_REROLL_FREE_PER_DAY = 3;
/** Preço em Bits do 4º reroll do dia em diante: 15, 30, 45; depois fica em 45. */
export const ARENA_REROLL_PRICES = [15, 30, 45] as const;
/** Teto do contador no save (sanidade; o preço já estabilizou em 45 muito antes). */
export const ARENA_REROLL_MAX_COUNT = 999;

export interface ArenaReroll { day: string; count: number }

/** Preço (Bits) do PRÓXIMO reroll, dado quantos já foram feitos no dia. 0 = grátis. */
export function arenaRerollCost(done: number): number {
  const n = Math.max(0, Math.floor(done) || 0);
  if (n < ARENA_REROLL_FREE_PER_DAY) return 0;
  return ARENA_REROLL_PRICES[Math.min(n - ARENA_REROLL_FREE_PER_DAY, ARENA_REROLL_PRICES.length - 1)];
}
export const arenaRerollsFreeLeft = (done: number): number => Math.max(0, ARENA_REROLL_FREE_PER_DAY - Math.max(0, Math.floor(done) || 0));

/** Registro bom ou nada (mesma regra de `sanitizeCheckIns`; espelho em `functions/api/_dayCounters.js`). */
export function sanitizeArenaReroll(raw: unknown): ArenaReroll | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { day?: unknown; count?: unknown };
  if (typeof r.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day) || typeof r.count !== 'number' || !Number.isFinite(r.count)) return undefined;
  return { day: r.day, count: Math.min(ARENA_REROLL_MAX_COUNT, Math.max(0, Math.floor(r.count))) };
}

/** Quantos rerolls já foram feitos NO DIA `dayIso` (registro de outro dia = 0). */
export function arenaRerollsToday(rec: unknown, dayIso: string): number {
  const s = sanitizeArenaReroll(rec);
  return s && s.day === dayIso ? s.count : 0;
}

/** Registro depois de mais um reroll. Dia anterior ao gravado (relógio que voltou) não zera: segue contando no gravado. */
export function nextArenaReroll(rec: unknown, dayIso: string): ArenaReroll {
  const s = sanitizeArenaReroll(rec);
  if (s && s.day > dayIso) return { day: s.day, count: Math.min(ARENA_REROLL_MAX_COUNT, s.count + 1) };
  return { day: dayIso, count: Math.min(ARENA_REROLL_MAX_COUNT, arenaRerollsToday(s, dayIso) + 1) };
}

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h | 0;
}

/** §199: os elementos BASE que têm criatura (o pool das runs comuns e Desgarradas). */
export const ARENA_BASE_ELEMENTS: readonly string[] = [...new Set(NOVOS_DATA.map(n => n.element))].sort();
const RUN_ELEMENT_MIX = 0x3e1e3e17;

/**
 * §199 (dono, 30/10/2026): o ELEMENTO da run `seed` — o que o card mostra e o de TODO inimigo das 5 rodadas. Antes o card mostrava só os
 * elementos da 1ª rodada (e só a base do combinado), e as rodadas seguintes sorteavam outros: "escolhi um elemento e veio outro".
 * Run combinada = um elemento FUNDIDO (id do sprite, `spriteElement`), então os fundidos também aparecem.
 */
export function arenaRunElement(seed: number): string {
  const pool = isComboSeed(seed) && ARENA_COMBO_ELEMENTS.length > 0 ? ARENA_COMBO_ELEMENTS : ARENA_BASE_ELEMENTS;
  return pool[Math.floor(mulberry32((seed ^ RUN_ELEMENT_MIX) | 0)() * pool.length)];
}

/** Os inimigos da rodada `rodada` (1-based) da run `seed`. Pura: card e luta chamam ESTA. */
export function arenaFoesOfSeed(seed: number, rodada: number): ArenaEnemy[] {
  return buildArenaRound(rodada, 1, mulberry32((seed ^ Math.imul(rodada, 0x9e3779b1)) | 0), undefined, isStraySeed(seed), isComboSeed(seed), arenaRunElement(seed));
}

/** O elemento que o card MOSTRA: o da run (o mesmo de todo inimigo dela; fundido nas combinadas). */
export const arenaCardElements = (seed: number): string[] => [arenaRunElement(seed)];

/**
 * Os 3 cards. `accountKey` = saveId (ou outro identificador estável da conta). Elementos distintos entre os cards: se um card repete
 * elemento de outro, tenta a semente vizinha (até 64 vezes); sem saída, aceita o melhor (nunca trava).
 */
export function arenaCards(dayIso: string, accountKey: string, rerollCount: number, n = 3): number[] {
  const rng = mulberry32(hash(`${dayIso}|${accountKey}|${Math.max(0, Math.floor(rerollCount) || 0)}`));
  const seeds = arenaCardSeeds(() => (rng() * 0x100000000) | 0, n);
  const taken = new Set<string>();
  return seeds.map(s0 => {
    let s = s0;
    for (let i = 0; i < 64; i++) {
      const els = arenaCardElements(s);
      if (els.every(e => !taken.has(e))) break;
      s = (s + 1) | 0;
      if (isStraySeed(s) !== isStraySeed(s0)) s = (s + 1) | 0; // vizinha do mesmo tipo (mantém o limite de 1 Desgarrado)
    }
    arenaCardElements(s).forEach(e => taken.add(e));
    return s;
  });
}

/** O cenário da run: uma das duas arenas do Torneio, escolhida pela semente e FIXA durante a run (todas as rodadas e visores). */
export function arenaSceneOfSeed(seed: number): DungeonScene {
  return ARENA_BG_SCENES[Math.abs(Math.imul(seed | 0, 0x9e3779b1) >>> 7) % ARENA_BG_SCENES.length];
}

/**
 * O reroll aplicado sobre o save (PURA, roda dentro do updater do `setGameState`): reconfere o preço no `prev` (dois toques no mesmo lote
 * não compram com o saldo de um), desconta SÓ Bits (pago primeiro, `spendBitsPaidFirst`) e soma 1 ao contador do dia. Sem saldo = `prev`.
 */
export function applyArenaReroll<T extends BitsOriginState & { arenaReroll?: ArenaReroll }>(prev: T, dayIso: string): T {
  const cost = arenaRerollCost(arenaRerollsToday(prev.arenaReroll, dayIso));
  const bits = prev.gamePoints ?? 0;
  if (bits < cost) return prev;
  const next = { ...prev, arenaReroll: nextArenaReroll(prev.arenaReroll, dayIso), gamePoints: bits - cost };
  return cost > 0 ? spendBitsPaidFirst(next, cost) : next;
}
