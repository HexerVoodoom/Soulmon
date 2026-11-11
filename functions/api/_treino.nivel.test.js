import { describe, it, expect } from 'vitest';
import { pickSparOpponents, sparLevelWindow, SPAR_NEAR_SHARE } from './_treino.js';

function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const stageOf = l => (l < 7 ? 'rookie-power' : l < 14 ? 'champion-power' : l < 22 ? 'ultimate-power' : l < 40 ? 'mega-power' : 'ultra-power');
// Pool sintético (120): níveis 1..60 com mais gente nos baixos; Vínculo só ~correlacionado ao nível.
const rngPool = lcg(42);
const POOL = Array.from({ length: 120 }, () => {
  const level = Math.max(1, Math.round(Math.exp(rngPool() * Math.log(60))));
  return { level, bond: Math.max(1, Math.round(level * 0.7 + (rngPool() - 0.5) * 8)), stage: stageOf(level) };
});

function pctNear(L, withLevel) {
  const rng = lcg(7);
  let near = 0, tot = 0;
  for (let k = 0; k < 2000; k++) {
    const o = pickSparOpponents(POOL, Math.round(L * 0.7), rng, 5, undefined, stageOf(L), withLevel ? L : null).slice(0, 5);
    for (const c of o) { tot++; if (Math.abs(c.level - L) <= sparLevelWindow(L)) near++; }
  }
  return near / tot;
}

describe('Sparring: oponentes majoritariamente de nível similar (dono, 11/11/2026)', () => {
  it('janela: ±10%, no mínimo ±2', () => {
    expect(sparLevelWindow(5)).toBe(2); expect(sparLevelWindow(20)).toBe(2); expect(sparLevelWindow(35)).toBe(4);
  });
  it.each([3, 8, 15, 25])('nível %i: ≥ 65% dos oponentes dentro da janela', (L) => {
    expect(pctNear(L, true)).toBeGreaterThanOrEqual(0.65);
    expect(pctNear(L, true)).toBeLessThan(0.9); // mantém variedade: sempre há mais forte/mais fraco
  });
  it('a mistura aproxima SPAR_NEAR_SHARE quando há gente de sobra', () => {
    expect(Math.abs(pctNear(8, true) - SPAR_NEAR_SHARE)).toBeLessThan(0.05);
  });
  it('aparece mais forte E mais fraco que o jogador', () => {
    const rng = lcg(3); let up = 0, down = 0;
    for (let k = 0; k < 500; k++) for (const c of pickSparOpponents(POOL, 6, rng, 5, undefined, stageOf(8), 8).slice(0, 5)) { if (c.level > 8 + sparLevelWindow(8)) up++; if (c.level < 8 - sparLevelWindow(8)) down++; }
    expect(up).toBeGreaterThan(0); expect(down).toBeGreaterThan(0);
  });
  it('sem nível do jogador: comportamento antigo (só Vínculo), mesma lista de candidatos', () => {
    const a = pickSparOpponents(POOL, 6, lcg(1), 5, 3, 'champion-power');
    expect(a.every(c => Math.abs(c.bond - 6) <= 3 || a.length < 5)).toBe(true);
  });
  it('pool pequeno: não repete nem perde ninguém, e devolve todos', () => {
    const small = POOL.slice(0, 4);
    const o = pickSparOpponents(small, 3, lcg(2), 5, 3, 'rookie-power', 5);
    expect(new Set(o).size).toBe(o.length);
  });
  it('estágio segue coerente com o poder: o perto-do-nível quase sempre tem estágio igual/vizinho', () => {
    const rng = lcg(9); let bad = 0, tot = 0;
    for (let k = 0; k < 500; k++) for (const c of pickSparOpponents(POOL, 10, rng, 5, undefined, stageOf(15), 15).slice(0, 5)) {
      if (Math.abs(c.level - 15) <= 2) { tot++; if (Math.abs(['rookie', 'champion', 'ultimate', 'mega', 'ultra'].indexOf(c.stage.split('-')[0]) - 2) > 1) bad++; }
    }
    expect(bad / tot).toBeLessThan(0.05);
  });
});
