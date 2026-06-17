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
  evolutionStage: 'tapirmon',
  unlockedEvolutions: ['digiegg', 'tapirmon'],
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
    // weekDays = [0] → Sunday, yesterday was Tuesday (2) — should be excluded
    state.activities = [
      makeActivity({ weekDays: [0] }),
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

  it('ignores weekday filter for pre-rookie stages', () => {
    const state = baseState();
    state.evolutionStage = 'digiegg';
    // Activity with only Thursday (4) — yesterday was Tuesday (2), so normally excluded
    // But pre-rookie ignores weekday filter — activity is always included
    state.activities = [
      makeActivity({
        weekDays: [4],
        steps: [{ id: 's1', label: 'step', completed: true }],
      }),
    ];
    // Pre-rookie ignores weekDay filter — activity is included
    expect(wasDayPerfect(state)).toBe(true);
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

describe('getNextEvolution', () => {
  it('digiegg → koromon', () => {
    expect(getNextEvolution('digiegg', 'data', [])).toBe('koromon');
  });

  it('koromon → tsunomon (virus)', () => {
    expect(getNextEvolution('koromon', 'virus', [])).toBe('tsunomon');
  });

  it('koromon → pagumon (vaccine)', () => {
    expect(getNextEvolution('koromon', 'vaccine', [])).toBe('pagumon');
  });

  it('koromon defaults to tsunomon when branch is data (no data baby-ii)', () => {
    expect(getNextEvolution('koromon', 'data', [])).toBe('tsunomon');
  });

  it('baby-ii → rookie (branch-based)', () => {
    expect(getNextEvolution('tsunomon', 'virus', [])).toBe('tapirmon');
    expect(getNextEvolution('pagumon', 'vaccine', [])).toBe('kamemon');
    expect(getNextEvolution('tsunomon', 'data', [])).toBe('kudamon');
  });

  it('rookie → champion (branch-based, random pool NOT used)', () => {
    const stage = getNextEvolution('tapirmon', 'virus', []);
    expect(['monochromon', 'tyrannomon', 'ogremon']).toContain(stage);
  });

  it('champion → ultimate (deterministic per branch)', () => {
    expect(getNextEvolution('monochromon', 'virus', [])).toBe('megadramon');
    expect(getNextEvolution('leomon', 'data', [])).toBe('gigadramon');
    expect(getNextEvolution('bakemon', 'vaccine', [])).toBe('triceramon');
  });

  it('ultimate → mega (deterministic per branch)', () => {
    expect(getNextEvolution('megadramon', 'virus', [])).toBe('gaioumon');
    expect(getNextEvolution('gigadramon', 'data', [])).toBe('ultimatebrachiomon');
    expect(getNextEvolution('triceramon', 'vaccine', [])).toBe('titamon');
  });

  it('mega → ultra only when all 3 megas unlocked', () => {
    const allMegas = ['gaioumon', 'ultimatebrachiomon', 'titamon'];
    expect(getNextEvolution('gaioumon', 'virus', allMegas)).toBe('gaioumon-itto');
  });

  it('mega stays put when not all megas unlocked', () => {
    expect(getNextEvolution('gaioumon', 'virus', ['gaioumon'])).toBe('gaioumon');
  });

  it('ultra stays at ultra', () => {
    expect(getNextEvolution('gaioumon-itto', 'virus', [])).toBe('gaioumon-itto');
  });
});

// ── getPreviousForm ────────────────────────────────────────────

describe('getPreviousForm', () => {
  it('gaioumon-itto → correct mega by branch', () => {
    expect(getPreviousForm('gaioumon-itto', 'virus')).toBe('gaioumon');
    expect(getPreviousForm('gaioumon-itto', 'data')).toBe('ultimatebrachiomon');
    expect(getPreviousForm('gaioumon-itto', 'vaccine')).toBe('titamon');
  });

  it('mega → correct ultimate by branch', () => {
    expect(getPreviousForm('gaioumon', 'virus')).toBe('megadramon');
    expect(getPreviousForm('ultimatebrachiomon', 'data')).toBe('gigadramon');
    expect(getPreviousForm('titamon', 'vaccine')).toBe('triceramon');
  });

  it('ultimate → correct champion by branch', () => {
    expect(getPreviousForm('megadramon', 'virus')).toBe('monochromon');
    expect(getPreviousForm('gigadramon', 'data')).toBe('leomon');
    expect(getPreviousForm('triceramon', 'vaccine')).toBe('geremon');
  });

  it('champion → rookie', () => {
    expect(getPreviousForm('monochromon', 'virus')).toBe('tapirmon');
    expect(getPreviousForm('monochromon', 'data')).toBe('kudamon');
    expect(getPreviousForm('monochromon', 'vaccine')).toBe('kamemon');
  });

  it('rookie → koromon', () => {
    expect(getPreviousForm('tapirmon', 'data')).toBe('koromon');
  });

  it('baby-ii → koromon', () => {
    expect(getPreviousForm('tsunomon', 'virus')).toBe('koromon');
    expect(getPreviousForm('pagumon', 'vaccine')).toBe('koromon');
  });

  it('baby-i → digiegg', () => {
    expect(getPreviousForm('koromon', 'data')).toBe('digiegg');
  });

  it('unknown stage → digiegg', () => {
    expect(getPreviousForm('unknown-stage', 'data')).toBe('digiegg');
  });

  it('is deterministic — same inputs always produce same output', () => {
    const r1 = getPreviousForm('gaioumon-itto', 'virus');
    const r2 = getPreviousForm('gaioumon-itto', 'virus');
    expect(r1).toBe(r2);
  });
});
