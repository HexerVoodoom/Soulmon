import { describe, it, expect } from 'vitest';
import * as C from './focusJourney';
import { FOCUS_ENVIRONMENTS } from './focusExpedition';
// @ts-expect-error módulo JS do servidor, sem tipos
import * as S from '../../functions/api/_focusJourney.js';

describe('jornada: cliente e servidor pagam igual (§247)', () => {
  it('constantes e listas espelhadas', () => {
    expect(S.JOURNEY_KEYS).toEqual([...C.JOURNEY_KEYS]);
    expect(S.JOURNEY_MODES).toEqual(C.JOURNEY_MODES);
    expect(S.JOURNEY_FOODS).toEqual([...C.JOURNEY_FOODS]);
    expect(S.ENV_ELEMENTS).toEqual(C.ENV_ELEMENTS);
    for (const e of FOCUS_ENVIRONMENTS) expect(S.ENV_MATERIALS[e.id]).toEqual([...e.materials]);
    expect(S.JOURNEY_SESSION_ITEMS_CAP).toEqual(C.JOURNEY_SESSION_ITEMS_CAP);
    expect(S.ESSENCE_BY_ELEMENTS).toEqual(C.ESSENCE_BY_ELEMENTS);
    for (const k of ['JOURNEY_ITEMS_DAILY_CAP', 'JOURNEY_ESSENCES_DAILY_CAP', 'JOURNEY_COMPLETIONS_REWARDED', 'JOURNEY_MAX_PAUSES', 'JOURNEY_MAX_PAUSED_MS', 'SPECIAL_CHANCE'] as const) expect(S[k]).toBe(C[k]);
  });
  it('focos extras (§302): do 5º ao 7º do dia dá UM item simples, sem Bits; do 8º em diante, nada (servidor e cliente)', () => {
    for (const M of [S, C]) for (let seed = 0; seed < 50; seed++) {
      for (const n of [5, 6, 7]) { const l = M.completionLoot(seed, n, 'forest'); expect(l).toHaveLength(1); expect(['material', 'food', 'essence']).toContain(l[0].kind); }
      expect(M.completionLoot(seed, 8, 'forest')).toEqual([]);
    }
  });
  it('baús, loot e conclusão iguais em 300 seeds', () => {
    for (let s = 0; s < 300; s++) for (const mode of ['p25', 'p50'] as const) {
      const chests = C.journeyChests(s, mode);
      expect(S.journeyChests(s, mode)).toEqual(chests);
      const env = FOCUS_ENVIRONMENTS[s % FOCUS_ENVIRONMENTS.length].id;
      const keys = C.JOURNEY_KEYS.filter((_, i) => (s >> i) & 1);
      for (const ch of chests) for (const el of [1, 2, 3, 4]) expect(S.chestLoot(s, ch, keys, env, el)).toEqual(C.chestLoot(s, ch, keys, env, el));
      for (const n of [1, 2, 5, 7, 8]) expect(S.completionLoot(s, n, env)).toEqual(C.completionLoot(s, n, env));
    }
  });
  it('15.5: os 20 elementos base, cada um em UM cenário só; sorteio determinístico pela seed e igual no servidor', () => {
    const all = Object.values(C.ENV_ELEMENTS).flat();
    expect(all).toHaveLength(20);
    expect(new Set(all).size).toBe(20);
    expect(S.ENV_ELEMENTS).toEqual(C.ENV_ELEMENTS);
    const seen = new Set<string>();
    for (const e of FOCUS_ENVIRONMENTS) for (let s = 0; s < 2000; s++) {
      const l = C.chestLoot(s, { k: 0, at: 0.5, type: 'brejo' }, ['brejo'], e.id);
      expect(l).toEqual(C.chestLoot(s, { k: 0, at: 0.5, type: 'brejo' }, ['brejo'], e.id));
      expect(l[0].kind).toBe('essence');
      expect(C.ENV_ELEMENTS[e.id]).toContain(l[0].id);
      expect(l[0].qty).toBe(2);
      seen.add(l[0].id);
    }
    expect(seen.size).toBe(20);
  });
});
