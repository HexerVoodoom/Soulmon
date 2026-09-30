import { describe, it, expect } from 'vitest';
import { simulateDuel, duelStats, duelSeed, sanitizeCheers, cheerMultiplier, DUEL_CHEER_STRIKES } from './_duel.js';

const R = duelStats({ stage: 'rookie' });
const C = duelStats({ stage: 'champion-power' });
const rate = (me, opp, cheers, n = 2000) => {
  let w = 0;
  for (let i = 0; i < n; i++) w += simulateDuel({ me, opp, seed: duelSeed('s', i), cheers }).won ? 1 : 0;
  return w / n;
};

describe('duelo fantasma', () => {
  it('é determinístico pela semente', () => {
    const a = simulateDuel({ me: R, opp: C, seed: 42, cheers: [0.5, 1, 0] });
    const b = simulateDuel({ me: R, opp: C, seed: 42, cheers: [0.5, 1, 0] });
    expect(a).toEqual(b);
  });

  it('a torcida só SOMA: nunca reduz dano e nunca troca vitória por derrota', () => {
    for (let i = 0; i < 500; i++) {
      const seed = duelSeed('x', i);
      const sem = simulateDuel({ me: R, opp: R, seed, cheers: [] });
      const com = simulateDuel({ me: R, opp: R, seed, cheers: [1, 1, 1] });
      if (sem.won) expect(com.won).toBe(true);
    }
    expect(cheerMultiplier(0)).toBe(1);
    expect(cheerMultiplier(0.5)).toBeGreaterThan(1);
  });

  it('torcer depois não reescreve os golpes já mostrados (a tela anima por prefixo)', () => {
    const base = simulateDuel({ me: R, opp: R, seed: 7, cheers: [] }).events;
    const com = simulateDuel({ me: R, opp: R, seed: 7, cheers: [1] }).events;
    let myStrikes = 0, i = 0;
    for (; i < base.length; i++) {
      if (base[i].actor === 'me' && myStrikes === DUEL_CHEER_STRIKES[0]) break;
      if (base[i].actor === 'me') myStrikes++;
    }
    expect(com.slice(0, i)).toEqual(base.slice(0, i));
  });

  it('higieniza a torcida vinda da rede', () => {
    expect(sanitizeCheers([9, -1, 'x', 0.5])).toEqual([1, 0, 0]);
    expect(sanitizeCheers(null)).toEqual([0, 0, 0]);
  });

  it('balanceamento: mesmo estágio ~50%; torcer bem pesa, mas não apaga o estágio', () => {
    expect(rate(R, R, [])).toBeGreaterThan(0.4);
    expect(rate(R, R, [])).toBeLessThan(0.6);
    expect(rate(R, R, [1, 1, 1])).toBeGreaterThan(0.7);
    expect(rate(R, C, [1, 1, 1])).toBeGreaterThan(0.25);
    expect(rate(R, C, [1, 1, 1])).toBeLessThan(0.5);
  });

  it('a ficha pública não carrega atributo cru', () => {
    expect(Object.keys(duelStats({ stage: 'mega', attrs: { power: 99 } })).sort()).toEqual(['atk', 'hp']);
  });
});
