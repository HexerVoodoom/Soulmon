import { describe, it, expect } from 'vitest';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';

// Pure logic extracted from useProgressTracking for unit testing.
// `today` is fixed so tests are deterministic.
const today = new Date().toDateString();

function computeProgress(state: {
  activities: { steps: { completed: boolean }[]; completedToday?: boolean; lastCompletedDate?: string }[];
  tasks: { completed: boolean }[];
  completedTasks: { completedAt: string }[];
}): number {
  const tasksCompletedToday = state.completedTasks.filter(
    ct => new Date(ct.completedAt).toDateString() === today,
  );
  let totalItems = 0;
  let completedItems = 0;
  state.activities.forEach(a => {
    if (a.steps.length > 0) {
      totalItems += a.steps.length;
      completedItems += a.steps.filter(s => s.completed).length;
    } else {
      totalItems += 1;
      if (a.completedToday && a.lastCompletedDate === today) completedItems += 1;
    }
  });
  totalItems += state.tasks.length;
  completedItems += state.tasks.filter(t => t.completed).length;
  totalItems += tasksCompletedToday.length;
  completedItems += tasksCompletedToday.length;
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
}

function computeTodayAttributes(
  activities: { category: keyof typeof CATEGORY_ATTRIBUTES; steps: { completed: boolean }[]; completedToday?: boolean; lastCompletedDate?: string }[],
): { virus: number; data: number; vaccine: number } {
  let virus = 0, data = 0, vaccine = 0;
  activities.forEach(activity => {
    const isComplete =
      activity.steps.length > 0
        ? activity.steps.every(s => s.completed)
        : !!activity.completedToday && activity.lastCompletedDate === today;
    if (isComplete) {
      const attrs = CATEGORY_ATTRIBUTES[activity.category];
      virus += attrs.virus;
      data += attrs.data;
      vaccine += attrs.vaccine;
    }
  });
  return { virus, data, vaccine };
}

describe('useProgressTracking — progress %', () => {
  it('returns 0 when nothing exists', () => {
    expect(computeProgress({ activities: [], tasks: [], completedTasks: [] })).toBe(0);
  });

  it('returns 100 when all tasks completed', () => {
    const tasks = [{ completed: true }, { completed: true }];
    expect(computeProgress({ activities: [], tasks, completedTasks: [] })).toBe(100);
  });

  it('returns 50 when half tasks done', () => {
    const tasks = [{ completed: true }, { completed: false }];
    expect(computeProgress({ activities: [], tasks, completedTasks: [] })).toBe(50);
  });

  it('counts step-activity completion by step ratio', () => {
    const activities = [{ steps: [{ completed: true }, { completed: false }] }];
    const pct = computeProgress({ activities, tasks: [], completedTasks: [] });
    expect(pct).toBe(50);
  });

  it('counts stepless activity as complete when completedToday + today date', () => {
    const activities = [{ steps: [], completedToday: true, lastCompletedDate: today }];
    expect(computeProgress({ activities, tasks: [], completedTasks: [] })).toBe(100);
  });

  it('counts stepless activity as incomplete when date mismatch', () => {
    const activities = [{ steps: [], completedToday: true, lastCompletedDate: 'Mon Jan 01 2024' }];
    expect(computeProgress({ activities, tasks: [], completedTasks: [] })).toBe(0);
  });
});

describe('useProgressTracking — todayAttributes', () => {
  it('returns zero attributes when no activities', () => {
    expect(computeTodayAttributes([])).toEqual({ virus: 0, data: 0, vaccine: 0 });
  });

  it('accumulates attributes for completed step-activities', () => {
    const activities = [
      { category: 'Health' as const, steps: [{ completed: true }] },
    ];
    const attrs = computeTodayAttributes(activities);
    expect(attrs).toEqual(CATEGORY_ATTRIBUTES['Health']);
  });

  it('does not include incomplete activities in attributes', () => {
    const activities = [
      { category: 'Study' as const, steps: [{ completed: false }] },
    ];
    expect(computeTodayAttributes(activities)).toEqual({ virus: 0, data: 0, vaccine: 0 });
  });

  it('sums attributes across multiple completed activities', () => {
    const activities = [
      { category: 'Health' as const, steps: [{ completed: true }] },
      { category: 'Study' as const, steps: [{ completed: true }] },
    ];
    const { virus, data, vaccine } = computeTodayAttributes(activities);
    expect(virus).toBe(CATEGORY_ATTRIBUTES.Health.virus + CATEGORY_ATTRIBUTES.Study.virus);
    expect(data).toBe(CATEGORY_ATTRIBUTES.Health.data + CATEGORY_ATTRIBUTES.Study.data);
    expect(vaccine).toBe(CATEGORY_ATTRIBUTES.Health.vaccine + CATEGORY_ATTRIBUTES.Study.vaccine);
  });
});
