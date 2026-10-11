import { describe, it, expect } from 'vitest';
import { pickRankedOpponents, RANKED_WINDOW } from './_rankedPick.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
const pool = (pts) => pts.map((lifetime, i) => ({ id: `p${i}`, lifetime }));

describe('pickRankedOpponents — Torneio ranqueado', () => {
  it('devolve no máximo 3 e nunca repete', () => {
    const r = pickRankedOpponents(pool([0, 10, 20, 30, 40, 50, 60]), 25, seeded(1));
    expect(r).toHaveLength(3);
    expect(new Set(r.map(x => x.id)).size).toBe(3);
  });
  it('só sorteia dentre os mais próximos da faixa de quem pede', () => {
    const p = pool([0, 5, 1000, 1010, 1020, 1030, 1040, 1050, 1060, 2000, 3000]);
    for (let s = 1; s <= 200; s++) {
      for (const o of pickRankedOpponents(p, 1030, seeded(s))) {
        expect(Math.abs(o.lifetime - 1030)).toBeLessThanOrEqual(RANKED_WINDOW * 100);
        expect(o.lifetime).toBeGreaterThanOrEqual(1000 - 1);
      }
    }
  });
  it('é aleatório: sementes diferentes dão trios diferentes', () => {
    const p = pool([100, 101, 102, 103, 104, 105, 106]);
    const seen = new Set();
    for (let s = 1; s <= 50; s++) seen.add(pickRankedOpponents(p, 103, seeded(s)).map(x => x.id).sort().join());
    expect(seen.size).toBeGreaterThan(3);
  });
  it('pool pequeno ou vazio não quebra; pontos inválidos contam como 0', () => {
    expect(pickRankedOpponents([], 5, seeded(1))).toEqual([]);
    expect(pickRankedOpponents(pool([1, 2]), NaN, seeded(1))).toHaveLength(2);
  });
});
