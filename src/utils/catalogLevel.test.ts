import { describe, it, expect } from 'vitest';
import {
  suggestLevelChange,
  applyLevelChange,
  catalogLevelDownCopy,
  LEVEL_UP_CONSTANCY_RATIO,
  LEVEL_UP_WINDOW_DAYS,
  LEVEL_MIN_DAYS,
  LEVEL_DOWN_CONSTANCY_RATIO,
  LEVEL_DOWN_WINDOW_DAYS,
  LEVEL_DOWN_COOLDOWN_DAYS,
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

  it('sugere descer com constância baixa sustentada por dias CONSECUTIVOS', () => {
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

  // A6 — item optInOnly nunca sobe de nível.
  it('NUNCA sugere subir em item optInOnly, mesmo com todos os critérios cumpridos', () => {
    const r = suggestLevelChange({
      currentLevel: 1, optInOnly: true,
      ratio: 1, daysAtLevel: 999, lowConstancyDays: 0,
    });
    expect(r).toBeNull();
  });

  it('item optInOnly ainda pode descer normalmente', () => {
    const r = suggestLevelChange({
      currentLevel: 2, optInOnly: true,
      ratio: LEVEL_DOWN_CONSTANCY_RATIO - 0.01, daysAtLevel: 30, lowConstancyDays: LEVEL_DOWN_WINDOW_DAYS,
    });
    expect(r).toBe('down');
  });

  // A6 — cooldown de 14 dias depois de uma recusa.
  it('não oferece descer de novo durante o cooldown de uma recusa recente', () => {
    const r = suggestLevelChange({
      currentLevel: 2, ratio: 0, daysAtLevel: 30, lowConstancyDays: 999,
      daysSinceLastDownDecline: LEVEL_DOWN_COOLDOWN_DAYS - 1,
    });
    expect(r).toBeNull();
  });

  it('volta a oferecer descer depois que o cooldown passou', () => {
    const r = suggestLevelChange({
      currentLevel: 2, ratio: 0, daysAtLevel: 30, lowConstancyDays: 999,
      daysSinceLastDownDecline: LEVEL_DOWN_COOLDOWN_DAYS,
    });
    expect(r).toBe('down');
  });

  // A6 — fiação: a janela de subida é 21 dias, não os 7 de CONSTANCY_WINDOW_DAYS.
  it('fiação: LEVEL_UP_WINDOW_DAYS é 21, não a janela de 7 dias do hábito comum', () => {
    expect(LEVEL_UP_WINDOW_DAYS).toBe(21);
    expect(LEVEL_UP_WINDOW_DAYS).not.toBe(7);
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

// A6 — a copy do convite de descer NUNCA pode dizer "descer" nem "Nível 1".
describe('catalogLevelDownCopy', () => {
  const PALAVRAS_PROIBIDAS = /descer|down|n[íi]vel\s*1|level\s*1/i;

  it('PT: nenhum texto contém "descer" nem "Nível 1"', () => {
    const c = catalogLevelDownCopy('pt-BR');
    for (const texto of Object.values(c)) expect(texto).not.toMatch(PALAVRAS_PROIBIDAS);
  });

  it('EN: nenhum texto contém "down" nem "Level 1"', () => {
    const c = catalogLevelDownCopy('en-US');
    for (const texto of Object.values(c)) expect(texto).not.toMatch(PALAVRAS_PROIBIDAS);
  });
});
