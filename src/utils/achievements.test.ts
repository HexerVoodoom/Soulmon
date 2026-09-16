import { describe, it, expect } from 'vitest';
import { ACHIEVEMENT_IDS, unlockedAchievements } from './achievements';
import { EMBLEM_COUNT, emblemArt } from './emblemArt';

const vazio = {
  totalPerfectDays: 0, perfectDays: 0, habitRhythms: {}, unlockedEvolutions: ['rookie'],
  evolutionStage: 'rookie', dungeonRunsCompleted: 0, trophies: [], completedTasks: [], activityLog: [],
} as Parameters<typeof unlockedAchievements>[0];

describe('conquistas (emblemas de arte)', () => {
  it('save novo não tem nenhuma', () => {
    expect(unlockedAchievements(vazio)).toEqual([]);
  });
  it('cada uma abre pelo seu contador, e nenhuma lê streak', () => {
    const r = (totalDone: number) => ({ h: { done: [], missed: [], shields: 0, shielded: [], totalDone } });
    expect(unlockedAchievements({ ...vazio, totalPerfectDays: 1 })).toEqual(['perfect-day']);
    expect(unlockedAchievements({ ...vazio, habitRhythms: r(7) as never })).toEqual(['habit-7']);
    expect(unlockedAchievements({ ...vazio, habitRhythms: r(21) as never })).toEqual(['habit-7', 'habit-21']);
    expect(unlockedAchievements({ ...vazio, habitRhythms: r(66) as never })).toEqual(['habit-7', 'habit-21', 'habit-66']);
    expect(unlockedAchievements({ ...vazio, unlockedEvolutions: ['rookie', 'champion-data'] })).toEqual(['first-evolution']);
    expect(unlockedAchievements({ ...vazio, evolutionStage: 'mega-virus' })).toEqual(['mega-form']);
    expect(unlockedAchievements({ ...vazio, dungeonRunsCompleted: 10 })).toEqual(['dungeon-10']);
    expect(unlockedAchievements({ ...vazio, trophies: [{ season: '2026-W37', place: 1 }] })).toEqual(['tournament-champion']);
    expect(unlockedAchievements({ ...vazio, trophies: [{ season: '2026-W37', place: 2 }] })).toEqual([]);
    expect(unlockedAchievements({ ...vazio, activityLog: new Array(100).fill('2026-01-01') })).toEqual(['tasks-100']);
  });
  it('as 8 conquistas têm arte instalada', () => {
    expect(EMBLEM_COUNT).toBe(9);
    for (const id of ACHIEVEMENT_IDS) expect(typeof emblemArt(id)).toBe('string');
  });
});
