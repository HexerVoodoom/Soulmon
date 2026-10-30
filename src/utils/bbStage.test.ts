import { describe, it, expect, afterEach } from 'vitest';
import { computeDailyReset, getNextEvolution, restWeekKeyFor } from './dailyReset';
import { applyHungerPenalty } from './hungerPenalty';
import { applyPoopDrain } from './poopDrain';
import { gaugeFull } from './evolutionGauge';
import { getMaxHPForStage } from '../contexts/GameStateContext';
import { getStageLevel } from '../types/progression';
import { xpForLevel as totalXPForBondLevel } from './bond';
import {
  BB_STAGE, BB_MAX_HP, bbRefusal, bbEvolveReady, isBBStage, isOnboardingVelado, setOnboardingVelado,
  initialStageForNewSave, sanitizeStageId, BB_LOCKED_BUILDINGS,
} from './bbStage';

const WEDNESDAY = new Date('2026-08-05T12:00:00');
const base = (stage: string, extra: Record<string, unknown> = {}) => ({
  activities: [],
  tasks: Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: false })),
  healthPoints: BB_MAX_HP,
  maxHealthPoints: BB_MAX_HP,
  energyPoints: 0,
  perfectDays: 0,
  totalXP: 0,
  powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0,
  evolutionStage: stage,
  unlockedEvolutions: ['rookie'],
  currentBranch: 'harmony' as const,
  maxActivityCap: 6,
  lastResetDate: new Date('2026-08-04T12:00:00').toDateString(),
  lastDayReport: { date: new Date('2026-08-03T12:00:00').toDateString(), saveDay: 90 } as any,
  restDaysLeft: 1,
  restWeekKey: restWeekKeyFor(new Date('2026-08-04T12:00:00')),
  ...extra,
});

afterEach(() => setOnboardingVelado(false));

describe('forma BB — o interruptor', () => {
  it('nasce DESLIGADO e só `true` liga', () => {
    expect(isOnboardingVelado()).toBe(false);
    expect(initialStageForNewSave()).toBe('rookie');
    setOnboardingVelado('1');
    expect(isOnboardingVelado()).toBe(false);
    setOnboardingVelado(true);
    expect(initialStageForNewSave()).toBe(BB_STAGE);
  });
});

describe('forma BB — HP e nível', () => {
  it('HP máx 6; o resto da escada segue igual', () => {
    expect(getMaxHPForStage('bb')).toBe(6);
    expect(getMaxHPForStage('rookie')).toBe(3);
    expect(getMaxHPForStage('mega-power')).toBe(4);
  });
  it('para nível/sprite o BB cai em rookie (tolerante)', () => {
    expect(getStageLevel('bb')).toBe('rookie');
  });
});

describe('forma BB — a virada não cobra nada', () => {
  it('sem requisito, sem perda de coração, sem dia perfeito, sem gauge, sem folga gasta', () => {
    const prev = base('bb');
    const r = computeDailyReset(prev, { now: WEDNESDAY }) as any;
    expect(r.healthPoints).toBe(6);
    expect(r.maxHealthPoints).toBe(6);
    expect(r.perfectDays).toBe(0);
    expect(r.evolutionPoints ?? 0).toBe(0);
    expect(r.degeneratedByHP).toBe(false);
    expect(r.restDaysLeft).toBe(1);
    expect(r.evolutionStage).toBe('bb');
    expect(r.lastResetDate).toBe(WEDNESDAY.toDateString());
    expect(r.tasks.every((t: any) => t.completed === false)).toBe(true);
  });
  it('mesmo com TUDO feito, nada é creditado (Vínculo, Bits, dia completo)', () => {
    const prev = base('bb', { tasks: Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true })), gamePoints: 7 });
    const r = computeDailyReset(prev, { now: WEDNESDAY }) as any;
    expect(r.totalXP).toBe(0);
    expect(r.gamePoints).toBe(7);
    expect(r.totalPerfectDays ?? 0).toBe(0);
    expect(r.evolutionPoints ?? 0).toBe(0);
  });
  it('o rookie CONTINUA cobrando como antes (comportamento atual idêntico)', () => {
    const prev = base('rookie', { healthPoints: 3, maxHealthPoints: 3, restDaysLeft: 0, lastDayReport: { date: 'x', saveDay: 90 } });
    const r = computeDailyReset(prev, { now: WEDNESDAY }) as any;
    expect(r.healthPoints).toBeLessThan(3);
    expect(r.maxHealthPoints).toBe(3);
  });
  it('idempotente: virar de novo no mesmo dia não muda nada além do mesmo estado', () => {
    const once = computeDailyReset(base('bb'), { now: WEDNESDAY }) as any;
    const twice = computeDailyReset(once, { now: WEDNESDAY }) as any;
    expect(twice.healthPoints).toBe(once.healthPoints);
    expect(twice.evolutionStage).toBe('bb');
  });
});

describe('forma BB — sem dreno de fome nem de cocô', () => {
  it('fome (faminto há dias) não tira coração', () => {
    const s: any = { evolutionStage: 'bb', healthPoints: 6, hunger: { v: 0, at: 0 } };
    expect(applyHungerPenalty(s, 10 * 86_400_000)).toBe(s);
    const rookie = applyHungerPenalty({ ...s, evolutionStage: 'rookie', healthPoints: 3 }, 10 * 86_400_000);
    expect(rookie.healthPoints).toBeLessThan(3); // o mesmo save em rookie ainda perde (controle)
  });
  it('cocô não limpo não tira coração', () => {
    const now = new Date('2026-08-05T20:00:00').getTime();
    const s: any = {
      evolutionStage: 'bb', healthPoints: 6, maxHealthPoints: 6, poopEventsShown: [0], poopEventsCompleted: [],
      poopPenaltyClockAt: now - 20 * 3_600_000, lastResetDate: new Date(now).toDateString(), lastDayReport: { saveDay: 90 },
    };
    expect(applyPoopDrain(s, { now, isSleeping: false })).toBe(s);
    const rookie = applyPoopDrain({ ...s, evolutionStage: 'rookie', healthPoints: 3, maxHealthPoints: 3 }, { now, isSleeping: false });
    expect(rookie.healthPoints).toBeLessThan(3); // controle: o mesmo save em rookie ainda perde
  });
});

describe('forma BB — evolução (D4)', () => {
  it('habilita com Vínculo >= 2 e não antes', () => {
    expect(bbEvolveReady(0)).toBe(false);
    expect(bbEvolveReady(undefined)).toBe(false);
    expect(bbEvolveReady(totalXPForBondLevel(2) - 1)).toBe(false);
    expect(bbEvolveReady(totalXPForBondLevel(2))).toBe(true);
  });
  it('a porta do gauge abre pelo Vínculo, e o destino é o rookie', () => {
    expect(gaugeFull(0, 'bb', [], 0)).toBe(false);
    expect(gaugeFull(0, 'bb', [], totalXPForBondLevel(2))).toBe(true);
    expect(getNextEvolution('bb', 'power', [])).toBe('rookie');
  });
  it('outros estágios não mudam (rookie sem pontos segue fechado, ainda com Vínculo alto)', () => {
    expect(gaugeFull(0, 'rookie', [], totalXPForBondLevel(5))).toBe(false);
    expect(getNextEvolution('rookie', 'power', [])).toBe('champion-power');
  });
});

describe('forma BB — recusa motivada (D5)', () => {
  it('Torneio, Duelo e Guilda recusam BB com motivo; os demais seguem livres', () => {
    expect(bbRefusal({ evolutionStage: 'bb' })).toBe('bb-locked');
    expect(bbRefusal({ evolutionStage: 'rookie' })).toBeNull();
    expect(bbRefusal({ evolutionStage: undefined })).toBeNull();
    expect(Object.keys(BB_LOCKED_BUILDINGS).sort()).toEqual(['arena.duelo', 'arena.torneio', 'hall.guilda']);
  });
});

describe('forma BB — leitura tolerante e migração idempotente do id', () => {
  it('variantes viram bb; o resto passa intacto; aplicar duas vezes dá o mesmo', () => {
    for (const v of ['bb', 'BB', ' bb ', 'bb-power']) expect(sanitizeStageId(v)).toBe('bb');
    for (const v of ['rookie', 'champion-power', 'ultra', 'bbq', '']) expect(sanitizeStageId(v)).toBe(v);
    for (const v of ['BB', 'rookie', 'x']) expect(sanitizeStageId(sanitizeStageId(v))).toBe(sanitizeStageId(v));
    expect(isBBStage(sanitizeStageId('BB'))).toBe(true);
  });
});
