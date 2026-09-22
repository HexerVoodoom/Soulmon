import { describe, it, expect } from 'vitest';
import { ACHIEVEMENT_IDS, unlockedAchievements, gatilhoAntigoTasks100 } from './achievements';
import { EMBLEM_COUNT, emblemArt } from './emblemArt';

const vazio = {
  totalPerfectDays: 0, perfectDays: 0, habitRhythms: {}, unlockedEvolutions: ['rookie'],
  evolutionStage: 'rookie', dungeonRunsCompleted: 0, trophies: [], conquistasHerdadas: [],
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
    expect(unlockedAchievements({ ...vazio, totalPerfectDays: 30 })).toEqual(['perfect-day', 'dias-completos-30']);
    expect(unlockedAchievements({ ...vazio, totalPerfectDays: 29 })).toEqual(['perfect-day']);
  });
  it('#30 (21/09/2026): nenhuma conquista lê contagem de tarefas — nem cosmética', () => {
    // A slice de `unlockedAchievements` NÃO tem `completedTasks`/`activityLog`:
    // 100 tarefas num save novo (sem herança) abrem NADA.
    expect(ACHIEVEMENT_IDS).not.toContain('tasks-100');
    const cem = { ...vazio, completedTasks: new Array(100).fill({ id: 't' }), activityLog: new Array(100).fill('2026-01-01') };
    expect(unlockedAchievements(cem as never)).toEqual([]);
  });
  it('quem já tinha `tasks-100` mantém a conquista por `conquistasHerdadas` (migração no load)', () => {
    expect(gatilhoAntigoTasks100({ completedTasks: new Array(60).fill({ id: 't' }) as never, activityLog: new Array(40).fill('x') })).toBe(true);
    expect(gatilhoAntigoTasks100({ completedTasks: [], activityLog: new Array(99).fill('x') })).toBe(false);
    expect(gatilhoAntigoTasks100({})).toBe(false);
    expect(unlockedAchievements({ ...vazio, conquistasHerdadas: ['dias-completos-30'] })).toEqual(['dias-completos-30']);
  });
  it('as 9 conquistas têm arte instalada', () => {
    expect(EMBLEM_COUNT).toBe(9);
    for (const id of ACHIEVEMENT_IDS) expect(typeof emblemArt(id)).toBe('string');
  });
});
