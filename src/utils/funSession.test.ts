import { describe, it, expect } from 'vitest';
import { sanitizeFunSession, formatMmSs, isFunGame, FUN_GAMES } from './funSession';

// A sessão (1 energia = 3 rodadas) foi substituída pelos tickets (`funTickets.test.ts`); aqui ficou só o que é compartilhado.
describe('funSession — o que sobrou depois dos tickets', () => {
  it('isFunGame reconhece só os 4 jogos do Salão', () => {
    for (const g of FUN_GAMES) expect(isFunGame(g)).toBe(true);
    for (const g of ['masmorra', 'eco', 3, null]) expect(isFunGame(g)).toBe(false);
  });
  it('o campo legado do save segue lido com tolerância', () => {
    expect(sanitizeFunSession({ startedAt: 5, rounds: 99 })).toEqual({ startedAt: 5, rounds: 3 });
    for (const x of [null, 'x', [], { startedAt: -1, rounds: 1 }, { startedAt: 1 }]) expect(sanitizeFunSession(x)).toBeUndefined();
  });
  it('formatMmSs arredonda para cima e nunca é negativo', () => {
    expect(formatMmSs(125_000)).toBe('02:05');
    expect(formatMmSs(-5)).toBe('00:00');
    expect(formatMmSs(1)).toBe('00:01');
  });
});
