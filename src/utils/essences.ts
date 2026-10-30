/**
 * ESSÊNCIAS DOS ELEMENTOS (28/10/2026, REGISTRO §183) — dono único. Todo inimigo de PvE derrotado dropa a essência do PRÓPRIO
 * elemento (composto = o id do composto; Pesadelo = `pesadelo`). Só COLETA: não há uso ainda. Drop ADICIONAL (não toca Bits/itens).
 *
 * `GameState.essences: Record<elementId, number>` (só cresce) e `GameState.essenceAway {day,count}` (quanto a descida AUTOMÁTICA da
 * Fenda já rendeu no dia do jogador — essa tem teto diário `ESSENCE_AWAY_DAILY_CAP`; a luta ativa NÃO tem teto).
 * A forma é espelhada no servidor (`functions/api/_essences.js`, `_dayCounters.js`; paridade em `essences.parity.test.js`).
 */
import { BASE_ELEMENT_IDS, elementIdOfFoe, isDexElement } from './elementDex';
import { NIGHTMARE_ELEMENT } from './nightmareElement';
import { elementLabel } from './arena';
import { elementoNomeDe } from './soulProfile/ficha/elementoNome';

/** Teto por elemento no save (sanidade, não regra de jogo). */
export const ESSENCE_MAX_PER_ELEMENT = 1_000_000;
/** 210 do dex + `pesadelo`. */
export const ESSENCE_MAX_KEYS = 211;
/** Teto diário da descida AUTOMÁTICA (jogador fora / relatório de volta). Constante ÚNICA (o servidor limita o contador a 999). */
export const ESSENCE_AWAY_DAILY_CAP = 30;

/** Quantidade por estágio do inimigo: rookie 1, champion 2, ultimate/mega 3. Desconhecido = 1. */
export const ESSENCE_BY_STAGE: Readonly<Record<string, number>> = { rookie: 1, champion: 2, ultimate: 3, mega: 3 };
export const essenceQtyOfStage = (stage: string | undefined | null): number => ESSENCE_BY_STAGE[stage ?? ''] ?? 1;
/** Chefe da Feira: 5 + 1 a cada 5 níveis do evento (nível 1..20 → 5..9). Espelhado em `_feira.js` (`essenceDoChefe`). */
export const essenceQtyOfBoss = (level: number): number => 5 + Math.floor(Math.max(1, Math.min(20, Math.floor(level) || 1)) / 5);

export interface EssenceDrop { id: string; qty: number }

/** Só a FORMA (a mesma do servidor): os chefes da Feira têm elemento próprio, fora dos 210 do dex, e dropam a essência dele. */
const isEssenceId = (id: unknown): id is string => typeof id === 'string' && /^[a-z_]{2,24}$/.test(id);

/** O drop de um inimigo a partir dos elementos e do estágio dele; `undefined` se o elemento não é identificável. */
export function essenceDropOfFoe(elements: readonly (string | undefined | null)[] | undefined | null, stage?: string | null): EssenceDrop | undefined {
  const id = elementIdOfFoe(elements);
  return id ? { id, qty: essenceQtyOfStage(stage) } : undefined;
}

/** Forma segura (espelho exato de `sanitizeEssences` do servidor): chaves `[a-z_]{2,24}`, valores inteiros 1..teto, no máx. 211 chaves. */
export function sanitizeEssences(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[a-z_]{2,24}$/.test(k) || typeof v !== 'number' || !Number.isFinite(v)) continue;
    const q = Math.min(ESSENCE_MAX_PER_ELEMENT, Math.floor(v));
    if (q < 1) continue;
    out[k] = q;
    if (++n >= ESSENCE_MAX_KEYS) break;
  }
  return out;
}

/** Teto do acumulado GASTO por elemento (sanidade). Monotônico no servidor: é o que permite o saldo `essences` baixar sem reabrir o furo. */
export const ESSENCE_SPENT_MAX_PER_ELEMENT = 1_000_000_000;

/** `GameState.essenceSpent`: quanto de cada essência já foi GASTO na vida (só cresce). Mesma forma de `essences`, teto próprio. Espelho: `_essences.js`. */
export function sanitizeEssenceSpent(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[a-z_]{2,24}$/.test(k) || typeof v !== 'number' || !Number.isFinite(v)) continue;
    const q = Math.min(ESSENCE_SPENT_MAX_PER_ELEMENT, Math.floor(v));
    if (q < 1) continue;
    out[k] = q;
    if (++n >= ESSENCE_MAX_KEYS) break;
  }
  return out;
}

export interface EssenceAway { day: string; count: number }
export function sanitizeEssenceAway(raw: unknown): EssenceAway | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { day?: unknown; count?: unknown };
  if (typeof r.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day) || typeof r.count !== 'number' || !Number.isFinite(r.count)) return undefined;
  return { day: r.day, count: Math.min(999, Math.max(0, Math.floor(r.count))) };
}

type EssenceState = { essences?: Record<string, number>; essenceAway?: EssenceAway; essenceSpent?: Record<string, number> };

/** Soma drops (ids fora do catálogo e qty<1 são ignorados). Nada novo → o MESMO objeto. */
export function applyEssences<T extends EssenceState>(prev: T, drops: readonly (EssenceDrop | undefined)[]): T {
  const have = prev.essences ?? {};
  let next: Record<string, number> | null = null;
  for (const d of drops) {
    if (!d || !isEssenceId(d.id) || !(d.qty >= 1)) continue;
    next ??= { ...have };
    next[d.id] = Math.min(ESSENCE_MAX_PER_ELEMENT, (next[d.id] ?? 0) + Math.floor(d.qty));
  }
  return next ? { ...prev, essences: next } : prev;
}

/** A versão da descida AUTOMÁTICA: corta o que passar do teto do dia (`dayKey` = dia do jogador) e conta o que entrou. */
export function applyEssencesAway<T extends EssenceState>(prev: T, drop: EssenceDrop | undefined, dayKey: string): T {
  if (!drop || !isEssenceId(drop.id) || !(drop.qty >= 1)) return prev;
  const cur = sanitizeEssenceAway(prev.essenceAway);
  const used = cur && cur.day === dayKey ? cur.count : 0;
  const room = ESSENCE_AWAY_DAILY_CAP - used;
  if (room <= 0) return prev;
  const qty = Math.min(room, Math.floor(drop.qty));
  const comDrop = applyEssences(prev, [{ id: drop.id, qty }]);
  return { ...comDrop, essenceAway: { day: dayKey, count: used + qty } };
}

/** Nome da essência (EN/PT): o do elemento; `pesadelo` tem o seu. */
export function essenceName(id: string, isPt: boolean): string {
  if (id === NIGHTMARE_ELEMENT) return isPt ? 'Essência de Pesadelo' : 'Nightmare Essence';
  const el = BASE_ELEMENT_IDS.includes(id) ? elementLabel(id, isPt) : (isPt ? elementoNomeDe(id).pt : elementoNomeDe(id).en);
  return isPt ? `Essência de ${el}` : `${el} Essence`;
}

/**
 * GASTAR essências (30/10/2026, Poção de Elemento): desconta do saldo e soma ao acumulado `essenceSpent`. Tudo-ou-nada: se qualquer
 * custo passa do saldo, devolve `null` (quem chama decide). O servidor deixa o saldo baixar SÓ pelo aumento de `essenceSpent`.
 */
export function spendEssences<T extends EssenceState>(prev: T, cost: readonly EssenceDrop[]): T | null {
  const have = { ...(prev.essences ?? {}) };
  const spent = { ...(prev.essenceSpent ?? {}) };
  for (const c of cost) {
    if (!isEssenceId(c.id) || !(c.qty >= 1)) continue;
    const q = Math.floor(c.qty);
    if ((have[c.id] ?? 0) < q) return null;
    have[c.id] -= q;
    if (have[c.id] <= 0) delete have[c.id];
    spent[c.id] = Math.min(ESSENCE_SPENT_MAX_PER_ELEMENT, (spent[c.id] ?? 0) + q);
  }
  return { ...prev, essences: have, essenceSpent: spent };
}
