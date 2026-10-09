import { describe, it, expect } from 'vitest';
import * as server from './_focusLoot.js';
import { FOCUS_LOOT_DAILY_CAP, sanitizeFocusLoot } from '../../src/utils/focusExpedition';

describe('ledger de recompensa Pomodoro: servidor e app', () => {
  it('mantém o mesmo teto diário', () => {
    expect(server.FOCUS_LOOT_DAILY_CAP).toBe(FOCUS_LOOT_DAILY_CAP);
  });
  it('higieniza entradas boas e hostis da mesma forma', () => {
    const cases = [null, 2, [], {}, { day: 'Wed Oct 07 2026', items: 1, claims: [] },
      { day: '2026-10-09', items: 9, claims: [] },
      { day: '2026-10-09', items: 4, claims: ['ok', 'no spaces', 'ok', 'x'.repeat(121)] }];
    for (const value of cases) expect(server.sanitizeFocusLoot(value), JSON.stringify(value)).toEqual(sanitizeFocusLoot(value));
  });
});
