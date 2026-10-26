// "Gerar de novo" a aparência (rodada 5, Lane B; REGISTRO §34b).
//
// Um SORTEIO PAGO da imagem da forma ATUAL, com o mesmo prompt: 50 Créditos (dinheiro real), 1 por forma por MÊS, só conta paga.
// A 1ª geração de cada forma continua gratuita e regida por `AI_LIMITS.sprite.perFormLifetime` (§34) — esta cota é OUTRA, mensal, e
// mora aqui (e não dentro de `AI_LIMITS.sprite`) porque os testes de guard travam a FORMA exata de `AI_LIMITS.sprite`.
//
// "COBRA ANTES E ACEITA O SORTEIO": o débito sai do servidor, ANTES de gerar, idempotente por `opId`; se a geração falhar (qualquer
// motivo, inclusive recusa de conteúdo: não saiu imagem), o débito VOLTA, também idempotente. Tudo mora no `ent:<saveId>` (que só
// o servidor escreve) e em UMA escrita por transição — débito + cota do mês + marca do `opId` entram juntos, e a devolução desfaz os
// três juntos. Por isso não há janela em que o dinheiro saiu e a marca não existe (ou o contrário), e repetir a devolução não credita
// duas vezes.
//
// Campos novos do `ent:` (opcionais; registro antigo sem eles segue válido, leitura tolerante):
//   · `aiRegen  { [formId]: 'AAAA-MM' }`            — o mês em que a forma já usou a regeração paga (sobrevive à exclusão da conta);
//   · `regenOps { [opId]: { s, f, m, at } }`        — marcas de idempotência dos últimos gestos (s: 'debited'|'done'|'refunded').

import { readEntitlement, writeEntitlement } from './_entitlements.js';
import { VALID_FORM_ID } from './_aiGuard.js';
import { legacyFormIdOf } from './_branchLegacy.js';

export const SPRITE_REGEN = Object.freeze({
  /** Créditos cobrados por regeração. Espelho de `SPRITE_REGEN_COST_CREDITS` (`src/utils/spriteRegen.ts`), travado por `spriteRegen.parity.test.js`. */
  costCredits: 50,
  /** Regerações pagas por forma por mês (UTC). */
  perFormPerMonth: 1,
});

/** Mesmo formato do `opId` do `spendCredits`. */
export const REGEN_OP_RE = /^[A-Za-z0-9_-]{8,64}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
/** Quantas marcas de `opId` ficam no `ent:` (as mais recentes). */
const REGEN_OPS_KEEP = 16;
/** Um `debited` mais velho que isto, sem ter virado `done`, é um Worker que caiu no meio: a unidade é devolvida. */
export const REGEN_STALE_MS = 5 * 60_000;

export const regenMonthOf = (now = Date.now()) => new Date(now).toISOString().slice(0, 7);

/**
 * Forma do campo `aiRegen` (e do espelho `spriteLibrary.regenUsed` do save): só formas válidas → mês `AAAA-MM`. Lixo some.
 * Espelho de `sanitizeRegenUsed` (`src/utils/spriteRegen.ts`); a paridade é travada por `spriteRegen.parity.test.js`.
 * @param {unknown} raw @returns {Record<string,string>|undefined}
 */
export function sanitizeRegenUsed(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  /** @type {Record<string,string>} */
  const out = {};
  for (const [formId, month] of Object.entries(raw)) {
    if (VALID_FORM_ID.test(formId) && typeof month === 'string' && MONTH_RE.test(month)) out[formId] = month;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function opsOf(ent) {
  return ent.regenOps && typeof ent.regenOps === 'object' && !Array.isArray(ent.regenOps) ? { ...ent.regenOps } : {};
}

function podarOps(ops) {
  const ids = Object.keys(ops);
  if (ids.length <= REGEN_OPS_KEEP) return ops;
  ids.sort((a, b) => (Number(ops[b]?.at) || 0) - (Number(ops[a]?.at) || 0));
  return Object.fromEntries(ids.slice(0, REGEN_OPS_KEEP).map(k => [k, ops[k]]));
}

/** Já houve uma 1ª geração desta forma (a regeração paga é "de novo", não um jeito de pagar pela 1ª)? */
function temPrimeiraGeracao(ent, formId) {
  const antigo = legacyFormIdOf(formId);
  return Number(ent.aiForms?.[formId] ?? 0) >= 1 || (antigo ? Number(ent.aiForms?.[antigo] ?? 0) >= 1 : false);
}

/**
 * RESERVA: confere (op repetida, só-paga já foi conferido pela rota, 1ª geração, cota do mês, saldo) e DEBITA, numa escrita só.
 *
 * @returns {Promise<
 *   { ok: true, credits: number, month: string }
 * | { ok: false, status: number, reason: string, op?: { s: string, f: string, m: string, at: number } }>}
 */
export async function reserveRegen(env, saveId, formId, opId, now = Date.now()) {
  if (typeof opId !== 'string' || !REGEN_OP_RE.test(opId)) return { ok: false, status: 400, reason: 'regen-op-id-required' };
  const ent = await readEntitlement(env, saveId);
  const ops = opsOf(ent);
  // Repetição do MESMO gesto: nunca debita de novo. Quem chama decide o que responder (imagem guardada, "ainda gerando", etc.).
  if (ops[opId]) return { ok: false, status: 409, reason: 'regen-duplicate', op: ops[opId] };
  if (ent.tier !== 'paid') return { ok: false, status: 402, reason: 'paid-tier-required' };
  if (!temPrimeiraGeracao(ent, formId)) return { ok: false, status: 409, reason: 'regen-needs-first-generation' };
  const month = regenMonthOf(now);
  const usados = sanitizeRegenUsed(ent.aiRegen) ?? {};
  if (usados[formId] === month) return { ok: false, status: 429, reason: 'regen-monthly-limit' };
  if (!(ent.credits >= SPRITE_REGEN.costCredits)) return { ok: false, status: 402, reason: 'insufficient-credits' };
  ent.credits -= SPRITE_REGEN.costCredits;
  ent.aiRegen = { ...usados, [formId]: month };
  ent.regenOps = podarOps({ ...ops, [opId]: { s: 'debited', f: formId, m: month, at: now } });
  await writeEntitlement(env, saveId, ent);
  return { ok: true, credits: ent.credits, month };
}

/** A imagem chegou ao jogador: o gesto fica `done` (uma repetição do `opId` devolve a imagem guardada, não gera nem cobra de novo). */
export async function completeRegen(env, saveId, opId) {
  const ent = await readEntitlement(env, saveId);
  const ops = opsOf(ent);
  if (!ops[opId] || ops[opId].s !== 'debited') return;
  ops[opId] = { ...ops[opId], s: 'done' };
  ent.regenOps = ops;
  await writeEntitlement(env, saveId, ent);
}

/**
 * DEVOLUÇÃO: só desfaz um gesto que está `debited`. Idempotente (a 2ª chamada vê `refunded` ou `done` e não mexe em nada).
 * Devolve os Créditos E a cota do mês daquela forma (o sorteio não aconteceu) — a cota só é limpa se ainda for a deste gesto.
 * @returns {Promise<{ refunded: boolean, credits?: number }>}
 */
export async function refundRegen(env, saveId, opId) {
  const ent = await readEntitlement(env, saveId);
  const ops = opsOf(ent);
  const op = ops[opId];
  if (!op || op.s !== 'debited') return { refunded: false };
  ent.credits += SPRITE_REGEN.costCredits;
  const usados = sanitizeRegenUsed(ent.aiRegen) ?? {};
  if (usados[op.f] === op.m) delete usados[op.f];
  ent.aiRegen = usados;
  ops[opId] = { ...op, s: 'refunded' };
  ent.regenOps = ops;
  await writeEntitlement(env, saveId, ent);
  return { refunded: true, credits: ent.credits };
}
