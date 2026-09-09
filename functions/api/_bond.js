import { kv } from './_kv.js';
/**
 * A curva do Vínculo, do lado do SERVIDOR — e só a parte que o gate precisa.
 *
 * Por que é uma segunda implementação (o footgun 9 diz que regra copiada
 * diverge em silêncio): Pages Functions não importam de `src/` — é a mesma
 * restrição que `functions/api/metrics.js` já registra, e o precedente do
 * projeto para esse caso é **copiar o mínimo e travar o encontro por teste de
 * PARIDADE COMPORTAMENTAL** (`functions/api/saveId.parity.test.js` faz isso com
 * as três derivações de `saveId`).
 *
 * O teste é `functions/api/bond.parity.test.js`: ele varre milhares de valores
 * de `totalXP` e exige que este arquivo e `src/utils/bond.ts` respondam o MESMO
 * nível. Se alguém recalibrar a curva de um lado só, o teste cai — que é o
 * único jeito de uma cópia ser aceitável.
 *
 * O que NÃO foi copiado, de propósito: tabela de XP por evento, tetos diários,
 * escada de recompensas e títulos. O servidor não concede XP nem entrega
 * recompensa — ele só responde "esta conta já cruzou o limiar social?".
 */

/** Espelho de `BOND_EARLY_STEPS` (`src/utils/bond.ts`). */
const EARLY_STEPS = [75, 125, 200, 300, 400];
const STEP_BASE = 400;
const STEP_GROWTH = 100;

/** Nível mínimo para LIGAR o PvP. Espelho de `BOND_PVP_MIN_LEVEL`. */
export const BOND_PVP_MIN_LEVEL = 5;

/** @param {number} level */
function stepFor(level) {
  if (level <= 0) return 0;
  if (level <= EARLY_STEPS.length) return EARLY_STEPS[level - 1];
  return STEP_BASE + STEP_GROWTH * (level - EARLY_STEPS.length);
}

/**
 * XP acumulado necessário para ESTAR no nível `n`. `xpForLevel(1) === 0`.
 * @param {number} n
 */
/** Espelho de `BOND_MAX_LEVEL` (`src/utils/bond.ts`) — o porquê está lá, e é
 *  CUSTO DE CPU: `totalXP` vem do save, que o cliente escreve, e sem teto o
 *  laço quadrático custava 183 ms de CPU medidos para `1e10`. Este caminho roda
 *  no `action=profile` do `community.js`, a cada cloud save. */
export const BOND_MAX_LEVEL = 1000;

export function xpForLevel(n) {
  const level = Math.min(BOND_MAX_LEVEL, Math.max(1, Math.floor(Number.isFinite(n) ? n : 1)));
  let total = 0;
  for (let k = 1; k < level; k++) total += stepFor(k);
  return total;
}

/**
 * O nível derivado de `totalXP` — nunca persistido, nem aqui nem no save.
 * @param {unknown} totalXP
 */
export function bondLevelFor(totalXP) {
  const xp = typeof totalXP === 'number' && Number.isFinite(totalXP) ? Math.max(0, totalXP) : 0;
  // Acumula em vez de recalcular — o mesmo número em O(nível) em vez de
  // O(nível²). Ver `src/utils/bond.ts`; a paridade é travada por
  // `bond.parity.test.js`, e é ela que impede as duas curvas de divergirem.
  let level = 1;
  let acumulado = 0;
  while (level < BOND_MAX_LEVEL) {
    acumulado += stepFor(level);     // == xpForLevel(level + 1)
    if (xp < acumulado) break;
    level++;
  }
  return level;
}

/**
 * O Vínculo do save gravado na KV já libera o PvP?
 *
 * Lê o save do jogador (chave = saveId, escrita por `functions/api/save.js`) e
 * deriva. Save ausente, ilegível ou com `totalXP` forjado como string/NaN
 * responde `false`: ausência de prova não é prova.
 *
 * ⚠️ Limite honesto desta trava: `totalXP` é escrito pelo cliente no cloud
 * save, então ela barra o cliente que só forja o `pvpEnabled` do `POST profile`
 * — não o que forja o save inteiro. Fechar isso exige o servidor virar dono do
 * XP (fatia de confiança do save na nuvem), e é outro trabalho.
 *
 * @param {{ SOULMON_SAVES?: { get: (k: string) => Promise<string | null> }, DIGIAPP_SAVES?: { get: (k: string) => Promise<string | null> } }} env
 * @param {string} saveId
 */
export async function bondLevelOf(env, saveId) {
  try {
    const raw = await kv(env).get(saveId);
    if (!raw) return 0;
    const state = JSON.parse(raw);
    if (!state || typeof state !== 'object') return 0;
    return bondLevelFor(state.totalXP);
  } catch {
    return 0;
  }
}
