/**
 * Dex de elementos (27/10/2026): `defeatedElements` é a lista de ids de elementos já vencidos. Espelho de `sanitizeDefeatedElements`
 * (`src/utils/elementDex.ts`; paridade em `elementDex.parity.test.js`). Só a FORMA: strings `[a-z_]{2,24}`, sem repetir, teto 270.
 * Nunca recusa o save; sem forma de lista vira `undefined` (o campo é descartado).
 */
export const ELEMENT_DEX_MAX = 270; // 01/11/2026: + 50 curados + neutro na Biblioteca; 05/11/2026: + 6 do lote 4 + 3 promovidos

export function sanitizeDefeatedElements(raw) {
  if (!Array.isArray(raw)) return undefined;
  const out = [];
  for (const v of raw) {
    if (typeof v === 'string' && /^[a-z_]{2,24}$/.test(v) && !out.includes(v)) out.push(v);
    if (out.length >= ELEMENT_DEX_MAX) break;
  }
  return out;
}
