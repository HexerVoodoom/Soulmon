import { describe, expect, it } from 'vitest';
import { arenaRollover, arenaSeasonKey, sanitizeArenaSeason } from './arena';
import { applyArenaRunEnd } from './arenaSorteio';

const NOV = Date.parse('2026-11-22T12:00:00Z');
const DEZ = Date.parse('2026-12-01T00:00:00Z');

describe('temporada mensal da Arena (UTC)', () => {
  it('a chave é o mês UTC e a virada acontece à 0h UTC do dia 1', () => {
    expect(arenaSeasonKey(NOV)).toBe('2026-11');
    expect(arenaSeasonKey(Date.parse('2026-11-30T23:59:59Z'))).toBe('2026-11');
    expect(arenaSeasonKey(DEZ)).toBe('2026-12');
  });
  it('save sem temporada adota o mês atual e NÃO zera (a 1ª vai de agora ao fim de novembro)', () => {
    expect(arenaRollover(7, undefined, NOV)).toEqual({ ladder: 7, season: '2026-11' });
  });
  it('mesma temporada mantém; mês novo volta a escada ao nível 1 (0)', () => {
    expect(arenaRollover(7, '2026-11', NOV)).toEqual({ ladder: 7, season: '2026-11' });
    expect(arenaRollover(7, '2026-11', DEZ)).toEqual({ ladder: 0, season: '2026-12' });
    expect(arenaRollover(7, '2025-12', DEZ)).toEqual({ ladder: 0, season: '2026-12' });
  });
  it('relógio que voltou (temporada no futuro) não zera nem rebaixa a temporada', () => {
    expect(arenaRollover(7, '2027-01', NOV)).toEqual({ ladder: 7, season: '2027-01' });
  });
  it('lixo vira indefinido', () => {
    for (const x of [null, 3, '2026-13', '2026-1', {}]) expect(sanitizeArenaSeason(x)).toBeUndefined();
  });
  it('fim de run na virada: conta a partir de 0, idempotente por mês', () => {
    const a = applyArenaRunEnd({ arenaLadder: 7, arenaSeason: '2026-11' }, '2026-12-01', 'win', DEZ);
    expect(a.arenaLadder).toBe(1);
    expect(a.arenaSeason).toBe('2026-12');
    expect(applyArenaRunEnd(a, '2026-12-01', 'win', DEZ).arenaLadder).toBe(2);
  });
});
