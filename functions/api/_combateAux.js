// Auxiliares do espelho de combate (extraídos de _combate.js para ficar abaixo de 500 linhas): escudo, torcida e companheiro. Re-exportados por _combate.js.
export const SPECIAL_BUDGET_HITS = 3;
/** §327: espelho de `SHIELD_DIRECT_SPECIAL_ABSORB`/`SHIELD_ABSORB`/`shieldAbsorbPoints` (básico 1, especial direto 0,5, tick de DoT 0,5). */
export const SHIELD_DIRECT_SPECIAL_ABSORB = 0.5;
export const SHIELD_DOT_TICK_ABSORB = 0.5;
export const SHIELD_ABSORB = Object.freeze({ basic: 1, direct: SHIELD_DIRECT_SPECIAL_ABSORB, tick: SHIELD_DOT_TICK_ABSORB });
/** @param {number} sh @param {number} d @param {'basic'|'direct'|'tick'} src */
export function shieldAbsorbPoints(sh, d, src) {
  return sh > 0 ? Math.min(sh, Math.floor(d * SHIELD_ABSORB[src] + 1e-9)) : 0;
}
/** Torcida: 24 toques = 1 descarga; no maximo 16 toques por balde de 3 s. `pvpEnergyPerDischarge` e o rendimento do PvP. */
export const CHEER = {
  tapsFull: 24, tapsCapPerBucket: 16, bucketSeconds: 3, energyPerDischarge: 9, pvpEnergyPerDischarge: 2.5,
};
/** Marcas de toque (s) -> descargas. Toque alem do teto do balde e descartado; a cada `tapsFull` aceitos, 1 descarga. */
export const CHEER_SCALE_MAX = 1.15;

/** Tarefa B (§2.38): espelho de `START_ENERGY_MAX`/`DOT_RESIST_MAX` e dos limpadores de `combate/specials.ts`. */
export const START_ENERGY_MAX = 9;
export const DOT_RESIST_MAX = 0.18;
/** @param {unknown} x */
export function cleanStartEnergy(x) {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(START_ENERGY_MAX, Math.max(0, x)) : 0;
}
/** @param {unknown} x */
export function cleanDotResist(x) {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(DOT_RESIST_MAX, Math.max(0, x)) : 0;
}
export function cleanCheerScale(x) {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(CHEER_SCALE_MAX, Math.max(1, x)) : 1;
}
export function cheerEvents(taps, side, scale = 1) {
  const out = [];
  const k = cleanCheerScale(scale);
  const perBucket = new Map();
  let acc = 0;
  for (const tap of [...taps].filter((x) => Number.isFinite(x) && x >= 0).sort((x, y) => x - y)) {
    const b = Math.floor(tap / CHEER.bucketSeconds);
    const n = perBucket.get(b) ?? 0;
    if (n >= CHEER.tapsCapPerBucket) continue;
    perBucket.set(b, n + 1);
    acc++;
    if (acc % CHEER.tapsFull === 0) out.push(k === 1 ? { t: tap, side } : { t: tap, side, scale: k });
  }
  return out;
}
// ── companheiro.ts (COMPANHEIRO INVOCADO, PR 2): espelho da regra pura; travado por `combate.parity.test.js` ──
export const COMPANHEIRO_TURNOS = 3;
export const COMPANHEIRO_EFEITO_FATOR = 0.8;
export const COMPANHEIRO_ATAQUE_FATOR = 0.25;
/** Cura (`heal`, ou `shield` com `effect: 'hot'`) nunca invoca. */
export function especialInvoca(sp) {
  if (!sp) return false;
  if (sp.family === 'heal') return false;
  if (sp.family === 'shield' && sp.effect === 'hot') return false;
  return true;
}
/** O plano de uma invocacao (ou null): ver `planoInvocacao` de `src/utils/combate/companheiro.ts`. */
export function planoInvocacao(sp, scale) {
  if (!sp || !especialInvoca(sp)) return null;
  const E = SPECIAL_BUDGET_HITS * sp.power * scale;
  if (sp.family === 'direct' || sp.family === 'dot') return { papel: 'ataque', escalaEfeito: 0, ataqueE: E, turnosAtaque: COMPANHEIRO_TURNOS };
  return { papel: 'misto', escalaEfeito: scale * COMPANHEIRO_EFEITO_FATOR, ataqueE: SPECIAL_BUDGET_HITS * scale * COMPANHEIRO_ATAQUE_FATOR, turnosAtaque: COMPANHEIRO_TURNOS - 1 };
}
