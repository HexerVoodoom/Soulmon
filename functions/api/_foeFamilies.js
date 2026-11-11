/**
 * Espelho de `src/utils/combate/foeFamilies.ts` (dono, 11/11/2026: especiais variados). Só o que o servidor usa: a FAMÍLIA do especial
 * dos simulados `sim_*` no duelo 1v1 (PvP: sem HoT, a fatia do HoT vira `shield`). Travado por teste de paridade.
 */
export const FOE_MIX = {
  rookie: { direct: 75, buff: 5, dot: 5, heal: 5, hot: 5, debuff: 5 },
  adulto: { direct: 50, buff: 10, dot: 10, heal: 10, hot: 10, debuff: 10 },
};
const ORDEM = ['direct', 'buff', 'dot', 'heal', 'hot', 'debuff'];

/** @param {string} texto */
export function foeHash(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** @param {string} stage @param {string} key */
export function foeKindOf(stage, key) {
  const mix = FOE_MIX[stage === 'rookie' ? 'rookie' : 'adulto'];
  const u = foeHash(`foe|${key}`) % 100;
  let acc = 0;
  for (const k of ORDEM) { acc += mix[k]; if (u < acc) return k; }
  return 'direct';
}

/** Família do especial no duelo 1v1 (`pvp`) ou, com `pvp = false`, a do núcleo de grupo (HoT = `shield`; o efeito `hot` não é família). */
/** @param {string} stage @param {string} key */
export function foeFamilyOf(stage, key) {
  const kind = foeKindOf(stage, key);
  switch (kind) {
    case 'buff': return foeHash(`buff|${key}`) % 2 === 0 ? 'atkBuff' : 'spdBuff';
    case 'dot': return 'dot';
    case 'heal': return 'heal';
    case 'hot': return 'shield';
    case 'debuff': return 'defDebuff';
    default: return 'direct';
  }
}
