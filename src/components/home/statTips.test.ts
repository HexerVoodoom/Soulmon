import { describe, it, expect } from 'vitest';
import { statTip } from './statTips';
import { MAX_HEARTS_LOST_PER_DAY } from '../../utils/dailyReset';
import { RUB_HEAL_DAILY_CAP } from '../../utils/careRules';

/** C13 — a dica do coração/energia descreve a regra REAL, nos dois idiomas. */
describe('statTip', () => {
  it('coração: os números vêm das constantes das regras', () => {
    for (const isPt of [true, false]) {
      const t = statTip('hp', isPt);
      expect(t.up).toContain(String(RUB_HEAL_DAILY_CAP));
      expect(t.down).toContain(String(MAX_HEARTS_LOST_PER_DAY));
    }
  });

  it('PT e EN existem e não se confundem', () => {
    expect(statTip('energy', true).title).toBe('Energia');
    expect(statTip('energy', false).title).toBe('Energy');
    expect(statTip('hp', false).up).toMatch(/rub/);
  });

  it('sem culpa nem veredito sobre a pessoa (bíblia §17)', () => {
    const VETADO = /culpa|fault|falhou|failed|você é|you are|morr|die|perdeu|lost/i;
    for (const kind of ['hp', 'energy'] as const) {
      for (const isPt of [true, false]) {
        const t = statTip(kind, isPt);
        expect(`${t.title} ${t.up} ${t.down}`).not.toMatch(VETADO);
      }
    }
  });
});
