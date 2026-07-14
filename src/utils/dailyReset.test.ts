import { describe, it, expect } from 'vitest';
import {
  wasDayPerfect,
  countCompletedYesterday,
  getNextEvolution,
  getPreviousForm,
  type GameState,
} from './dailyReset';

// Helpers
const makeActivity = (overrides: Partial<{
  id: string;
  steps: { id: string; label: string; completed: boolean }[];
  completedToday: boolean;
  lastCompletedDate: string;
  weekDays: number[];
}> = {}) => ({
  id: 'act-1',
  name: 'Test',
  category: 'Health' as const,
  emoji: '💪',
  steps: [],
  weekDays: [0, 1, 2, 3, 4, 5, 6],
  completedToday: false,
  lastCompletedDate: undefined,
  ...overrides,
});

const makeTask = (completed = false) => ({
  id: 'task-1',
  name: 'Task',
  category: 'Study' as const,
  emoji: '📚',
  completed,
});

const baseState = (): GameState => ({
  activities: [],
  tasks: [],
  healthPoints: 3,
  maxHealthPoints: 3,
  perfectDays: 0,
  totalXP: 0,
  virusPoints: 0,
  dataPoints: 0,
  vaccinePoints: 0,
  evolutionStage: 'rookie',
  unlockedEvolutions: ['rookie'],
  degeneratedByHP: false,
  currentBranch: 'data',
  lastDayWasPerfect: false,
});

// Compute yesterday the same way the functions do — no fake timers needed.
// This ensures the strings are always in sync regardless of timezone or test-runner time.
const _now = new Date();
const _yesterday = new Date(_now);
_yesterday.setDate(_now.getDate() - 1);
const YESTERDAY_STRING = _yesterday.toDateString();
const YESTERDAY_WEEKDAY = _yesterday.getDay();
// A weekday guaranteed to differ from yesterday's, so the weekday filter excludes it
const NOT_YESTERDAY_WEEKDAY = (YESTERDAY_WEEKDAY + 1) % 7;

// ── wasDayPerfect ──────────────────────────────────────────────

describe('wasDayPerfect', () => {
  it('returns false when no activities and no tasks', () => {
    expect(wasDayPerfect(baseState())).toBe(false);
  });

  it('returns true when all step-activities completed yesterday', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        steps: [{ id: 's1', label: 'step', completed: true }],
        weekDays: [YESTERDAY_WEEKDAY], // Tuesday
      }),
    ];
    expect(wasDayPerfect(state)).toBe(true);
  });

  it('returns false when step-activity incomplete', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        steps: [
          { id: 's1', label: 'step1', completed: true },
          { id: 's2', label: 'step2', completed: false },
        ],
        weekDays: [YESTERDAY_WEEKDAY],
      }),
    ];
    expect(wasDayPerfect(state)).toBe(false);
  });

  it('returns true when no-step activity was completed yesterday', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        completedToday: true,
        lastCompletedDate: YESTERDAY_STRING,
        weekDays: [YESTERDAY_WEEKDAY],
      }),
    ];
    expect(wasDayPerfect(state)).toBe(true);
  });

  it('returns false when no-step activity completed on a different date', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        completedToday: true,
        lastCompletedDate: 'Mon Jun 14 2026', // older date, not yesterday
        weekDays: [YESTERDAY_WEEKDAY],
      }),
    ];
    expect(wasDayPerfect(state)).toBe(false);
  });

  it('ignores activities not scheduled for yesterday (weekday filter)', () => {
    const state = baseState();
    // Scheduled for a weekday that is NOT yesterday — should be excluded by the filter
    state.activities = [
      makeActivity({ weekDays: [NOT_YESTERDAY_WEEKDAY] }),
    ];
    // Only the task counts
    state.tasks = [makeTask(true)];
    expect(wasDayPerfect(state)).toBe(true);
  });

  it('returns true when all tasks completed and no activities', () => {
    const state = baseState();
    state.tasks = [makeTask(true), makeTask(true)];
    expect(wasDayPerfect(state)).toBe(true);
  });

  it('returns false when some tasks not completed', () => {
    const state = baseState();
    state.tasks = [makeTask(true), makeTask(false)];
    expect(wasDayPerfect(state)).toBe(false);
  });
});

// ── countCompletedYesterday ────────────────────────────────────

describe('countCompletedYesterday', () => {
  it('returns 0 when nothing was done', () => {
    const state = baseState();
    state.activities = [makeActivity({ weekDays: [YESTERDAY_WEEKDAY] })];
    state.tasks = [makeTask(false)];
    expect(countCompletedYesterday(state)).toBe(0);
  });

  it('counts completed activities and tasks independently', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        steps: [{ id: 's1', label: 'step', completed: true }],
        weekDays: [YESTERDAY_WEEKDAY],
      }),
    ];
    state.tasks = [makeTask(true), makeTask(false)];
    expect(countCompletedYesterday(state)).toBe(2);
  });
});

// ── getNextEvolution ───────────────────────────────────────────
// The Soulmon tree is unique per player (utils/oracle.ts) — the engine only
// deals in ids ('rookie' | '{champion|ultimate|mega}-{virus|data|vaccine}' |
// 'ultra'), never species names, so evolution is pure id arithmetic.

describe('getNextEvolution', () => {
  it('rookie → champion, by the current dominant attribute', () => {
    expect(getNextEvolution('rookie', 'virus', [])).toBe('champion-virus');
    expect(getNextEvolution('rookie', 'data', [])).toBe('champion-data');
    expect(getNextEvolution('rookie', 'vaccine', [])).toBe('champion-vaccine');
  });

  it('champion → ultimate, by the current dominant attribute (can differ from the champion\'s own branch)', () => {
    expect(getNextEvolution('champion-virus', 'virus', [])).toBe('ultimate-virus');
    expect(getNextEvolution('champion-virus', 'data', [])).toBe('ultimate-data');
  });

  it('ultimate → mega, by the current dominant attribute', () => {
    expect(getNextEvolution('ultimate-virus', 'virus', [])).toBe('mega-virus');
    expect(getNextEvolution('ultimate-data', 'vaccine', [])).toBe('mega-vaccine');
  });

  it('mega → ultra only when all 3 megas are unlocked', () => {
    const allMegas = ['mega-virus', 'mega-data', 'mega-vaccine'];
    expect(getNextEvolution('mega-virus', 'virus', allMegas)).toBe('ultra');
    expect(getNextEvolution('mega-data', 'data', allMegas)).toBe('ultra');
  });

  it('mega stays put when not all megas unlocked', () => {
    expect(getNextEvolution('mega-virus', 'virus', ['mega-virus'])).toBe('mega-virus');
  });

  it('ultra stays at ultra', () => {
    expect(getNextEvolution('ultra', 'virus', [])).toBe('ultra');
    expect(getNextEvolution('ultra', 'data', [])).toBe('ultra');
  });
});

// ── getPreviousForm ────────────────────────────────────────────

describe('getPreviousForm', () => {
  it('ultra → mega of the CURRENT branch (ultra has no branch embedded)', () => {
    expect(getPreviousForm('ultra', 'virus')).toBe('mega-virus');
    expect(getPreviousForm('ultra', 'data')).toBe('mega-data');
    expect(getPreviousForm('ultra', 'vaccine')).toBe('mega-vaccine');
  });

  it('mega → ultimate of the SAME branch (embedded in the id, ignores the passed branch)', () => {
    expect(getPreviousForm('mega-virus', 'data')).toBe('ultimate-virus');
    expect(getPreviousForm('mega-vaccine', 'virus')).toBe('ultimate-vaccine');
  });

  it('ultimate → champion of the SAME branch', () => {
    expect(getPreviousForm('ultimate-virus', 'data')).toBe('champion-virus');
    expect(getPreviousForm('ultimate-data', 'virus')).toBe('champion-data');
  });

  it('champion → rookie (all branches collapse to the single rookie)', () => {
    expect(getPreviousForm('champion-virus', 'virus')).toBe('rookie');
    expect(getPreviousForm('champion-data', 'data')).toBe('rookie');
    expect(getPreviousForm('champion-vaccine', 'vaccine')).toBe('rookie');
  });

  it('rookie stays at rookie — nothing below it', () => {
    expect(getPreviousForm('rookie', 'data')).toBe('rookie');
  });

  it('unknown stage → rookie', () => {
    expect(getPreviousForm('unknown-stage', 'data')).toBe('rookie');
  });

  it('is deterministic — same inputs always produce same output', () => {
    const r1 = getPreviousForm('ultra', 'virus');
    const r2 = getPreviousForm('ultra', 'virus');
    expect(r1).toBe(r2);
  });
});
