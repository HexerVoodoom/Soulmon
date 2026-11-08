import { describe, it, expect } from 'vitest';
import * as C from './focusJourney';
import { FOCUS_ENVIRONMENTS } from './focusExpedition';
// @ts-expect-error módulo JS do servidor, sem tipos
import * as S from '../../functions/api/_focusJourney.js';

describe('jornada: cliente e servidor pagam igual (§245)', () => {
  it('constantes e listas espelhadas', () => {
    expect(S.JOURNEY_KEYS).toEqual([...C.JOURNEY_KEYS]);
    expect(S.JOURNEY_MODES).toEqual(C.JOURNEY_MODES);
    expect(S.JOURNEY_FOODS).toEqual([...C.JOURNEY_FOODS]);
    expect(S.ENV_ELEMENT).toEqual(C.ENV_ELEMENT);
    for (const e of FOCUS_ENVIRONMENTS) expect(S.ENV_MATERIALS[e.id]).toEqual([...e.materials]);
    for (const k of ['JOURNEY_ITEMS_DAILY_CAP', 'JOURNEY_ESSENCES_DAILY_CAP', 'JOURNEY_COMPLETIONS_REWARDED', 'JOURNEY_MAX_PAUSES', 'JOURNEY_MAX_PAUSED_MS', 'SPECIAL_CHANCE'] as const) expect(S[k]).toBe(C[k]);
  });
  it('baús, loot e conclusão iguais em 300 seeds', () => {
    for (let s = 0; s < 300; s++) for (const mode of ['p25', 'p50'] as const) {
      const chests = C.journeyChests(s, mode);
      expect(S.journeyChests(s, mode)).toEqual(chests);
      const env = FOCUS_ENVIRONMENTS[s % FOCUS_ENVIRONMENTS.length].id;
      const keys = C.JOURNEY_KEYS.filter((_, i) => (s >> i) & 1);
      for (const ch of chests) expect(S.chestLoot(s, ch, keys, env)).toEqual(C.chestLoot(s, ch, keys, env));
      for (const n of [1, 2, 5]) expect(S.completionLoot(s, n, env)).toEqual(C.completionLoot(s, n, env));
    }
  });
});
