/**
 * Espelho no servidor do cooldown/buff do 🌀 Glitchtama (design de 10/11/2026): `glitchtamaUsadoEm` = instante (ms epoch) do último uso;
 * buff de +10% na progressão e cooldown de 7 dias partem dele (cliente: `src/utils/glitchtamaBuff.ts`).
 *
 * O servidor só LEMBRA (o save é local-first; ADR-006 §D5). O timestamp é MONOTÔNICO: só anda para a frente, então apagar o save local,
 * voltar o relógio ou subir uma versão "limpa" NÃO reabre o uso. Um instante mais de 1 dia à frente do relógio do SERVIDOR é recusado
 * (mantém o gravado): adiantar o relógio do aparelho não pode trancar o item por semanas nem inventar um buff futuro.
 * Campo ausente/lixo no que chegou → mantém o gravado. Pages Functions não importam de `src/`: a FORMA é copiada e travada por `glitchtama.parity.test.js`.
 */
export const GLITCHTAMA_JANELA_MS = 7 * 24 * 60 * 60 * 1000;
const FOLGA_FUTURO_MS = 24 * 60 * 60 * 1000;

/** @param {unknown} v @returns {number|undefined} */
export function sanitizeGlitchtamaUsadoEm(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : undefined;
}

/**
 * @param {unknown} recebido o que o cliente mandou
 * @param {unknown} gravado  o que o servidor já tinha
 * @param {number} [nowMs]
 * @returns {number|undefined}
 */
export function enforceGlitchtamaUsadoEm(recebido, gravado, nowMs = Date.now()) {
  const g = sanitizeGlitchtamaUsadoEm(gravado);
  let r = sanitizeGlitchtamaUsadoEm(recebido);
  if (r !== undefined && r > nowMs + FOLGA_FUTURO_MS) r = undefined;
  if (r === undefined) return g;
  if (g === undefined) return r;
  return Math.max(r, g);
}
