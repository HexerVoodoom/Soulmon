import { describe, it, expect } from 'vitest';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays } from '../types/progression';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';

// Replicate the performDailyReset state-updater logic for unit testing.
// This mirrors the implementation in useDailyReset.ts exactly.
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

  const dayWasPerfect = dailyDone >= requiredToday;

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

  // Proportional HP loss vs min(registered, requirement):
  // lose floor((1 - done/goal) * maxHP) whole hearts.
  const totalTasks = availableActivities.length + prev.tasks.length;
  const penaltyDenominator = Math.min(totalTasks, requiredToday);
  const completionRatio = penaltyDenominator > 0 ? Math.min(1, dailyDone / penaltyDenominator) : 1;
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

    if (prev.evolutionStage === 'digiegg') newEvolutionStage = 'pichimon';
    else if (prev.evolutionStage === 'pichimon') newEvolutionStage = 'pukamon';

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
    if (prev.evolutionStage === 'tapirmon') newEvolutionStage = 'pukamon';
    else if (prev.evolutionStage === 'pichimon') newEvolutionStage = 'digiegg';
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
  perfectDays: 0,
  totalXP: 0,
  virusPoints: 0,
  dataPoints: 0,
  vaccinePoints: 0,
  evolutionStage: 'tapirmon',
  unlockedEvolutions: ['digiegg', 'tapirmon'],
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
    // tapirmon requires 4; 10 registered but 4 done → goal met → no loss
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
    // tapirmon requires 4; give 4 completed tasks
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = simulateReset({ ...baseState(), tasks });
    expect(result.lastDayWasPerfect).toBe(true);
    expect(result.perfectDays).toBeGreaterThanOrEqual(1);
  });

  it('resets activities and tasks to incomplete', () => {
    const tasks = [{ id: 't1', completed: true }];
    const acts = [{ id: 'a1', category: 'Health', steps: [{ id: 's1', label: 'x', completed: true }], weekDays: [0,1,2,3,4,5,6] }];
    const result = simulateReset({ ...baseState(), tasks, activities: acts });
    expect(result.tasks[0].completed).toBe(false);
    expect(result.activities[0].steps[0].completed).toBe(false);
  });
});

describe('performDailyReset — degeneration', () => {
  it('degenerates tapirmon to pukamon when HP drops to 0', () => {
    // 3 tasks, none done → lose all 3 hearts from 1 → 0 → degenerate
    const tasks = Array.from({ length: 3 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 1, evolutionStage: 'tapirmon' });
    expect(result.degeneratedByHP).toBe(true);
    expect(result.evolutionStage).toBe('pukamon');
  });
});
