import { describe, it, expect } from 'vitest';
import { sanitizeDailyMissions, dailyMissionPool } from './dailyMissions';

describe('missão "brincar" aposentada (30/10/2026)', () => {
  it('não está no catálogo; o carinho está', () => {
    const ids = dailyMissionPool().map(m => m.id);
    expect(ids).not.toContain('d-brincar');
    expect(ids).toContain('d-carinho');
  });
  it('save antigo com brincar/d-brincar não quebra e é descartado', () => {
    const s = sanitizeDailyMissions({ day: '2026-10-29', counts: { brincar: 1, carinho: 2 }, claimed: ['d-brincar', 'd-carinho'] });
    expect(s?.counts).toEqual({ carinho: 2 });
    expect(s?.claimed).toEqual(['d-carinho']);
  });
});
