import { describe, it, expect } from 'vitest';
import { grantDungeonKey, hasDungeonKey, dungeonKeyExpired, dungeonKeyLastDay, dungeonKeyExpiresAt } from './focusKey';

const NOW = new Date(2026, 10, 5, 12).getTime();
const AMANHA = NOW + 24 * 3_600_000;

describe('chave do Calabouço (§239)', () => {
  it('sem chave não abre; concluir dá a chave, idempotente', () => {
    expect(hasDungeonKey({}, NOW)).toBe(false);
    const a = grantDungeonKey({}, NOW);
    expect(hasDungeonKey(a, NOW)).toBe(true);
    expect(grantDungeonKey(a, NOW)).toBe(a);
    expect(hasDungeonKey(a, AMANHA)).toBe(true);
  });
  it('vale 48 h (dia da conquista + seguinte), expira no 3º dia com aviso, e dia futuro não vale', () => {
    const a = grantDungeonKey({}, NOW);
    const d2 = NOW + 48 * 3_600_000;
    expect(hasDungeonKey(a, NOW + 23 * 3_600_000)).toBe(true);
    expect(hasDungeonKey(a, d2)).toBe(false);
    expect(dungeonKeyExpired(a, AMANHA)).toBe(false);
    expect(dungeonKeyExpired(a, d2)).toBe(true);
    expect(dungeonKeyLastDay('2026-11-30')).toBe('2026-12-01');
    expect(hasDungeonKey(a, NOW - 24 * 3_600_000)).toBe(false);
  });
  it('migração: dungeonKeyDay de ontem do save antigo ainda vale hoje; de anteontem não', () => {
    expect(hasDungeonKey({ dungeonKeyDay: '2026-11-04' }, NOW)).toBe(true);
    expect(hasDungeonKey({ dungeonKeyDay: '2026-11-03' }, NOW)).toBe(false);
    expect(hasDungeonKey({ dungeonKeyDay: 'lixo' }, NOW)).toBe(false);
  });
  it('1 uso por dia: a incursão é por dia do jogador (virada do dia = incursão nova com a mesma chave de 48 h)', () => {
    const a = { ...grantDungeonKey({}, NOW), rogueDungeon: { day: '2026-11-05', step: 8 } };
    expect(hasDungeonKey(a, NOW)).toBe(true);
    expect(hasDungeonKey(a, AMANHA)).toBe(true);
    expect(hasDungeonKey({ ...a, rogueDungeon: { day: '2026-11-05', step: 8 } }, NOW + 48 * 3_600_000)).toBe(false);
  });
  it('incursão já andando hoje não é trancada; a de ontem não abre sem chave', () => {
    const dia = (grantDungeonKey({}, NOW) as { dungeonKeyDay: string }).dungeonKeyDay;
    expect(hasDungeonKey({ rogueDungeon: { day: dia, step: 3 } }, NOW)).toBe(true);
    expect(hasDungeonKey({ rogueDungeon: { day: dia, step: 0 } }, NOW)).toBe(false);
    expect(hasDungeonKey({ rogueDungeon: { day: dia, step: 3 } }, AMANHA)).toBe(false);
  });
  it('contador do mapa: a chave ganha hoje expira na meia-noite depois de amanhã (aparelho); sem chave, null', () => {
    const a = grantDungeonKey({}, NOW);
    const fim = new Date(2026, 10, 7, 0).getTime();
    expect(dungeonKeyExpiresAt(a, NOW)).toBe(fim);
    expect(dungeonKeyExpiresAt(a, AMANHA)).toBe(fim);
    expect(dungeonKeyExpiresAt(a, fim)).toBeNull();
    expect(dungeonKeyExpiresAt({}, NOW)).toBeNull();
    // trava legada (incursão andando sem chave no save): vale até a virada de hoje
    expect(dungeonKeyExpiresAt({ rogueDungeon: { day: '2026-11-05', step: 3 } }, NOW)).toBe(new Date(2026, 10, 6, 0).getTime());
  });
});
