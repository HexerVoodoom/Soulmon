import { useEffect, useCallback } from 'react';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { getNextEvolution } from '../utils/dailyReset';
import { EVO_ITEMS } from '../utils/shop';

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
  energyPoints: number;
  perfectDays: number;
  totalXP: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  evolutionStage: string;
  eggType?: 'tapirmon' | 'veemon' | 'salamon';
  unlockedEvolutions: string[];
  currentBranch: 'virus' | 'data' | 'vaccine';
  maxActivityCap: number;
  lastResetDate: string;
  attributesSinceLastEvolution: { virus: number; data: number; vaccine: number };
  poopEventsShown: number[];
  poopEventsCompleted: number[];
  equippedEvoItem?: string | null;
}

type Attr = 'virus' | 'data' | 'vaccine';
type EggLine = 'tapirmon' | 'veemon' | 'salamon';

// Estágios por linha, agrupados por tier e atributo — usados na degeneração
const LINE_STAGES: Record<EggLine, {
  babyI: string; babyII: string; rookie: string;
  champion: Record<Attr, string>;
  ultimate: Record<Attr, string>;
  mega: Record<Attr, string>;
  ultra: string;
}> = {
  tapirmon: {
    babyI: 'pichimon', babyII: 'pukamon', rookie: 'tapirmon',
    champion: { virus: 'tuskmon', data: 'monochromon', vaccine: 'bakemon' },
    ultimate: { virus: 'gigadramon', data: 'triceramon', vaccine: 'digitamamon' },
    mega: { virus: 'gaioumon', data: 'ultimatebrachiomon', vaccine: 'titamon' },
    ultra: 'gaioumon-itto',
  },
  veemon: {
    babyI: 'chicomon', babyII: 'chibimon', rookie: 'veemon',
    champion: { data: 'exveemon', virus: 'veedramon', vaccine: 'flamedramon' },
    ultimate: { data: 'paildramon', virus: 'aeroveedramon', vaccine: 'raidramon' },
    mega: { data: 'imperialdramon', virus: 'ulforceveedramon', vaccine: 'magnamon' },
    ultra: 'imperialdramon-paladin',
  },
  salamon: {
    babyI: 'yukimibotamon', babyII: 'nyaromon', rookie: 'plotmon',
    champion: { vaccine: 'gatomon', virus: 'gatomon-black', data: 'mikemon' },
    ultimate: { vaccine: 'angewomon', virus: 'ladydevimon', data: 'nefertimon' },
    mega: { vaccine: 'ophanimon', virus: 'lilithmon', data: 'holydramon' },
    ultra: 'mastemon',
  },
};

// Degeneração: retorna a forma anterior, ciente da linha (eggType) e do atributo da forma atual
function getDegeneratedStage(stage: string, eggType: EggLine | undefined, currentBranch: Attr): string {
  const line = LINE_STAGES[eggType ?? 'tapirmon'] ?? LINE_STAGES.tapirmon;
  const level = getStageLevel(stage);
  const attrOf = (s: string): Attr => {
    for (const a of ['virus', 'data', 'vaccine'] as Attr[]) {
      if (line.champion[a] === s || line.ultimate[a] === s || line.mega[a] === s) return a;
    }
    return currentBranch;
  };
  switch (level) {
    case 'ultra':     return line.mega[currentBranch];
    case 'mega':      return line.ultimate[attrOf(stage)];
    case 'ultimate':  return line.champion[attrOf(stage)];
    case 'champion':  return line.rookie;
    case 'rookie':    return line.babyII;
    case 'baby-ii':   return line.babyI;
    case 'baby-i':    return 'digiegg';
    default:          return 'digiegg';
  }
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
  const performDailyReset = useCallback(() => {
    setGameState(prev => {
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

      // A perfect day (evolution point) requires BOTH the task requirement AND
      // full energy at the end of the day — feeding is part of the care loop.
      const energyWasFull = (prev.energyPoints ?? 0) >= prev.maxHealthPoints;
      const dayWasPerfect = dailyDone >= requiredToday && energyWasFull;

      let newHP = prev.healthPoints;
      let newPerfectDays = prev.perfectDays;
      let newEvolutionStage = prev.evolutionStage;
      let finalUnlockedEvolutions = [...prev.unlockedEvolutions];
      let wasDegeneratedByHP = false;
      let usedForcedBranch = false;
      let usedEvoItem = false;
      let newMaxActivityCap = prev.maxActivityCap;
      let newCurrentBranch = prev.currentBranch as 'virus' | 'data' | 'vaccine';
      let newRecentAttrs = {
        virus: prev.attributesSinceLastEvolution?.virus ?? 0,
        data: prev.attributesSinceLastEvolution?.data ?? 0,
        vaccine: prev.attributesSinceLastEvolution?.vaccine ?? 0,
      };

      // HP penalty: proportional to the tasks NOT done, measured against
      // min(registered, stage requirement). Meeting the stage requirement is
      // always safe, and registering MORE activities than required never adds
      // risk (no perverse incentive to register fewer). Doing everything you
      // registered is also safe. No tasks registered → nothing to fail.
      const totalTasks = availableActivities.length + prev.tasks.length;
      const penaltyDenominator = Math.min(totalTasks, requiredToday);
      const completionRatio = penaltyDenominator > 0 ? Math.min(1, dailyDone / penaltyDenominator) : 1;
      const heartsLost = Math.floor((1 - completionRatio) * prev.maxHealthPoints);
      if (heartsLost > 0) {
        newHP = Math.max(0, prev.healthPoints - heartsLost);
      }

      // (Poop no longer penalizes at the day turn — uncleaned poop drains 1 heart
      // every 6 hours while it's on screen; handled live in App.tsx.)

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
        // Shop emblem overrides the attribute-based branch (consumed on use)
        if (prev.forcedBranch) {
          branch = prev.forcedBranch;
          usedForcedBranch = true;
        }
        newCurrentBranch = branch;

        // Reset the recent window after each evolution
        newRecentAttrs = { virus: 0, data: 0, vaccine: 0 };

        const isBabyII = ['pukamon', 'chibimon', 'nyaromon'].includes(prev.evolutionStage);
        newEvolutionStage = getNextEvolution(
          prev.evolutionStage,
          prev.eggType ?? 'tapirmon',
          branch,
          prev.unlockedEvolutions,
        );
        // Item digivolution (shop): when criteria are met AND an item is
        // equipped for this level, the item form REPLACES the branch form.
        // The natural form is still unlocked (tree/mega logic stays coherent);
        // degeneration later returns to the branch form, never the item form.
        const naturalNext = newEvolutionStage;
        const evoItem = prev.equippedEvoItem ? EVO_ITEMS[prev.equippedEvoItem] : null;
        if (evoItem?.evoTarget && getStageLevel(naturalNext) === evoItem.evoLevel && naturalNext !== prev.evolutionStage) {
          newEvolutionStage = evoItem.evoTarget;
          usedEvoItem = true;
        }
        if (isBabyII && !hasShownRookiePopup) {
          setShowRookieUnlockPopup(true);
          setHasShownRookiePopup(true);
          localStorage.setItem(STORAGE_KEYS.ROOKIE_POPUP_SHOWN, 'true');
        }

        const newStageLevel = getStageLevel(newEvolutionStage);
        newHP = MAX_HP_BY_FORM[newStageLevel];
        const newCap = FORM_REQUIREMENTS[newStageLevel].cap;
        if (newCap > newMaxActivityCap) newMaxActivityCap = newCap;

        if (!finalUnlockedEvolutions.includes(naturalNext)) {
          finalUnlockedEvolutions.push(naturalNext);
        }
      }

      // Degeneration by HP
      if (newHP === 0) {
        wasDegeneratedByHP = true;
        newEvolutionStage = getDegeneratedStage(prev.evolutionStage, prev.eggType, newCurrentBranch);

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
        lastResetDate: new Date().toDateString(),
        evolutionStage: newEvolutionStage,
        digivolutionSegments: 0,
        digivolutionSegmentsNeeded: 999,
        poopEventsScheduled: [],
        poopEventsCompleted: [],
        poopEventsShown: [],
        poopPenaltyClockAt: 0,
        currentBranch: newCurrentBranch,
        unlockedEvolutions: finalUnlockedEvolutions,
        degeneratedByHP: wasDegeneratedByHP,
        lastDayWasPerfect: dayWasPerfect,
        maxActivityCap: newMaxActivityCap,
        attributesSinceLastEvolution: newRecentAttrs,
        forcedBranch: usedForcedBranch ? null : (prev.forcedBranch ?? null),
        equippedEvoItem: usedEvoItem ? null : (prev.equippedEvoItem ?? null),
        energyPoints: 0, // Energy resets daily (refills by feeding)
        // Summary of yesterday, shown once as a "daily report" on next open.
        lastDayReport: {
          date: yesterdayString,
          done: dailyDone,
          total: totalTasks,
          required: requiredToday,
          heartsLost,
          wasPerfect: dayWasPerfect,
          energyWasFull,
          perfectDays: newPerfectDays,
          degenerated: wasDegeneratedByHP,
        },
      };
    });
  }, [hasShownRookiePopup, setShowRookieUnlockPopup, setHasShownRookiePopup]);

  // Day-rollover check. A 30s cadence is plenty (the reset just needs to land
  // shortly after midnight) and avoids the old 1s ticker that re-rendered the
  // whole app every second for a countdown string nothing displayed.
  useEffect(() => {
    const checkRollover = () => {
      if (new Date().toDateString() !== gameState.lastResetDate) {
        performDailyReset();
      }
    };

    checkRollover();
    const interval = setInterval(checkRollover, 30000);
    return () => clearInterval(interval);
  }, [gameState.lastResetDate, performDailyReset]);
}
