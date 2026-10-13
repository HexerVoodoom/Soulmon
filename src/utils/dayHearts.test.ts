import { describe, it, expect } from 'vitest';
import { DEFAULT_HEARTS, heartStrip, shouldPlayHeartBreak } from './dayHearts';

describe('heartStrip — a fileira de corações do resumo (beta-2, 4.2)', () => {
  it('são 3 corações por padrão e nenhum quebra num dia sem perda', () => {
    expect(DEFAULT_HEARTS).toBe(3);
    expect(heartStrip(0)).toEqual({ total: 3, lost: 0, kept: 3 });
  });

  it('perder 1 quebra 1 e preserva os 2 restantes', () => {
    expect(heartStrip(1)).toEqual({ total: 3, lost: 1, kept: 2 });
  });

  it('o resultado é o REAL do dia: 2 perdidos quebram 2', () => {
    expect(heartStrip(2)).toEqual({ total: 3, lost: 2, kept: 1 });
  });

  it('meio coração perdido ainda conta como um coração quebrado (a fileira é de peças inteiras)', () => {
    expect(heartStrip(0.5).lost).toBe(1);
    expect(heartStrip(1.5).lost).toBe(2);
  });

  it('nunca quebra mais do que existe, e lixo vira zero', () => {
    expect(heartStrip(9).lost).toBe(3);
    for (const x of [NaN, -2, Infinity * 0, undefined as unknown as number]) expect(heartStrip(x).lost).toBe(0);
  });

  it('a fileira acompanha o HP máximo do estágio (4 e 5 no mega/ultra), com teto e piso sãos', () => {
    expect(heartStrip(1, 4)).toEqual({ total: 4, lost: 1, kept: 3 });
    expect(heartStrip(1, 5).total).toBe(5);
    expect(heartStrip(1, 0).total).toBe(3);
    expect(heartStrip(1, NaN).total).toBe(3);
    expect(heartStrip(1, 99).total).toBe(8);
  });
});

describe('shouldPlayHeartBreak — não repete ao reabrir', () => {
  it('toca quando houve perda e ainda não foi vista', () => {
    expect(shouldPlayHeartBreak(heartStrip(1), undefined)).toBe(true);
    expect(shouldPlayHeartBreak(heartStrip(1), false)).toBe(true);
  });
  it('NÃO toca de novo depois de vista', () => {
    expect(shouldPlayHeartBreak(heartStrip(1), true)).toBe(false);
  });
  it('sem perda, nunca toca', () => {
    expect(shouldPlayHeartBreak(heartStrip(0), undefined)).toBe(false);
  });
});
