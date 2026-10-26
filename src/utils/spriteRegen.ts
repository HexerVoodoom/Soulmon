/**
 * "Gerar de novo" a aparência — a regra PURA do cliente (rodada 5, Lane B; REGISTRO §34b).
 *
 * É um sorteio pago da imagem da forma ATUAL, com o mesmo prompt: 50 Créditos, 1 por forma por mês, só conta paga. Quem manda de verdade é o
 * servidor (`functions/api/_spriteRegen.js`: débito antes, devolução se falhar, cota do mês, tier); o que mora aqui é só o que a tela precisa
 * para decidir o que mostrar e para falar a verdade sobre o que aconteceu. Nada aqui gasta dinheiro nem decide cota.
 */
import type { SpriteLibrary } from './spriteLibrary';

/** Créditos por regeração. Espelho de `SPRITE_REGEN.costCredits` (`_spriteRegen.js`), travado por `functions/api/spriteRegen.parity.test.js`. */
export const SPRITE_REGEN_COST_CREDITS = 50;

const FORM_ID = /^(?:rookie|ultra|(?:champion|ultimate|mega)-(?:power|harmony|benevolence))$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** O mês (UTC, o mesmo do servidor) de um instante: `AAAA-MM`. */
export function regenMonthOf(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 7);
}

/**
 * Forma do espelho `spriteLibrary.regenUsed` (leitura tolerante do save, local OU nuvem — dado não confiável): só formas válidas → `AAAA-MM`.
 * Espelho de `sanitizeRegenUsed` do servidor (`_spriteRegen.js`); a paridade é travada por `spriteRegen.parity.test.js`.
 */
export function sanitizeRegenUsed(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [formId, month] of Object.entries(raw as Record<string, unknown>)) {
    if (FORM_ID.test(formId) && typeof month === 'string' && MONTH.test(month)) out[formId] = month;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Marca (no espelho do save) que a forma usou a regeração deste mês. */
export function markRegenUsed(lib: SpriteLibrary, formId: string, month: string): SpriteLibrary {
  return { ...lib, regenUsed: { ...(lib.regenUsed ?? {}), [formId]: month } };
}

/** Tira a marca (o servidor devolveu o débito e a cota). */
export function clearRegenUsed(lib: SpriteLibrary, formId: string): SpriteLibrary {
  if (!lib.regenUsed || !(formId in lib.regenUsed)) return lib;
  const { [formId]: _fora, ...resto } = lib.regenUsed;
  const next = { ...lib };
  if (Object.keys(resto).length > 0) next.regenUsed = resto; else delete next.regenUsed;
  return next;
}

export type RegenAvailability =
  /** A conta não é paga (ou é demo): o botão nem aparece. */
  | 'hidden'
  /** Há uma nova esperando a escolha (manter a atual ou usar a nova). */
  | 'choosing'
  /** Pode gerar de novo. */
  | 'ok'
  /** Pode, mas falta saldo: o toque abre os Créditos. */
  | 'no-credits'
  /** Esta forma já usou a regeração deste mês. */
  | 'month-used'
  /** Uma geração está em andamento. */
  | 'busy';

export interface RegenAvailabilityInput {
  accountTier: 'demo' | 'paid' | undefined;
  credits: number;
  library: SpriteLibrary;
  /** A forma atual. */
  formId: string;
  now?: number;
  /** Uma geração (a do lote ou esta) está em andamento. */
  busy: boolean;
}

/**
 * O que a tela mostra. Esconde o botão de quem não paga e de quem não tem o que gerar de novo (a 1ª geração é a gratuita e acontece sozinha).
 * A cota do mês aqui é só o ESPELHO do save: o servidor confere de novo (429 `regen-monthly-limit`) e é ele que decide.
 */
export function regenAvailability(i: RegenAvailabilityInput): RegenAvailability {
  if (i.accountTier !== 'paid') return 'hidden';
  if (!i.library.sprites[i.formId]) return 'hidden';
  if (i.library.pendingTune?.formId === i.formId && i.library.previousSprites?.[i.formId]) return 'choosing';
  if (i.library.regenUsed?.[i.formId] === regenMonthOf(i.now)) return 'month-used';
  if (i.busy) return 'busy';
  if (!(i.credits >= SPRITE_REGEN_COST_CREDITS)) return 'no-credits';
  return 'ok';
}

/** O resultado de um pedido, em linguagem da tela (a cópia fica no componente). */
export type RegenOutcome =
  | { kind: 'done'; credits?: number }
  /** O servidor não cobrou (ou devolveu): saldo igual ao de antes. */
  | { kind: 'not-charged'; why: 'month-used' | 'no-credits' | 'not-paid' | 'no-first' | 'busy' | 'failed' | 'offline' | 'unavailable' };

/** Traduz o `SpriteGenError` do modo `regenPaid` (código do servidor em `message`, status em `status`). */
export function regenFailureWhy(status: number, code: string): Extract<RegenOutcome, { kind: 'not-charged' }>['why'] {
  if (status === 0) return 'offline';
  if (status === 202) return 'busy';
  if (code === 'regen-monthly-limit') return 'month-used';
  if (code === 'insufficient-credits') return 'no-credits';
  if (code === 'paid-tier-required') return 'not-paid';
  if (code === 'sprite-regen-disabled' || code === 'sprite-disabled') return 'unavailable';
  if (code === 'regen-needs-first-generation') return 'no-first';
  return 'failed';
}

/** Um id por GESTO (o servidor guarda `regenOps[opId]`: repetir o gesto nunca cobra de novo). 8–64 de `[A-Za-z0-9_-]`. */
export function newRegenOpId(): string {
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return `rg${uuid.replace(/-/g, '')}`;
  } catch { /* fallback abaixo */ }
  return `rg${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}
