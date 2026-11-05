import { describe, it, expect } from 'vitest';
import { grantDungeonKey, hasDungeonKey } from './focusKey';

const NOW = new Date(2026, 10, 5, 12).getTime();
const AMANHA = NOW + 24 * 3_600_000;

describe('chave do Calabouço (§239)', () => {
  it('sem chave não abre; concluir dá a do dia, idempotente, e não acumula para amanhã', () => {
    expect(hasDungeonKey({}, NOW)).toBe(false);
    const a = grantDungeonKey({}, NOW);
    expect(hasDungeonKey(a, NOW)).toBe(true);
    expect(grantDungeonKey(a, NOW)).toBe(a);
    expect(hasDungeonKey(a, AMANHA)).toBe(false);
  });
  it('incursão já andando hoje não é trancada; a de ontem não abre', () => {
    const dia = (grantDungeonKey({}, NOW) as { dungeonKeyDay: string }).dungeonKeyDay;
    expect(hasDungeonKey({ rogueDungeon: { day: dia, step: 3 } }, NOW)).toBe(true);
    expect(hasDungeonKey({ rogueDungeon: { day: dia, step: 0 } }, NOW)).toBe(false);
    expect(hasDungeonKey({ rogueDungeon: { day: dia, step: 3 } }, AMANHA)).toBe(false);
  });
});
