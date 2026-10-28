import { describe, it, expect } from 'vitest';
import { GUILD_MISSION_MINUTES, startGuildMission, normalizeGuildMission, isMissionAway, isMissionDue, msUntilReturn } from './guildMission';

describe('guildMission — a ida do Soulmon', () => {
  const t0 = Date.parse('2026-10-11T12:00:00Z');
  it('parte agora e volta em GUILD_MISSION_MINUTES', () => {
    const m = startGuildMission('2026-10-11', t0);
    expect(m.returnAt - t0).toBe(GUILD_MISSION_MINUTES * 60_000);
  });
  it('fora da Home só ENTRE a ida e a volta; depois dela o pet volta mesmo sem rede', () => {
    const m = startGuildMission('2026-10-11', t0);
    expect(isMissionAway(m, t0 + 1)).toBe(true);
    expect(isMissionAway(m, m.returnAt)).toBe(false);
    expect(isMissionDue(m, m.returnAt)).toBe(true);
    expect(isMissionAway(null, t0)).toBe(false);
    expect(msUntilReturn(m, m.returnAt + 5)).toBe(0);
  });
  it('save com lixo vira "sem missão"', () => {
    for (const bad of [null, 3, 'x', {}, { day: 'ontem', returnAt: 5 }, { day: '2026-10-11', returnAt: NaN }, { day: '2026-10-11', returnAt: -1 }]) expect(normalizeGuildMission(bad)).toBeNull();
    expect(normalizeGuildMission({ day: '2026-10-11', returnAt: 123.9 })).toEqual({ day: '2026-10-11', returnAt: 123 });
  });
});
