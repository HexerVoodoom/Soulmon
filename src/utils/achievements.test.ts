import { describe, it, expect } from 'vitest';
import { ACHIEVEMENT_IDS, ACHIEVEMENT_POINTS, ACHIEVEMENT_BITS, achievementPointsTotal, settleAchievements, sanitizeConquistasPagas, unlockedAchievements, gatilhoAntigoTasks100 } from './achievements';
import { BASE_ELEMENT_IDS, DERIVED_ELEMENT_IDS } from './elementDex';
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
    expect(unlockedAchievements({ ...vazio, unlockedEvolutions: ['rookie', 'champion-harmony'] })).toEqual(['first-evolution']);
    expect(unlockedAchievements({ ...vazio, evolutionStage: 'mega-power' })).toEqual(['mega-form']);
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
  it('todas as conquistas têm arte instalada', () => {
    expect(EMBLEM_COUNT).toBe(ACHIEVEMENT_IDS.length);
    for (const id of ACHIEVEMENT_IDS) expect(typeof emblemArt(id)).toBe('string');
  });
});

describe('conquistas do dex de elementos (30/10/2026)', () => {
  const com = (ids: readonly string[]) => ({ ...vazio, defeatedElements: [...ids] }) as Parameters<typeof unlockedAchievements>[0];
  it('base: todos os 20 simples abrem; um a menos não', () => {
    expect(unlockedAchievements(com(BASE_ELEMENT_IDS))).toEqual(['dex-base-all']);
    expect(unlockedAchievements(com(BASE_ELEMENT_IDS.slice(1)))).toEqual([]);
  });
  it('compostos: degraus 25/50/100/todos, contando só compostos do catálogo', () => {
    expect(unlockedAchievements(com(DERIVED_ELEMENT_IDS.slice(0, 24)))).toEqual([]);
    expect(unlockedAchievements(com(DERIVED_ELEMENT_IDS.slice(0, 25)))).toEqual(['dex-fused-25']);
    expect(unlockedAchievements(com(DERIVED_ELEMENT_IDS.slice(0, 100)))).toEqual(['dex-fused-25', 'dex-fused-50', 'dex-fused-100']);
    expect(unlockedAchievements(com([...DERIVED_ELEMENT_IDS, 'lixo_inexistente']))).toEqual(['dex-fused-25', 'dex-fused-50', 'dex-fused-100', 'dex-fused-all']);
  });
  it('todos os elementos só com base + compostos completos', () => {
    expect(unlockedAchievements(com([...BASE_ELEMENT_IDS, ...DERIVED_ELEMENT_IDS.slice(1)]))).not.toContain('dex-all');
    expect(unlockedAchievements(com([...BASE_ELEMENT_IDS, ...DERIVED_ELEMENT_IDS]))).toContain('dex-all');
  });
});

describe('Pontos de Conquista e prêmio em Bits', () => {
  it('todo id tem pontos e Bits > 0; o total é a soma das abertas', () => {
    for (const id of ACHIEVEMENT_IDS) { expect(ACHIEVEMENT_POINTS[id]).toBeGreaterThan(0); expect(ACHIEVEMENT_BITS[id]).toBeGreaterThan(0); }
    expect(achievementPointsTotal([])).toBe(0);
    expect(achievementPointsTotal(['perfect-day', 'dex-all'])).toBe(ACHIEVEMENT_POINTS['perfect-day'] + ACHIEVEMENT_POINTS['dex-all']);
  });
  it('save sem o campo semeia sem pagar; depois paga só as novas, uma vez (idempotente)', () => {
    const seed = settleAchievements(['perfect-day'], undefined);
    expect(seed).toEqual({ next: ['perfect-day'], newly: [], bits: 0 });
    const nova = settleAchievements(['perfect-day', 'habit-7'], seed.next);
    expect(nova.newly).toEqual(['habit-7']);
    expect(nova.bits).toBe(ACHIEVEMENT_BITS['habit-7']);
    const de_novo = settleAchievements(['perfect-day', 'habit-7'], nova.next);
    expect(de_novo.newly).toEqual([]);
    expect(de_novo.bits).toBe(0);
  });
  it('sanitizador: lixo vira undefined, ids desconhecidos/repetidos somem', () => {
    expect(sanitizeConquistasPagas('x')).toBeUndefined();
    expect(sanitizeConquistasPagas(['habit-7', 'habit-7', 'zzz', 5])).toEqual(['habit-7']);
  });
});
