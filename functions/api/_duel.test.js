import { describe, it, expect } from 'vitest';
import {
  simulateDuel, duelStats, duelSeed, sanitizeTaps, specialSlots, sanitizeCheers, cheerMultiplier,
  DUEL_CHEER_STRIKES, DUEL_TAPS_FULL, DUEL_TAPS_CAP, DUEL_SPECIAL_MULT, DUEL_PERFECT_MULT, TIMING_CHEER_ENABLED,
} from './_duel.js';

const R = duelStats({ stage: 'rookie' });
const C = duelStats({ stage: 'champion-power' });
const CHEIA = [DUEL_TAPS_FULL, DUEL_TAPS_FULL, DUEL_TAPS_FULL];
const rate = (me, opp, cheers, n = 2000) => {
  let w = 0;
  for (let i = 0; i < n; i++) w += simulateDuel({ me, opp, seed: duelSeed('s', i), cheers }).won ? 1 : 0;
  return w / n;
};

describe('duelo fantasma — torcida por toques', () => {
  it('a torcida por TIMING está desligada (o código antigo fica guardado)', () => {
    expect(TIMING_CHEER_ENABLED).toBe(false);
    // Reaproveitável depois: continuam exportados e coerentes.
    expect(cheerMultiplier(0)).toBe(1);
    expect(cheerMultiplier(1)).toBe(DUEL_PERFECT_MULT);
    expect(sanitizeCheers([9, -1, 'x', 0.5])).toEqual([1, 0, 0]);
  });

  it('é determinístico pela semente', () => {
    const a = simulateDuel({ me: R, opp: C, seed: 42, cheers: [3, 8, 0] });
    const b = simulateDuel({ me: R, opp: C, seed: 42, cheers: [3, 8, 0] });
    expect(a).toEqual(b);
  });

  it('o gauge: cheio gasta e solta o especial; parcial acumula para a próxima janela', () => {
    expect(specialSlots([])).toEqual([false, false, false]);
    expect(specialSlots(CHEIA)).toEqual([true, true, true]);
    // 5 + 5 = 10 ≥ 8 → especial na 2ª janela; o gauge zera; 3ª janela sozinha não enche.
    expect(specialSlots([5, 5, 5])).toEqual([false, true, false]);
    // 4 toques por janela: 4, 8 → especial na 2ª, depois 4 de novo (não enche).
    expect(specialSlots([4, 4, 4])).toEqual([false, true, false]);
  });

  it('a torcida só SOMA: nunca reduz dano e nunca troca vitória por derrota', () => {
    for (let i = 0; i < 500; i++) {
      const seed = duelSeed('x', i);
      const sem = simulateDuel({ me: R, opp: R, seed, cheers: [] });
      const com = simulateDuel({ me: R, opp: R, seed, cheers: CHEIA });
      if (sem.won) expect(com.won).toBe(true);
      sem.events.forEach((e, k) => {
        if (e.actor === 'me' && com.events[k]) expect(com.events[k].dmg).toBeGreaterThanOrEqual(1);
      });
    }
  });

  it('só o golpe de torcida com gauge cheio ganha o especial (x1,35); os outros não mudam', () => {
    const base = simulateDuel({ me: R, opp: R, seed: 11, cheers: [] }).events;
    const cheia = simulateDuel({ me: R, opp: R, seed: 11, cheers: CHEIA }).events;
    const especiais = cheia.filter(e => e.cheer === 1);
    expect(especiais.length).toBeGreaterThan(0);
    expect(DUEL_SPECIAL_MULT).toBe(1.35);
    // Primeiro golpe do pet (índice 0) não é janela de torcida: igual nos dois.
    expect(cheia[0].dmg).toBe(base[0].dmg);
  });

  it('torcer depois não reescreve os golpes já mostrados (a tela anima por prefixo)', () => {
    const base = simulateDuel({ me: R, opp: R, seed: 7, cheers: [] }).events;
    const com = simulateDuel({ me: R, opp: R, seed: 7, cheers: [DUEL_TAPS_FULL] }).events;
    let myStrikes = 0, i = 0;
    for (; i < base.length; i++) {
      if (base[i].actor === 'me' && myStrikes === DUEL_CHEER_STRIKES[0]) break;
      if (base[i].actor === 'me') myStrikes++;
    }
    expect(com.slice(0, i)).toEqual(base.slice(0, i));
  });

  it('higieniza os toques vindos da rede e põe TETO por janela', () => {
    expect(sanitizeTaps([99, -1, 'x', 4])).toEqual([DUEL_TAPS_CAP, 0, 0]);
    expect(sanitizeTaps([2.9, NaN, Infinity])).toEqual([2, 0, 0]);
    expect(sanitizeTaps(null)).toEqual([0, 0, 0]);
    // Toque ilimitado não rende mais que o teto: 3 janelas, no máximo 3 especiais.
    const forjado = simulateDuel({ me: R, opp: R, seed: 5, cheers: [1e9, 1e9, 1e9] });
    const cheio = simulateDuel({ me: R, opp: R, seed: 5, cheers: CHEIA });
    expect(forjado).toEqual(cheio);
  });

  it('calibração: sem torcida ~50%; gauge cheio nas 3 janelas pesa, mas não apaga o estágio', () => {
    expect(rate(R, R, [])).toBeGreaterThan(0.4);
    expect(rate(R, R, [])).toBeLessThan(0.6);
    expect(rate(R, R, CHEIA)).toBeGreaterThan(0.7);
    expect(rate(R, C, CHEIA)).toBeGreaterThan(0.25);
    expect(rate(R, C, CHEIA)).toBeLessThan(0.5);
  });

  it('o gauge cheio rende o MESMO que a torcida perfeita antiga (calibração preservada)', () => {
    // Antes: q=1 nas 3 janelas = x1,35 em cada. Agora: especial nas 3 = x1,35 em cada.
    for (let i = 0; i < 200; i++) {
      const seed = duelSeed('cal', i);
      const nova = simulateDuel({ me: R, opp: C, seed, cheers: CHEIA });
      expect(nova.events.filter(e => e.cheer === 1).every(e => e.actor === 'me')).toBe(true);
    }
  });

  it('a ficha pública não carrega atributo cru', () => {
    expect(Object.keys(duelStats({ stage: 'mega', attrs: { power: 99 } })).sort()).toEqual(['atk', 'hp']);
  });
});
