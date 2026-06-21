import { useState, useEffect, useCallback } from 'react';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays } from '../types/progression';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';
import { STORAGE_KEYS } from '../utils/storageKeys';

interface Step { id: string; label: string; completed: boolean; }
interface Activity {
  id: string;
  category: string;
  steps: Step[];
  weekDays: number[];
  completedToday?: boolean;
  lastCompletedDate?: string;
}
interface Task { id: string; completed: boolean; steps?: Step[]; }

interface ResetGameState {
  activities: Activity[];
  tasks: Task[];
  healthPoints: number;
  maxHealthPoints: number;
  perfectDays: number;
  totalXP: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  evolutionStage: string;
  unlockedEvolutions: string[];
  currentBranch: 'virus' | 'data' | 'vaccine';
  maxActivityCap: number;
  lastResetDate: string;
  attributesSinceLastEvolution: { virus: number; data: number; vaccine: number };
}

interface UseDailyResetProps {
  gameState: ResetGameState;
  setGameState: (fn: (prev: any) => any) => void;
  hasShownRookiePopup: boolean;
  setShowRookieUnlockPopup: (v: boolean) => void;
  setHasShownRookiePopup: (v: boolean) => void;
}

export function useDailyReset({
  gameState,
  setGameState,
  hasShownRookiePopup,
  setShowRookieUnlockPopup,
  setHasShownRookiePopup,
}: UseDailyResetProps) {
  const [timeUntilReset, setTimeUntilReset] = useState('');

  const performDailyReset = useCallback(() => {
    setGameState(prev => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      const yesterdayWeekDay = yesterday.getDay();

      const currentLevel = getStageLevel(prev.evolutionStage);
      const requirements = FORM_REQUIREMENTS[currentLevel];
      const requiredToday = requirements.required;
      // HP penalty threshold: completing less than half is considered neglect
      const halfRequired = Math.ceil(requiredToday / 2);

      let dailyDone = 0;
      const availableActivities = !canSelectWeekdays(prev.evolutionStage)
        ? prev.activities
        : prev.activities.filter((a: Activity) => a.weekDays?.includes(yesterdayWeekDay));

      availableActivities.forEach((activity: Activity) => {
        let isComplete = false;
        if (activity.steps.length > 0) {
          isComplete = activity.steps.every(s => s.completed);
        } else {
          isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
        }
        if (isComplete) dailyDone++;
      });

      dailyDone += prev.tasks.filter((t: Task) => t.completed).length;

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
      let newCurrentBranch = prev.currentBranch as 'virus' | 'data' | 'vaccine';
      let newRecentAttrs = {
        virus: prev.attributesSinceLastEvolution?.virus ?? 0,
        data: prev.attributesSinceLastEvolution?.data ?? 0,
        vaccine: prev.attributesSinceLastEvolution?.vaccine ?? 0,
      };

      // HP penalty: doing less than half the daily requirement is neglect
      if (dailyDone < halfRequired) {
        newHP = Math.max(0, prev.healthPoints - 1);
      }

      if (dayWasPerfect) {
        newPerfectDays++;
        // Version B: attribute points come from feeding, not from daily reset.
        // newRecentAttrs carries whatever was accumulated via handleFeed during the day.
      } else {
        // Streak break: any non-perfect day loses one day of accumulated progress
        newPerfectDays = Math.max(0, prev.perfectDays - 1);
      }

      // Evolution check
      if (newPerfectDays >= requirements.required) {
        newPerfectDays = 0;

        // Use attributes accumulated since the last evolution for branch — not the
        // cumulative all-time total, so the player's current habits still matter.
        const recentV = newRecentAttrs.virus;
        const recentD = newRecentAttrs.data;
        const recentVac = newRecentAttrs.vaccine;
        const dominantAttr = Math.max(recentV, recentD, recentVac);
        let branch = prev.currentBranch as 'virus' | 'data' | 'vaccine';
        if (dominantAttr > 0) {
          if (recentV === dominantAttr) branch = 'virus';
          else if (recentD === dominantAttr) branch = 'data';
          else branch = 'vaccine';
        }
        newCurrentBranch = branch;

        // Reset the recent window after each evolution
        newRecentAttrs = { virus: 0, data: 0, vaccine: 0 };

        if (prev.evolutionStage === 'digiegg') {
          newEvolutionStage = 'pichimon';
        } else if (prev.evolutionStage === 'pichimon') {
          newEvolutionStage = 'pukamon';
        } else if (prev.evolutionStage === 'pukamon') {
          newEvolutionStage = 'tapirmon';
          if (!hasShownRookiePopup) {
            setShowRookieUnlockPopup(true);
            setHasShownRookiePopup(true);
            localStorage.setItem(STORAGE_KEYS.ROOKIE_POPUP_SHOWN, 'true');
          }
        } else if (prev.evolutionStage === 'tapirmon') {
          if (branch === 'virus') newEvolutionStage = 'tuskmon';
          else if (branch === 'data') newEvolutionStage = 'monochromon';
          else newEvolutionStage = 'bakemon';
        } else if (['tuskmon', 'monochromon', 'bakemon'].includes(prev.evolutionStage)) {
          if (branch === 'virus') newEvolutionStage = 'gigadramon';
          else if (branch === 'data') newEvolutionStage = 'triceramon';
          else newEvolutionStage = 'digitamamon';
        } else if (['gigadramon', 'triceramon', 'digitamamon'].includes(prev.evolutionStage)) {
          if (branch === 'virus') newEvolutionStage = 'gaioumon';
          else if (branch === 'vaccine') newEvolutionStage = 'titamon';
          else newEvolutionStage = 'ultimatebrachiomon';
        } else if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(prev.evolutionStage)) {
          const hasAllMegas = ['gaioumon', 'ultimatebrachiomon', 'titamon'].every(m =>
            prev.unlockedEvolutions.includes(m),
          );
          if (hasAllMegas) newEvolutionStage = 'gaioumon-itto';
        }

        const newStageLevel = getStageLevel(newEvolutionStage);
        newHP = MAX_HP_BY_FORM[newStageLevel];
        const newCap = FORM_REQUIREMENTS[newStageLevel].cap;
        if (newCap > newMaxActivityCap) newMaxActivityCap = newCap;

        if (!finalUnlockedEvolutions.includes(newEvolutionStage)) {
          finalUnlockedEvolutions.push(newEvolutionStage);
        }
      }

      // Degeneration by HP
      if (newHP === 0) {
        wasDegeneratedByHP = true;
        const stageToAttr = (s: string): 'virus' | 'data' | 'vaccine' => {
          if (['tuskmon', 'gigadramon', 'gaioumon'].includes(s)) return 'virus';
          if (['bakemon', 'digitamamon', 'titamon'].includes(s)) return 'vaccine';
          return 'data';
        };
        const branch = prev.evolutionStage === 'gaioumon-itto'
          ? newCurrentBranch
          : stageToAttr(prev.evolutionStage);

        if (prev.evolutionStage === 'gaioumon-itto') {
          const branchMap = { virus: 'gaioumon', data: 'ultimatebrachiomon', vaccine: 'titamon' } as const;
          newEvolutionStage = branchMap[branch];
        } else if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(prev.evolutionStage)) {
          const branchMap = { virus: 'gigadramon', data: 'triceramon', vaccine: 'digitamamon' } as const;
          newEvolutionStage = branchMap[branch];
        } else if (['gigadramon', 'triceramon', 'digitamamon'].includes(prev.evolutionStage)) {
          const branchMap = { virus: 'tuskmon', data: 'monochromon', vaccine: 'bakemon' } as const;
          newEvolutionStage = branchMap[branch];
        } else if (['tuskmon', 'monochromon', 'bakemon'].includes(prev.evolutionStage)) {
          newEvolutionStage = 'tapirmon';
        } else if (prev.evolutionStage === 'tapirmon') {
          newEvolutionStage = 'pukamon';
        } else if (prev.evolutionStage === 'pukamon') {
          newEvolutionStage = 'pichimon';
        } else if (prev.evolutionStage === 'pichimon') {
          newEvolutionStage = 'digiegg';
        }

        const degeneratedLevel = getStageLevel(newEvolutionStage);
        newHP = MAX_HP_BY_FORM[degeneratedLevel];
        // HP-based degeneration is a hard penalty: start from zero
        newPerfectDays = 0;
        // Also reset recent branch window after forced degen
        newRecentAttrs = { virus: 0, data: 0, vaccine: 0 };
      }

      const resetActivities = prev.activities.map((activity: Activity) => ({
        ...activity,
        steps: activity.steps.map(step => ({ ...step, completed: false })),
        completedToday: false,
      }));

      const resetTasks = prev.tasks.map((task: Task) => ({ ...task, completed: false }));

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
        lastResetDate: new Date().toDateString(),
        evolutionStage: newEvolutionStage,
        digivolutionSegments: 0,
        digivolutionSegmentsNeeded: 999,
        poopEventScheduled: null,
        foodEventsScheduled: [],
        poopEventCompleted: false,
        foodEventsCompleted: [],
        currentBranch: newCurrentBranch,
        unlockedEvolutions: finalUnlockedEvolutions,
        degeneratedByHP: wasDegeneratedByHP,
        lastDayWasPerfect: dayWasPerfect,
        maxActivityCap: newMaxActivityCap,
        attributesSinceLastEvolution: newRecentAttrs,
        careHPLostToday: 0, // Reset daily care damage cap at midnight
      };
    });
  }, [hasShownRookiePopup, setShowRookieUnlockPopup, setHasShownRookiePopup]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeUntilReset(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      );

      if (now.toDateString() !== gameState.lastResetDate) {
        performDailyReset();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameState.lastResetDate, performDailyReset]);

  return { timeUntilReset };
}
