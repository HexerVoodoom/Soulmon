import { describe, it, expect } from 'vitest';
import {
  TROCA_MAX_BITS, TROCA_SWITCH_MAX, TROCA_SWITCH_MIN, applySort, buildDeck, initialTrocaState,
  isConflict, isCorrect, nextSwitchAfter, seededRng, sideFor, trocaBits, trocaOver,
  TROCA_SESSION_MS, TROCA_DECK_SIZE,
} from './troca';

describe('troca — regra e lados', () => {
  it('forma: jovem à esquerda, crescida à direita; lugar: céu à esquerda, gruta à direita', () => {
    const c = { forma: 'young' as const, lugar: 'cave' as const };
    expect(sideFor(c, 'forma')).toBe('left');
    expect(sideFor(c, 'lugar')).toBe('right');
    expect(isConflict(c)).toBe(true);
    expect(isCorrect(c, 'forma', 'left')).toBe(true);
    expect(isCorrect(c, 'lugar', 'left')).toBe(false);
  });
});

describe('troca — baralho', () => {
  it('é determinístico pela semente e tem forma coerente com a arte', () => {
    const a = buildDeck(30, seededRng(7));
    const b = buildDeck(30, seededRng(7));
    expect(a).toEqual(b);
    for (const c of a) {
      expect(c.forma === 'young' ? ['rookie', 'champion'] : ['ultimate', 'mega']).toContain(c.tier);
    }
  });

  it('a maioria das cartas separa as regras (conflito)', () => {
    const deck = buildDeck(300, seededRng(3));
    const ratio = deck.filter(isConflict).length / deck.length;
    expect(ratio).toBeGreaterThan(0.5);
  });

  it('nunca repete a mesma combinação três vezes seguidas', () => {
    const deck = buildDeck(500, seededRng(11));
    for (let i = 2; i < deck.length; i++) {
      const same = [deck[i - 2], deck[i - 1]].every(d => d.forma === deck[i].forma && d.lugar === deck[i].lugar);
      expect(same).toBe(false);
    }
  });
});

describe('troca — troca de regra', () => {
  it('nextSwitchAfter fica entre 5 e 8', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 200; i++) {
      const n = nextSwitchAfter(rng);
      expect(n).toBeGreaterThanOrEqual(TROCA_SWITCH_MIN);
      expect(n).toBeLessThanOrEqual(TROCA_SWITCH_MAX);
    }
    expect(nextSwitchAfter(() => 0.9999999)).toBe(8);
    expect(nextSwitchAfter(() => 0)).toBe(5);
  });

  it('a regra troca exatamente depois de switchAt acertos, e errar não zera', () => {
    const rng = seededRng(5);
    const deck = buildDeck(40, rng);
    let s = initialTrocaState(rng);
    const rule0 = s.rule;
    const need = s.switchAt;
    // um erro no meio não conta nem zera
    const wrong = applySort(s, deck[0], sideFor(deck[0], s.rule) === 'left' ? 'right' : 'left', rng);
    expect(wrong.correct).toBe(false);
    expect(wrong.state.streak).toBe(0);
    s = wrong.state;
    for (let i = 1; i <= need; i++) {
      const r = applySort(s, deck[i], sideFor(deck[i], s.rule), rng);
      expect(r.correct).toBe(true);
      expect(r.switched).toBe(i === need);
      s = r.state;
    }
    expect(s.rule).not.toBe(rule0);
    expect(s.switches).toBe(1);
    expect(s.streak).toBe(0);
    expect(s.correct).toBe(need);
    expect(s.dealt).toBe(need + 1);
  });

  it('a sessão acaba no baralho inteiro ou no tempo', () => {
    const s = initialTrocaState(seededRng(2));
    expect(trocaOver(s, 0)).toBe(false);
    expect(trocaOver(s, TROCA_SESSION_MS)).toBe(true);
    expect(trocaOver({ ...s, dealt: TROCA_DECK_SIZE }, 0)).toBe(true);
  });
});

describe('troca — Bits', () => {
  it('1 a cada 5 acertos, teto = o que 30 cartas alcançam (6)', () => {
    expect(trocaBits(0)).toBe(0);
    expect(trocaBits(4)).toBe(0);
    expect(trocaBits(5)).toBe(1);
    expect(trocaBits(29)).toBe(5);
    expect(trocaBits(30)).toBe(6);
    expect(trocaBits(1000)).toBe(TROCA_MAX_BITS);
    expect(TROCA_MAX_BITS).toBe(6);
    expect(trocaBits(-3)).toBe(0);
  });
});
