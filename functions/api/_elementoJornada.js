/**
 * Espelho de `src/utils/elementoJornada.ts` (REGISTRO §232): forma do registro no save e imutabilidade. A sorte e cada estágio já gravados no
 * servidor não são reescritos pelo cliente (anti-reroll). NUNCA recusa o save: o que não tem forma vira ausente.
 */
import { ELEMENTOS_FICHA } from './_duel.js';

const ESTAGIOS = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
/** @param {unknown} id */
const ok = id => typeof id === 'string' && ELEMENTOS_FICHA.has(id);

/** @param {unknown} raw */
export function sanitizeElementoJornada(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = /** @type {any} */ (raw);
  if (typeof r.u !== 'number' || !Number.isFinite(r.u) || r.u < 0 || r.u >= 1) return undefined;
  if (!r.estagios || typeof r.estagios !== 'object' || Array.isArray(r.estagios)) return undefined;
  /** @type {Record<string, {id: string, base: string}>} */
  const estagios = {};
  for (const st of ESTAGIOS) {
    const e = r.estagios[st];
    if (e && ok(e.id) && ok(e.base)) estagios[st] = { id: e.id, base: e.base };
  }
  return { v: 1, u: r.u, estagios };
}

/** @param {unknown} incoming @param {unknown} stored */
export function enforceImmutableElementoJornada(incoming, stored) {
  const novo = sanitizeElementoJornada(incoming);
  const antigo = sanitizeElementoJornada(stored);
  if (!novo || !antigo) return novo;
  return { v: 1, u: antigo.u, estagios: { ...novo.estagios, ...antigo.estagios } };
}
