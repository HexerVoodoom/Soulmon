/**
 * EXCHANGER — itens "Recuperar energia" e "Recuperar vida" (decisão do dono, 24/11/2026; REGISTRO: reverte a D7+D15 de 06/09/2026
 * "sem cura por Créditos", tendo o TETO SEMANAL como contrapeso).
 *
 * Só Créditos (a moeda de dinheiro real): nada de Bits nem Honra. O servidor é a fonte de tudo:
 *  · QUAIS itens existem, o PREÇO e o TETO SEMANAL (`RECOVERY_ITEMS`; espelho de `src/utils/recoveryShop.ts`, com teste de paridade).
 *    O cliente manda só o `kind`; qualquer número do corpo é ignorado.
 *  · Preço: 150 Créditos cada = R$ 9,90 no pacote padrão de 150 Créditos (`CREDIT_PACKS`), o equivalente a ~R$ 10,00 pedido pelo dono
 *    (a conta: R$ 10,00 ÷ (R$ 9,90 ÷ 150) = 151,5 → 150).
 *  · Energia = a poção que devolve 5 de energia, ATÉ 5 POR SEMANA (25 de energia/semana; dono, 24/11/2026); vida = +1 coração, 1 por semana (mesmo preço).
 *  · SEMANA: a ISO do app (`semanaDe`, segunda a domingo, em UTC, a mesma chave das missões de Coop); o contador vira sozinho na
 *    segunda, sem job. Mora no PRÓPRIO `ent:<saveId>` (`ent.recov = { w, energy, life }`), na MESMA escrita do débito.
 *  · "Cheio" (energia/coração no máximo) é checado no CLIENTE (o servidor não lê o save por forma opaca): o app nem oferece a compra.
 *  · IDEMPOTÊNCIA por pedido (`opId` obrigatório), em `ent.recovOps`, na mesma escrita do débito (padrão de `buyBitsPack`).
 *  · Trava da conta (`tomarTravaDoEnt`, sem espera): duplo toque devolve `409 busy` e o cliente reenvia o mesmo opId.
 */
import { readEntitlement, writeEntitlement, tomarTravaDoEnt } from './_entitlements.js';
import { semanaDe } from './_coop.js';

/** Itens à venda. Espelho de `src/utils/recoveryShop.ts`. */
export const RECOVERY_ITEMS = {
  energy: { credits: 150, weeklyCap: 5, restores: 5 },
  life: { credits: 150, weeklyCap: 1, restores: 1 },
};
const OP_ID = /^[A-Za-z0-9_-]{8,64}$/;
const OPS_MAX = 20;

/** @param {unknown} kind @returns {'energy'|'life'|null} */
export function recoveryKind(kind) { return kind === 'energy' || kind === 'life' ? kind : null; }

/** Quantas compras do item já foram feitas NESTA semana ISO. @param {any} ent @param {'energy'|'life'} kind @param {number} nowMs */
export function recoveryBoughtThisWeek(ent, kind, nowMs = Date.now()) {
  const r = ent?.recov;
  if (!r || typeof r !== 'object' || r.w !== semanaDe(new Date(nowMs))) return 0;
  const n = Number(r[kind]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * Compra um item de recuperação com Créditos.
 * @param {{ admin?: boolean, nowMs?: number }} [opts]
 * @returns {Promise<
 *   | { ok: true, status: 200, kind: 'energy'|'life', restores: number, price: number, leftThisWeek: number, ent: any, replay?: boolean }
 *   | { ok: false, status: number, reason: 'bad-op'|'unknown-item'|'weekly-cap'|'insufficient'|'busy' }>}
 */
export async function buyRecovery(env, saveId, kindIn, opId, opts = {}) {
  const admin = opts.admin === true;
  const nowMs = typeof opts.nowMs === 'number' ? opts.nowMs : Date.now();
  if (typeof opId !== 'string' || !OP_ID.test(opId)) return { ok: false, status: 400, reason: 'bad-op' };
  const kind = recoveryKind(kindIn);
  if (!kind) return { ok: false, status: 400, reason: 'unknown-item' };
  const item = RECOVERY_ITEMS[kind];
  const lock = await tomarTravaDoEnt(env, saveId, { nowMs, esperaMs: 0 });
  if (!lock.ok) return { ok: false, status: 409, reason: 'busy' };
  try {
    const ent = await readEntitlement(env, saveId);
    const ops = Array.isArray(ent.recovOps) ? ent.recovOps.filter(o => o && typeof o === 'object') : [];
    const feito = ops.find(o => o.op === opId);
    if (feito) {
      const k = recoveryKind(feito.kind) ?? kind;
      const it = RECOVERY_ITEMS[k];
      return { ok: true, status: 200, kind: k, restores: it.restores, price: it.credits, leftThisWeek: Math.max(0, it.weeklyCap - recoveryBoughtThisWeek(ent, k, nowMs)), ent, replay: true };
    }
    const ja = recoveryBoughtThisWeek(ent, kind, nowMs);
    if (!admin && ja >= item.weeklyCap) return { ok: false, status: 409, reason: 'weekly-cap' };
    if (!admin) {
      if (!(Number(ent.credits) >= item.credits)) return { ok: false, status: 402, reason: 'insufficient' };
      ent.credits -= item.credits;
      const semana = semanaDe(new Date(nowMs));
      const base = ent.recov && ent.recov.w === semana ? ent.recov : { w: semana, energy: 0, life: 0 };
      ent.recov = { ...base, w: semana, [kind]: ja + 1 };
      ent.recovOps = [...ops, { op: opId, kind }].slice(-OPS_MAX);
      await writeEntitlement(env, saveId, ent);
    }
    return { ok: true, status: 200, kind, restores: item.restores, price: admin ? 0 : item.credits, leftThisWeek: admin ? item.weeklyCap : item.weeklyCap - (ja + 1), ent };
  } finally {
    await lock.release();
  }
}
