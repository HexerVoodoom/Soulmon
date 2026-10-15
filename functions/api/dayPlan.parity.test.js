import { describe, it, expect } from 'vitest';
import * as server from './_dayPlan.js';
import { sanitizeDayPlan, DAY_PLAN_MAX_IDS } from '../../src/utils/dayPlan';

describe('plano do dia: servidor e app', () => {
  it('mantém o mesmo teto de ids', () => {
    expect(server.DAY_PLAN_MAX_IDS).toBe(DAY_PLAN_MAX_IDS);
  });
  it('higieniza entradas boas e hostis da mesma forma', () => {
    const cases = [null, 3, [], {}, { day: 'Wed Oct 07 2026' },
      { day: '2026-10-15', offered: ['a', 'b'], picked: ['a'], confirmed: true },
      { day: '2026-10-15', offered: ['a'], picked: ['zzz', 'a', 'a'], confirmed: 'sim' },
      { day: '2026-10-15', offered: ['ok', 'sem espaço', 'ok', 'x'.repeat(121), 7], picked: 'x' },
      { day: '2026-10-15', offered: Array.from({ length: 300 }, (_, i) => `id${i}`), picked: [] }];
    for (const value of cases) expect(server.sanitizeDayPlan(value), JSON.stringify(value)?.slice(0, 80)).toEqual(sanitizeDayPlan(value));
  });
});
