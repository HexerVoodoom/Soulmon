/**
 * Geração GRÁTIS do rookie por e-mail (Onboarding Velado D6/D20; plano §5/§12).
 *
 * Chave `freeGen:<saveId>` (saveId já é hash de e-mail, nada pessoal). NUNCA é apagada com a conta
 * (a exclusão não toca neste prefixo): apagar e recriar devolve o MESMO sprite e não dá outra geração.
 * Idempotente: a 2ª chamada devolve a mesma imagem. Sem imagem do BB como referência (D20).
 */
export const FREEGEN_PREFIX = 'freeGen:';
export const freeGenKey = saveId => `${FREEGEN_PREFIX}${saveId}`;

/**
 * @param {{get:Function,put:Function}} store KV
 * @param {string} saveId
 * @param {() => Promise<{image?: string, provider?: string} | null>} generate gera SEM referência; null/lança = falhou
 * @returns {Promise<{image: string, cached: boolean} | {image: null, fallback: true}>}
 */
export async function freeRookie(store, saveId, generate) {
  const k = freeGenKey(saveId);
  const raw = await store.get(k);
  if (raw) {
    try { const g = JSON.parse(raw); if (g?.image) return { image: g.image, cached: true }; } catch { /* corrompida: gera */ }
  }
  let r = null;
  try { r = await generate(); } catch { r = null; }
  if (!r?.image) return { image: null, fallback: true }; // cliente usa o inicial pronto; nada gravado, tenta de novo depois
  await store.put(k, JSON.stringify({ image: r.image, provider: r.provider ?? null, at: Date.now() })); // sem TTL
  return { image: r.image, cached: false };
}
