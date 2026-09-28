import { describe, it, expect } from 'vitest';
import {
  suggestLevelChange,
  applyLevelChange,
  LEVEL_UP_CONSTANCY_RATIO,
  LEVEL_MIN_DAYS,
  LEVEL_DOWN_CONSTANCY_RATIO,
  LEVEL_DOWN_WINDOW_DAYS,
} from './catalogLevel';

describe('suggestLevelChange', () => {
  it('sugere subir quando constância alta e tempo mínimo cumprido', () => {
    const r = suggestLevelChange({ currentLevel: 1, ratio: LEVEL_UP_CONSTANCY_RATIO, daysAtLevel: LEVEL_MIN_DAYS, lowConstancyDays: 0 });
    expect(r).toBe('up');
  });

  it('NÃO sugere subir antes do mínimo de dias, mesmo com constância perfeita', () => {
    const r = suggestLevelChange({ currentLevel: 1, ratio: 1, daysAtLevel: LEVEL_MIN_DAYS - 1, lowConstancyDays: 0 });
    expect(r).toBeNull();
  });

  it('nunca sugere subir além do nível 3', () => {
    const r = suggestLevelChange({ currentLevel: 3, ratio: 1, daysAtLevel: 999, lowConstancyDays: 0 });
    expect(r).toBeNull();
  });

  it('sugere descer com constância baixa sustentada', () => {
    const r = suggestLevelChange({ currentLevel: 2, ratio: LEVEL_DOWN_CONSTANCY_RATIO - 0.01, daysAtLevel: 30, lowConstancyDays: LEVEL_DOWN_WINDOW_DAYS });
    expect(r).toBe('down');
  });

  it('nunca sugere descer abaixo do nível 1', () => {
    const r = suggestLevelChange({ currentLevel: 1, ratio: 0, daysAtLevel: 30, lowConstancyDays: 999 });
    expect(r).toBeNull();
  });

  it('nada quando os dois critérios estão indefinidos (meio do caminho)', () => {
    const r = suggestLevelChange({ currentLevel: 2, ratio: 0.6, daysAtLevel: 25, lowConstancyDays: 3 });
    expect(r).toBeNull();
  });
});

describe('applyLevelChange', () => {
  it('sobe um nível, e nunca passa de 3', () => {
    expect(applyLevelChange(1, 'up')).toBe(2);
    expect(applyLevelChange(3, 'up')).toBe(3);
  });

  it('desce um nível, e nunca passa de 1', () => {
    expect(applyLevelChange(2, 'down')).toBe(1);
    expect(applyLevelChange(1, 'down')).toBe(1);
  });
});
