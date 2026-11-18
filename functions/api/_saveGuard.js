/**
 * GUARDA DE REGRESSAO DO SAVE (incidente de 17/11/2026).
 *
 * Um estado VAZIO (rookie, totalXP 0) foi gravado por cima do save real (put cego) e depois adotado por outro aparelho.
 * Aqui o servidor deixa de aceitar, sem gesto explicito, a troca de um save COM progresso por um SEM progresso (ou com
 * totalXP < 50% do gravado). Antes de qualquer regressao (recusada ou permitida) o raw anterior vai para
 * `savebak:<saveId>:<ts>` (TTL 30 dias, no maximo 5 por save).
 *
 * `saveTemProgresso` ESPELHA `src/utils/backupRing.ts` (teste de paridade em `save.guardaRegressao.test.js`).
 * @module
 */

export const SAVEBAK_TTL_SECONDS = 86400 * 30;
export const SAVEBAK_MAX = 5;
/** Regressao de XP: o novo `totalXP` abaixo desta fracao do gravado conta como regressao. */
export const REGRESSAO_FRACAO_XP = 0.5;
/** Intencoes explicitas aceitas em `?allowRegression=`. Qualquer outro valor = sem intencao. */
export const INTENCOES_REGRESSAO = ['restore', 'rebirth', 'reset'];

const ehObjeto = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Mesma regua de `saveTemProgresso` (cliente, `backupRing.ts`). */
export function saveTemProgresso(state) {
  if (!ehObjeto(state)) return false;
  const len = (v) => (Array.isArray(v) ? v.length : 0);
  return !!state.soulmonMeta || !!state.demoCharacterId
    || len(state.activities) > 0 || len(state.completedTasks) > 0
    || (typeof state.totalXP === 'number' && state.totalXP > 0);
}

const xpDe = (s) => (ehObjeto(s) && typeof s.totalXP === 'number' && Number.isFinite(s.totalXP) ? s.totalXP : 0);

/**
 * `null` = sem regressao. Senao `{ motivo }`.
 * @param {unknown} gravado state ja gravado (parseado)
 * @param {unknown} novo state que chegou (ja sanitizado)
 */
export function detectarRegressao(gravado, novo) {
  if (!saveTemProgresso(gravado)) return null;
  if (!saveTemProgresso(novo)) return { motivo: 'sem-progresso' };
  const antes = xpDe(gravado);
  if (antes > 0 && xpDe(novo) < antes * REGRESSAO_FRACAO_XP) return { motivo: 'xp-caiu' };
  return null;
}

/** Valor de `?allowRegression=` se for uma intencao conhecida; senao `null`. */
export function intencaoDeRegressao(url) {
  const v = url.searchParams.get('allowRegression');
  return INTENCOES_REGRESSAO.includes(v) ? v : null;
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Guarda o raw anterior em `savebak:<saveId>:<ts>` (melhor esforco: nunca lanca). Idempotente: se o backup mais novo ja e
 * este mesmo raw (hash), nao escreve de novo (tentativa recusada em loop nao consome escrita). Poda para `SAVEBAK_MAX`.
 * @returns {Promise<boolean>} true se ha backup deste raw ao fim (novo ou ja existente)
 */
export async function guardarBackupAntesDeRegressao(store, saveId, raw, agora = Date.now()) {
  try {
    if (typeof raw !== 'string' || !raw) return false;
    const h = await sha256Hex(raw);
    const prefixo = `savebak:${saveId}:`;
    let chaves = [];
    try {
      const page = await store.list({ prefix: prefixo, limit: 100 });
      chaves = (page?.keys ?? []).slice().sort((a, b) => (a.name < b.name ? -1 : 1));
    } catch { chaves = []; }
    const ultimo = chaves[chaves.length - 1];
    if (ultimo?.metadata?.h === h) return true;
    const nome = `${prefixo}${String(agora).padStart(13, '0')}`;
    await store.put(nome, raw, { expirationTtl: SAVEBAK_TTL_SECONDS, metadata: { h, t: agora } });
    const todas = [...chaves, { name: nome }];
    const excesso = todas.length - SAVEBAK_MAX;
    for (let i = 0; i < excesso; i++) await store.delete(todas[i].name).catch(() => {});
    return true;
  } catch (err) {
    console.warn('save: backup antes da regressao falhou', { saveIdPrefix: String(saveId).slice(0, 8), erro: String(err?.message ?? err) });
    return false;
  }
}
