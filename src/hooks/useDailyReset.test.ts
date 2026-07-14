import { describe, it, expect } from 'vitest';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays, getMaxEnergyForStage } from '../types/progression';
import { getNextEvolution, getPreviousForm } from '../utils/dailyReset';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';

// Replicate the performDailyReset state-updater logic for unit testing.
// This mirrors the implementation in useDailyReset.ts exactly (including
// using the real getNextEvolution/getPreviousForm from utils/dailyReset.ts).
function simulateReset(prev: any): any {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const yesterdayWeekDay = yesterday.getDay();

  const currentLevel = getStageLevel(prev.evolutionStage);
  const requirements = FORM_REQUIREMENTS[currentLevel];
  const requiredToday = requirements.required;

  let dailyDone = 0;
  const availableActivities = !canSelectWeekdays(prev.evolutionStage)
    ? prev.activities
    : prev.activities.filter((a: any) => a.weekDays?.includes(yesterdayWeekDay));

  availableActivities.forEach((activity: any) => {
    let isComplete = false;
    if (activity.steps.length > 0) {
      isComplete = activity.steps.every((s: any) => s.completed);
    } else {
      isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
    }
    if (isComplete) dailyDone++;
  });

  dailyDone += prev.tasks.filter((t: any) => t.completed).length;

  // Daily goal = min(registered, requirement); perfect day = goal met (with at
  // least 1 task registered) AND full energy at day's end
  const totalTasks = availableActivities.length + prev.tasks.length;
  const dailyGoal = Math.min(totalTasks, requiredToday);
  // Energy bars = the stage's task requirement (requiredToday), not maxHP.
  const energyWasFull = (prev.energyPoints ?? 0) >= requiredToday;
  const dayWasPerfect = totalTasks > 0 && dailyDone >= dailyGoal && energyWasFull;

  let newHP = prev.healthPoints;
  let newPerfectDays = prev.perfectDays;
  let newXP = prev.totalXP;
  let newVirusPoints = prev.virusPoints;
  let newDataPoints = prev.dataPoints;
  let newVaccinePoints = prev.vaccinePoints;
  let newEvolutionStage = prev.evolutionStage;
  let finalUnlockedEvolutions = [...prev.unlockedEvolutions];
  let wasDegeneratedByHP = false;
  let newMaxActivityCap = prev.maxActivityCap;
  let newCurrentBranch = prev.currentBranch;

  // Proportional HP loss vs the same daily goal.
  const completionRatio = dailyGoal > 0 ? Math.min(1, dailyDone / dailyGoal) : 1;
  const heartsLost = Math.floor((1 - completionRatio) * prev.maxHealthPoints);
  if (heartsLost > 0) {
    newHP = Math.max(0, prev.healthPoints - heartsLost);
  }

  if (dayWasPerfect) {
    newPerfectDays++;
    let dailyVirus = 0, dailyData = 0, dailyVaccine = 0;
    availableActivities.forEach((activity: any) => {
      const attrs = (CATEGORY_ATTRIBUTES as any)[activity.category];
      if (attrs) {
        dailyVirus += attrs.virus;
        dailyData += attrs.data;
        dailyVaccine += attrs.vaccine;
      }
    });
    newVirusPoints += dailyVirus;
    newDataPoints += dailyData;
    newVaccinePoints += dailyVaccine;
    newXP += (dailyVirus + dailyData + dailyVaccine) * 10;
  }

  if (newPerfectDays >= requirements.required) {
    newPerfectDays = 0;
    const dominantAttr = Math.max(newVirusPoints, newDataPoints, newVaccinePoints);
    let branch = prev.currentBranch as 'virus' | 'data' | 'vaccine';
    if (newVirusPoints === dominantAttr) branch = 'virus';
    else if (newDataPoints === dominantAttr) branch = 'data';
    else if (newVaccinePoints === dominantAttr) branch = 'vaccine';
    newCurrentBranch = branch;

    newEvolutionStage = getNextEvolution(prev.evolutionStage, branch, prev.unlockedEvolutions);

    const newStageLevel = getStageLevel(newEvolutionStage);
    newHP = MAX_HP_BY_FORM[newStageLevel];
    const newCap = FORM_REQUIREMENTS[newStageLevel].cap;
    if (newCap > newMaxActivityCap) newMaxActivityCap = newCap;
    if (!finalUnlockedEvolutions.includes(newEvolutionStage)) {
      finalUnlockedEvolutions.push(newEvolutionStage);
    }
  }

  if (newHP === 0) {
    wasDegeneratedByHP = true;
    newEvolutionStage = getPreviousForm(prev.evolutionStage, newCurrentBranch);
    const degeneratedLevel = getStageLevel(newEvolutionStage);
    newHP = MAX_HP_BY_FORM[degeneratedLevel];
    const degReqs = FORM_REQUIREMENTS[degeneratedLevel];
    newPerfectDays = Math.floor(degReqs.required / 2);
  }

  const resetActivities = prev.activities.map((a: any) => ({
    ...a,
    steps: a.steps.map((s: any) => ({ ...s, completed: false })),
    completedToday: false,
  }));
  const resetTasks = prev.tasks.map((t: any) => ({ ...t, completed: false }));
  const finalStageLevel = getStageLevel(newEvolutionStage);
  const newMaxHP = MAX_HP_BY_FORM[finalStageLevel];

  return {
    ...prev,
    activities: resetActivities,
    tasks: resetTasks,
    healthPoints: newHP,
    maxHealthPoints: newMaxHP,
    perfectDays: newPerfectDays,
    totalXP: newXP,
    virusPoints: newVirusPoints,
    dataPoints: newDataPoints,
    vaccinePoints: newVaccinePoints,
    evolutionStage: newEvolutionStage,
    currentBranch: newCurrentBranch,
    unlockedEvolutions: finalUnlockedEvolutions,
    degeneratedByHP: wasDegeneratedByHP,
    lastDayWasPerfect: dayWasPerfect,
    maxActivityCap: newMaxActivityCap,
  };
}

const baseState = () => ({
  activities: [],
  tasks: [],
  healthPoints: 3,
  maxHealthPoints: 3,
  energyPoints: 10, // full by default (≥ any stage requirement) so task-focused tests aren't affected
  perfectDays: 0,
  totalXP: 0,
  virusPoints: 0,
  dataPoints: 0,
  vaccinePoints: 0,
  evolutionStage: 'rookie',
  unlockedEvolutions: ['rookie'],
  currentBranch: 'data' as const,
  maxActivityCap: 6,
  lastResetDate: 'yesterday',
});

describe('performDailyReset — proportional HP loss', () => {
  it('no penalty when there were no tasks to do', () => {
    const result = simulateReset({ ...baseState(), healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
    expect(result.lastDayWasPerfect).toBe(false);
  });

  it('no penalty when all tasks were completed', () => {
    const tasks = [{ id: 't1', completed: true }, { id: 't2', completed: true }];
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
  });

  it('meeting the stage requirement is safe even with many registered tasks', () => {
    // rookie requires 4; 10 registered but 4 done → goal met → no loss
    const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, completed: i < 4 }));
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
  });

  it('doing 1 of the required 4 loses 2 hearts (floor(0.75*3))', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, completed: i < 1 }));
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(1);
    expect(result.lastDayWasPerfect).toBe(false);
  });

  it('50% done with 3 hearts loses 1 heart (floor(0.5*3))', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: i < 2 }));
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(2);
  });

  it('increments perfectDays and awards XP on a perfect day', () => {
    // rookie requires 4; give 4 completed tasks + full energy (baseState)
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = simulateReset({ ...baseState(), tasks });
    expect(result.lastDayWasPerfect).toBe(true);
    expect(result.perfectDays).toBeGreaterThanOrEqual(1);
  });

  it('doing ALL registered tasks (fewer than the requirement) + full energy = perfect day', () => {
    // rookie requires 4, but only 3 registered — all 3 done, energy full
    const tasks = Array.from({ length: 3 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = simulateReset({ ...baseState(), tasks });
    expect(result.lastDayWasPerfect).toBe(true);
    expect(result.healthPoints).toBe(3);
  });

  it('tasks met but energy NOT full → day is not perfect', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = simulateReset({ ...baseState(), tasks, energyPoints: 1 });
    expect(result.lastDayWasPerfect).toBe(false);
    // No heart loss either — tasks were all done
    expect(result.healthPoints).toBe(3);
  });

  it('resets activities and tasks to incomplete', () => {
    const tasks = [{ id: 't1', completed: true }];
    const acts = [{ id: 'a1', category: 'Health', steps: [{ id: 's1', label: 'x', completed: true }], weekDays: [0,1,2,3,4,5,6] }];
    const result = simulateReset({ ...baseState(), tasks, activities: acts });
    expect(result.tasks[0].completed).toBe(false);
    expect(result.activities[0].steps[0].completed).toBe(false);
  });
});

describe('getMaxEnergyForStage — energy bars = task requirement', () => {
  it('matches the stage requirement for each form', () => {
    expect(getMaxEnergyForStage('rookie')).toBe(FORM_REQUIREMENTS.rookie.required);           // 4
    expect(getMaxEnergyForStage('champion-virus')).toBe(FORM_REQUIREMENTS.champion.required);  // 5
    expect(getMaxEnergyForStage('ultra')).toBe(FORM_REQUIREMENTS.ultra.required);               // 8
  });

  it('can differ from the stage max HP (rookie: 4 energy bars, 3 hearts)', () => {
    expect(getMaxEnergyForStage('rookie')).toBe(4);
    expect(MAX_HP_BY_FORM.rookie).toBe(3);
  });
});

describe('performDailyReset — evolution', () => {
  it('evolves rookie into a champion form after enough perfect days', () => {
    let state = { ...baseState() };
    for (let i = 0; i < FORM_REQUIREMENTS.rookie.required; i++) {
      const tasks = Array.from({ length: 4 }, (_, j) => ({ id: `t${i}-${j}`, completed: true }));
      state = simulateReset({ ...state, tasks });
    }
    expect(getStageLevel(state.evolutionStage)).toBe('champion');
    expect(state.unlockedEvolutions).toContain(state.evolutionStage);
  });
});

describe('performDailyReset — degeneration', () => {
  it('degenerates a champion form back to rookie when HP drops to 0', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 1, evolutionStage: 'champion-virus', currentBranch: 'virus' });
    expect(result.degeneratedByHP).toBe(true);
    expect(result.evolutionStage).toBe('rookie');
  });

  it('grants a half-requirement head start when degenerating by HP (recovery discount)', () => {
    // champion-virus with 1 HP, tasks all undone → loses the heart →
    // degenerates back to rookie. The discount gives floor(required/2) perfect
    // days for free. Non-cumulative — always floor(required/2) of the new
    // (lower) stage, so a second degeneration gets the same discount again.
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = simulateReset({
      ...baseState(),
      tasks,
      healthPoints: 1,
      evolutionStage: 'champion-virus',
      currentBranch: 'virus',
    });
    expect(result.degeneratedByHP).toBe(true);
    expect(result.evolutionStage).toBe('rookie');
    expect(result.perfectDays).toBe(Math.floor(FORM_REQUIREMENTS.rookie.required / 2));
  });
});
