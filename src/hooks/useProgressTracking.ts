import { useMemo } from 'react';
import { canSelectWeekdays } from '../types/progression';
import { CATEGORY_ATTRIBUTES, ActivityCategory } from '../types/attributes';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface Activity {
  id: string;
  category: ActivityCategory;
  steps: Step[];
  weekDays: number[];
  completedToday?: boolean;
  lastCompletedDate?: string;
}

interface Task {
  id: string;
  completed: boolean;
}

interface CompletedTask {
  id: string;
  completedAt: string;
}

interface ProgressState {
  activities: Activity[];
  tasks: Task[];
  completedTasks: CompletedTask[];
  evolutionStage: string;
}

export function useProgressTracking(gameState: ProgressState) {
  const today = useMemo(() => new Date().toDateString(), []);
  const todayWeekDay = useMemo(() => new Date().getDay(), []);

  const tasksCompletedToday = useMemo(
    () => gameState.completedTasks.filter(ct => new Date(ct.completedAt).toDateString() === today),
    [gameState.completedTasks, today],
  );

  const availableActivities = useMemo(() => {
    if (!canSelectWeekdays(gameState.evolutionStage)) return gameState.activities;
    return gameState.activities.filter(a => a.weekDays?.includes(todayWeekDay));
  }, [gameState.activities, gameState.evolutionStage, todayWeekDay]);

  const dailyTotal = useMemo(
    () => availableActivities.length + gameState.tasks.length + tasksCompletedToday.length,
    [availableActivities, gameState.tasks, tasksCompletedToday],
  );

  const dailyDone = useMemo(() => {
    let count = 0;

    availableActivities.forEach(activity => {
      let isComplete = false;
      if (activity.steps.length > 0) {
        isComplete = activity.steps.every(s => s.completed);
      } else {
        isComplete = !!activity.completedToday && activity.lastCompletedDate === today;
      }
      if (isComplete) count++;
    });

    count += gameState.tasks.filter(t => t.completed).length;
    count += tasksCompletedToday.length;
    return count;
  }, [availableActivities, gameState.tasks, tasksCompletedToday, today]);

  const isDayPerfect = dailyTotal > 0 && dailyDone === dailyTotal;

  const progress = useMemo(() => {
    const weekActivities = gameState.activities.filter(a => a.weekDays?.includes(todayWeekDay));
    let totalItems = 0;
    let completedItems = 0;

    weekActivities.forEach(activity => {
      if (activity.steps.length > 0) {
        totalItems += activity.steps.length;
        completedItems += activity.steps.filter(s => s.completed).length;
      } else {
        totalItems += 1;
        if (activity.completedToday && activity.lastCompletedDate === today) completedItems += 1;
      }
    });

    totalItems += gameState.tasks.length;
    completedItems += gameState.tasks.filter(t => t.completed).length;
    totalItems += tasksCompletedToday.length;
    completedItems += tasksCompletedToday.length;

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  }, [gameState.activities, gameState.tasks, tasksCompletedToday, today, todayWeekDay]);

  const todayAttributes = useMemo(() => {
    let virus = 0;
    let data = 0;
    let vaccine = 0;

    gameState.activities.forEach(activity => {
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
  }, [gameState.activities, today]);

  return { dailyTotal, dailyDone, isDayPerfect, progress, todayAttributes };
}
