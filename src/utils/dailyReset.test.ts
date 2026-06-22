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
  // digiegg → baby-i by line
  it('digiegg → pichimon (tapirmon)', () => {
    expect(getNextEvolution('digiegg', 'tapirmon', 'data', [])).toBe('pichimon');
  });
  it('digiegg → chicomon (veemon)', () => {
    expect(getNextEvolution('digiegg', 'veemon', 'data', [])).toBe('chicomon');
  });
  it('digiegg → yukimibotamon (salamon)', () => {
    expect(getNextEvolution('digiegg', 'salamon', 'data', [])).toBe('yukimibotamon');
  });

  // baby-i → baby-ii by line
  it('baby-i → baby-ii by line', () => {
    expect(getNextEvolution('pichimon',      'tapirmon', 'data', [])).toBe('pukamon');
    expect(getNextEvolution('chicomon',      'veemon',   'data', [])).toBe('chibimon');
    expect(getNextEvolution('yukimibotamon', 'salamon',  'data', [])).toBe('nyaromon');
  });

  // baby-ii → rookie by line
  it('baby-ii → rookie by line', () => {
    expect(getNextEvolution('pukamon',  'tapirmon', 'data', [])).toBe('tapirmon');
    expect(getNextEvolution('chibimon', 'veemon',   'data', [])).toBe('veemon');
    expect(getNextEvolution('nyaromon', 'salamon',  'data', [])).toBe('plotmon');
  });

  // rookie → champion (branch-based, per line)
  it('tapirmon rookie → champion by branch', () => {
    expect(getNextEvolution('tapirmon', 'tapirmon', 'virus',    [])).toBe('tuskmon');
    expect(getNextEvolution('tapirmon', 'tapirmon', 'data',     [])).toBe('monochromon');
    expect(getNextEvolution('tapirmon', 'tapirmon', 'vaccine',  [])).toBe('bakemon');
  });
  it('veemon rookie → champion by branch', () => {
    expect(getNextEvolution('veemon', 'veemon', 'data',    [])).toBe('exveemon');
    expect(getNextEvolution('veemon', 'veemon', 'virus',   [])).toBe('veedramon');
    expect(getNextEvolution('veemon', 'veemon', 'vaccine', [])).toBe('flamedramon');
  });
  it('salamon rookie → champion by branch', () => {
    expect(getNextEvolution('plotmon', 'salamon', 'vaccine', [])).toBe('gatomon');
    expect(getNextEvolution('plotmon', 'salamon', 'virus',   [])).toBe('gatomon-black');
    expect(getNextEvolution('plotmon', 'salamon', 'data',    [])).toBe('mikemon');
  });

  // champion → ultimate (branch-based)
  it('tapirmon champion → ultimate by branch', () => {
    expect(getNextEvolution('monochromon', 'tapirmon', 'virus',   [])).toBe('gigadramon');
    expect(getNextEvolution('tuskmon',     'tapirmon', 'data',    [])).toBe('triceramon');
    expect(getNextEvolution('bakemon',     'tapirmon', 'vaccine', [])).toBe('digitamamon');
  });

  // ultimate → mega (branch-based)
  it('tapirmon ultimate → mega by branch', () => {
    expect(getNextEvolution('gigadramon',  'tapirmon', 'virus',   [])).toBe('gaioumon');
    expect(getNextEvolution('triceramon',  'tapirmon', 'data',    [])).toBe('ultimatebrachiomon');
    expect(getNextEvolution('digitamamon', 'tapirmon', 'vaccine', [])).toBe('titamon');
  });

  // mega → ultra only when all 3 megas unlocked
  it('mega → ultra only when all 3 megas unlocked (tapirmon)', () => {
    const allMegas = ['gaioumon', 'ultimatebrachiomon', 'titamon'];
    expect(getNextEvolution('gaioumon', 'tapirmon', 'virus', allMegas)).toBe('gaioumon-itto');
  });
  it('mega → ultra (veemon)', () => {
    const allMegas = ['imperialdramon', 'ulforceveedramon', 'magnamon'];
    expect(getNextEvolution('imperialdramon', 'veemon', 'data', allMegas)).toBe('imperialdramon-paladin');
  });
  it('mega → ultra (salamon)', () => {
    const allMegas = ['ophanimon', 'lilithmon', 'holydramon'];
    expect(getNextEvolution('ophanimon', 'salamon', 'vaccine', allMegas)).toBe('mastemon');
  });

  it('mega stays put when not all megas unlocked', () => {
    expect(getNextEvolution('gaioumon', 'tapirmon', 'virus', ['gaioumon'])).toBe('gaioumon');
  });

  it('ultra stays at ultra', () => {
    expect(getNextEvolution('gaioumon-itto',         'tapirmon', 'virus',   [])).toBe('gaioumon-itto');
    expect(getNextEvolution('imperialdramon-paladin', 'veemon',   'data',    [])).toBe('imperialdramon-paladin');
    expect(getNextEvolution('mastemon',               'salamon',  'vaccine', [])).toBe('mastemon');
  });
});

// ── getPreviousForm ────────────────────────────────────────────

describe('getPreviousForm', () => {
  it('ultra → correct mega by branch (tapirmon)', () => {
    expect(getPreviousForm('gaioumon-itto', 'virus')).toBe('gaioumon');
    expect(getPreviousForm('gaioumon-itto', 'data')).toBe('ultimatebrachiomon');
    expect(getPreviousForm('gaioumon-itto', 'vaccine')).toBe('titamon');
  });

  it('ultra → correct mega by branch (veemon)', () => {
    expect(getPreviousForm('imperialdramon-paladin', 'data')).toBe('imperialdramon');
    expect(getPreviousForm('imperialdramon-paladin', 'virus')).toBe('ulforceveedramon');
    expect(getPreviousForm('imperialdramon-paladin', 'vaccine')).toBe('magnamon');
  });

  it('ultra → correct mega by branch (salamon)', () => {
    expect(getPreviousForm('mastemon', 'vaccine')).toBe('ophanimon');
    expect(getPreviousForm('mastemon', 'virus')).toBe('lilithmon');
    expect(getPreviousForm('mastemon', 'data')).toBe('holydramon');
  });

  it('mega → correct ultimate (tapirmon — same-attribute)', () => {
    expect(getPreviousForm('gaioumon',           'virus')).toBe('gigadramon');
    expect(getPreviousForm('ultimatebrachiomon', 'data')).toBe('triceramon');
    expect(getPreviousForm('titamon',            'vaccine')).toBe('digitamamon');
  });

  it('mega → correct ultimate (veemon — same-attribute)', () => {
    expect(getPreviousForm('imperialdramon',   'data')).toBe('paildramon');
    expect(getPreviousForm('ulforceveedramon', 'virus')).toBe('aeroveedramon');
    expect(getPreviousForm('magnamon',         'vaccine')).toBe('raidramon');
  });

  it('ultimate → correct champion (tapirmon — same-attribute)', () => {
    expect(getPreviousForm('gigadramon',  'virus')).toBe('tuskmon');
    expect(getPreviousForm('triceramon',  'data')).toBe('monochromon');
    expect(getPreviousForm('digitamamon', 'vaccine')).toBe('bakemon');
  });

  it('champion → rookie (all champions collapse to the line rookie)', () => {
    expect(getPreviousForm('monochromon', 'data')).toBe('tapirmon');
    expect(getPreviousForm('tuskmon',     'virus')).toBe('tapirmon');
    expect(getPreviousForm('exveemon',    'data')).toBe('veemon');
    expect(getPreviousForm('gatomon',     'vaccine')).toBe('plotmon');
  });

  it('rookie → baby-ii', () => {
    expect(getPreviousForm('tapirmon', 'data')).toBe('pukamon');
    expect(getPreviousForm('veemon',   'data')).toBe('chibimon');
    expect(getPreviousForm('plotmon',  'data')).toBe('nyaromon');
  });

  it('baby-ii → baby-i', () => {
    expect(getPreviousForm('pukamon',  'data')).toBe('pichimon');
    expect(getPreviousForm('chibimon', 'data')).toBe('chicomon');
    expect(getPreviousForm('nyaromon', 'data')).toBe('yukimibotamon');
  });

  it('baby-i → digiegg', () => {
    expect(getPreviousForm('pichimon',      'data')).toBe('digiegg');
    expect(getPreviousForm('chicomon',      'data')).toBe('digiegg');
    expect(getPreviousForm('yukimibotamon', 'data')).toBe('digiegg');
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
