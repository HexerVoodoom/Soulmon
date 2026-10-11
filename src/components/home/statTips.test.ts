import { describe, it, expect } from 'vitest';
import { statTip } from './statTips';
import { MAX_HEARTS_LOST_PER_DAY } from '../../utils/dailyReset';
import { RUB_HEAL_DAILY_CAP } from '../../utils/careRules';
import { DUNGEON_ENERGY_PER_LAYER } from '../../utils/dungeonIdle';

/** C13 — a dica do coração/energia descreve a regra REAL, nos dois idiomas. */
describe('statTip', () => {
  it('coração: os números vêm das constantes das regras', () => {
    for (const isPt of [true, false]) {
      const t = statTip('hp', isPt);
      expect(t.up).toContain(String(RUB_HEAL_DAILY_CAP));
      expect(t.down).toContain(String(MAX_HEARTS_LOST_PER_DAY));
    }
  });

  it('energia diz PARA QUE SERVE (a Masmorra), com o custo da constante (REGISTRO §31)', () => {
    for (const isPt of [true, false]) {
      const t = statTip('energy', isPt);
      expect(t.use).toMatch(isPt ? /Masmorra/ : /Dungeon/);
      expect(t.use).toContain(String(DUNGEON_ENERGY_PER_LAYER));
      expect(t.useLabel).toBeTruthy();
    }
    expect(statTip('hp', false).use).toBeUndefined();
  });

  it('PT e EN existem e não se confundem', () => {
    expect(statTip('energy', true).title).toBe('Energia');
    expect(statTip('energy', false).title).toBe('Energy');
    expect(statTip('hp', false).up).toMatch(/rub/);
  });

  it('sem culpa nem veredito sobre a pessoa (bíblia §17)', () => {
    // `\bmorr`: começo de palavra (morrer/morreu), para "Masmorra" não ser falso positivo (11/10/2026).
    const VETADO = /culpa|fault|falhou|failed|você é|you are|\bmorr|die|perdeu|lost/i;
    for (const kind of ['hp', 'energy'] as const) {
      for (const isPt of [true, false]) {
        const t = statTip(kind, isPt);
        expect(`${t.title} ${t.up} ${t.down} ${t.use ?? ''}`).not.toMatch(VETADO);
      }
    }
  });
});
