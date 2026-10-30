/**
 * Essências dos elementos (28/10/2026, REGISTRO §183): `essences` é `Record<elementId, number>` (inteiros >= 1). Espelho de
 * `sanitizeEssences` (`src/utils/essences.ts`; paridade em `essences.parity.test.js`). O servidor garante a FORMA e que o campo é
 * MONOTÔNICO por elemento (`enforceEssences`; desde 30/10/2026 o saldo só baixa pelo aumento de `essenceSpent`): omitir o campo, apagar o save local ou mandar quantidade menor NÃO baixa o gravado.
 * Limite honesto: o save é do cliente, então um cliente adulterado ainda pode subi-las até o teto por elemento; as essências não
 * compram nada hoje (só coleta), e quando ganharem uso este arquivo é onde entra o teto de ganho por dia.
 */
export const ESSENCE_MAX_PER_ELEMENT = 1_000_000;
export const ESSENCE_MAX_KEYS = 211;

/** @param {unknown} raw @returns {Record<string, number>|undefined} sem forma de objeto = undefined (campo descartado) */
export function sanitizeEssences(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  /** @type {Record<string, number>} */
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (!/^[a-z_]{2,24}$/.test(k) || typeof v !== 'number' || !Number.isFinite(v)) continue;
    const q = Math.min(ESSENCE_MAX_PER_ELEMENT, Math.floor(v));
    if (q < 1) continue;
    out[k] = q;
    if (++n >= ESSENCE_MAX_KEYS) break;
  }
  return out;
}

export const ESSENCE_SPENT_MAX_PER_ELEMENT = 1_000_000_000;

/** `essenceSpent` (30/10/2026): acumulado GASTO por elemento, só cresce. Mesma forma de `sanitizeEssences`, teto próprio. @param {unknown} raw */
export function sanitizeEssenceSpent(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  /** @type {Record<string, number>} */
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (!/^[a-z_]{2,24}$/.test(k) || typeof v !== 'number' || !Number.isFinite(v)) continue;
    const q = Math.min(ESSENCE_SPENT_MAX_PER_ELEMENT, Math.floor(v));
    if (q < 1) continue;
    out[k] = q;
    if (++n >= ESSENCE_MAX_KEYS) break;
  }
  return out;
}

/** O gasto acumulado é monotônico por elemento (o maior entre o que chegou e o gravado). @param {unknown} incoming @param {unknown} stored */
export function enforceEssenceSpent(incoming, stored) {
  const inc = sanitizeEssenceSpent(incoming);
  const sto = sanitizeEssenceSpent(stored);
  if (!inc) return sto;
  if (!sto) return inc;
  const out = { ...inc };
  for (const [k, v] of Object.entries(sto)) {
    if (!(k in out) && Object.keys(out).length >= ESSENCE_MAX_KEYS) continue;
    out[k] = Math.max(out[k] ?? 0, v);
  }
  return out;
}

/**
 * Saldo por elemento: antes só crescia; agora pode BAIXAR, mas só pelo quanto o acumulado GASTO subiu em relação ao gravado
 * (`out[k] = max(inc[k], stored[k] - (incSpent[k] - storedSpent[k]))`). Sem aumento de gasto o comportamento é o monotônico de antes.
 * Reverter o cliente (rollback) nunca devolve nem cria essência: o gasto não desce e o saldo gravado só cai pelo gasto declarado.
 * @param {unknown} incoming @param {unknown} stored @param {unknown} [incomingSpent] @param {unknown} [storedSpent]
 */
export function enforceEssences(incoming, stored, incomingSpent, storedSpent) {
  const inc = sanitizeEssences(incoming);
  const sto = sanitizeEssences(stored);
  if (!inc) return sto;
  if (!sto) return inc;
  const sp = enforceEssenceSpent(incomingSpent, storedSpent) ?? {};
  const spOld = sanitizeEssenceSpent(storedSpent) ?? {};
  const out = { ...inc };
  for (const [k, v] of Object.entries(sto)) {
    if (!(k in out) && Object.keys(out).length >= ESSENCE_MAX_KEYS) continue;
    const gasto = Math.max(0, (sp[k] ?? 0) - (spOld[k] ?? 0));
    const q = Math.max(out[k] ?? 0, v - gasto);
    if (q >= 1) out[k] = q; else delete out[k];
  }
  return out;
}
