/**
 * Forma segura do estado dos PESADELOS no save (15/10/2026: ciclo do SONHO BOM a cada 6 dias de pesadelo).
 * ESPELHO de `sanitizeNightmareState` em `src/utils/nightmares.ts` (um teste de paridade roda os dois sobre as mesmas
 * entradas). Nunca lança e nunca recusa o save: lixo vira o estado vazio; o que não tem forma é descartado campo a campo.
 */
export const MAX_FOUGHT_HISTORY = 30;
export const NIGHTMARE_CYCLE_DAYS = 6;
export const MAX_GOOD_DREAMS = 9999;

const strs = (v, max) => (Array.isArray(v)
  ? [...new Set(v.filter((x) => typeof x === 'string' && x.length > 0 && x.length <= 64))].slice(-max)
  : []);

/** @param {unknown} raw */
export function sanitizeNightmares(raw) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? /** @type {Record<string, unknown>} */ (raw) : {};
  /** @type {Record<string, unknown>} */
  const out = { fought: strs(r.fought, MAX_FOUGHT_HISTORY) };
  if (typeof r.pending === 'string' && r.pending.length > 0 && r.pending.length <= 64) out.pending = r.pending;
  const days = strs(r.lurkDays, NIGHTMARE_CYCLE_DAYS);
  if (days.length) out.lurkDays = days;
  if (r.goodDream === true) out.goodDream = true;
  const n = typeof r.goodDreams === 'number' && Number.isFinite(r.goodDreams) ? Math.min(MAX_GOOD_DREAMS, Math.max(0, Math.floor(r.goodDreams))) : 0;
  if (n > 0) out.goodDreams = n;
  return out;
}
