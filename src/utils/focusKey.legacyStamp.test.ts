import { describe, it, expect } from 'vitest';
import { focusSessionStamp } from './focusKey';
import { normalizeSession } from './focoSessao';

describe('focusSessionStamp (leitura leve da sessão do foco)', () => {
  const ok = { id: 'a', name: 'n', day: '2026-10-26T00:00', status: 'ready', mode: 'p25' };
  const casos: unknown[] = [
    null, undefined, 3, 'x', [], {}, ok, { ...ok, status: 'completed', mode: 'p50' },
    { ...ok, status: 'other' }, { ...ok, mode: 'p90' }, { ...ok, id: 1 }, { ...ok, name: null }, { ...ok, day: 5 },
  ];
  it.each(casos.map((c, i) => [i, c]))('caso %i bate com normalizeSession em status/day', (_i, raw) => {
    const a = normalizeSession(raw);
    const b = focusSessionStamp(raw);
    expect(b === null).toBe(a === null);
    if (a && b) expect(b).toEqual({ status: a.status, day: a.day });
  });
});
