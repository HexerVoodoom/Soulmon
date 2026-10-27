import { describe, it, expect } from 'vitest';
import { wildFoeLabel } from './wildFoeLabel';
import { ENEMY_ROSTER } from './enemyRoster';

describe('wildFoeLabel: Soulmon sem dono (27/10/2026)', () => {
  it('menores = selvagem; fortes e chefe = desgarrado; aceita tier puro ou chave do bestiário', () => {
    for (const t of ['baby-i', 'baby-ii', 'rookie', 'champion', 'embrit-champion', 'cmb003-rookie', 'kaelen-baby-i']) {
      expect(wildFoeLabel(t, true), t).toBe('Soulmon selvagem');
      expect(wildFoeLabel(t, false), t).toBe('Wild Soulmon');
    }
    for (const t of ['ultimate', 'mega', 'ultra', 'bulwarax-ultimate', 'fogo-mega']) {
      expect(wildFoeLabel(t, true), t).toBe('Soulmon desgarrado');
      expect(wildFoeLabel(t, false), t).toBe('Stray Soulmon');
    }
    expect(wildFoeLabel(undefined, false)).toBe('Wild Soulmon');
  });
  it('todo estágio do roster cai em exatamente um dos dois rótulos', () => {
    for (const e of ENEMY_ROSTER) expect(['Wild Soulmon', 'Stray Soulmon']).toContain(wildFoeLabel(e.key, false));
  });
});
