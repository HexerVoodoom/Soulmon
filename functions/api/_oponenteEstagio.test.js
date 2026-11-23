import { describe, it, expect } from 'vitest';
import { ESTAGIO_PESOS, stageRankOf, ordenarPorEstagio } from './_oponenteEstagio.js';
import { pickSparOpponents } from './_treino.js';
import { pickRankedOpponents } from './_rankedPick.js';

function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const POOL = ['rookie', 'champion-power', 'ultimate-harmony', 'mega-benevolence', 'ultra']
  .flatMap((stage, k) => Array.from({ length: 12 }, (_, i) => ({ stage, bond: 10, score: i, lifetime: i, id: `${k}-${i}` })));

function dist(meStage, pick) {
  const c = {};
  const rng = lcg(7);
  for (let i = 0; i < 4000; i++) for (const o of pick(rng)) { const k = stageRankOf(o.stage) - stageRankOf(meStage); c[k] = (c[k] || 0) + 1; }
  return c;
}

describe('estágio dos oponentes', () => {
  it('pesos somam 1 nos deltas -2..+2', () => {
    expect(Object.values(ESTAGIO_PESOS).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });
  it('Treino: jogador Ultimate recebe Champion, Ultimate e Mega (e Mega/Champion mais que o resto)', () => {
    const c = dist('ultimate-power', (rng) => pickSparOpponents(POOL, 10, rng, 5, 3, 'ultimate-power').slice(0, 5));
    expect(c['-1']).toBeGreaterThan(0); expect(c['0']).toBeGreaterThan(0); expect(c['1']).toBeGreaterThan(0);
    const tot = Object.values(c).reduce((a, b) => a + b, 0);
    expect(c['0'] / tot).toBeGreaterThan(0.3); expect((c['-1'] + c['0'] + c['1']) / tot).toBeGreaterThan(0.8);
  });
  it('Ranqueada: idem, com estágio variado dentro da vizinhança', () => {
    const c = dist('ultimate-power', (rng) => pickRankedOpponents(POOL.map(p => ({ ...p, score: 5 })), { score: 5, lifetime: 5 }, rng, 3, 60, 'ultimate-power'));
    expect(c['-1']).toBeGreaterThan(0); expect(c['0']).toBeGreaterThan(0); expect(c['1']).toBeGreaterThan(0);
  });
  it('sem estágio do jogador: embaralhamento uniforme (não quebra)', () => {
    expect(ordenarPorEstagio([1, 2, 3], null, lcg(1), () => 'rookie')).toHaveLength(3);
  });
});
