import { describe, it, expect } from 'vitest';
import { migrateBestiary, migrateBestiaryKey, LEGACY_LINE_TO_NOVO } from './bestiaryMigrate';
import { ENEMY_ROSTER_KEYS } from './enemyRoster';

describe('migração do bestiário (linha-tier -> id-estágio)', () => {
  it('toda linha antiga aponta para uma criatura distinta que existe no roster', () => {
    const ids = Object.values(LEGACY_LINE_TO_NOVO);
    expect(new Set(ids).size).toBe(ids.length);
    for (const line of Object.keys(LEGACY_LINE_TO_NOVO)) for (const t of ['rookie', 'champion', 'ultimate', 'mega']) {
      expect(ENEMY_ROSTER_KEYS.has(migrateBestiaryKey(`${line}-${t}`) as string)).toBe(true);
    }
  });
  it('20 chaves antigas não viram 0 vistas: as novas entram no roster, as antigas ficam', () => {
    const old: string[] = [];
    for (const line of Object.keys(LEGACY_LINE_TO_NOVO)) for (const t of ['rookie', 'champion', 'ultimate', 'mega']) old.push(`${line}-${t}`);
    const velhas = old.slice(0, 20);
    const out = migrateBestiary(velhas);
    expect(out.filter(k => ENEMY_ROSTER_KEYS.has(k)).length).toBe(20);
    for (const k of velhas) expect(out).toContain(k);
  });
  it('baby-i/baby-ii viram rookie; chave nova e lixo passam intactas; é idempotente', () => {
    expect(migrateBestiaryKey('kaelen-baby-i')).toBe('embrit-rookie');
    expect(migrateBestiaryKey('embrit-champion')).toBeNull();
    expect(migrateBestiaryKey('lixo')).toBeNull();
    const a = migrateBestiary(['kaelen-baby-i', 'embrit-champion', 'x']);
    expect(migrateBestiary(a)).toEqual(a);
    expect(a).toEqual(['kaelen-baby-i', 'embrit-champion', 'x', 'embrit-rookie']);
  });
});
