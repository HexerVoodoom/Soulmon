import { useState, useEffect, useCallback } from 'react';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { getNextEvolution } from '../utils/dailyReset';

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
  eggType?: 'tapirmon' | 'veemon' | 'salamon';
  unlockedEvolutions: string[];
  currentBranch: 'virus' | 'data' | 'vaccine';
  maxActivityCap: number;
  lastResetDate: string;
  attributesSinceLastEvolution: { virus: number; data: number; vaccine: number };
  poopEventsShown: number[];
  poopEventsCompleted: number[];
  careHPLostToday: number;
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

      // HP penalty: proportional to the tasks NOT done. If the pet completed
      // 30% of the tasks it had, it neglected 70% → loses floor(70% of hearts).
      // Hearts are always lost in whole units (floor); only "carinho" restores
      // half a heart at a time. No tasks available → nothing to fail → no loss.
      const totalTasks = availableActivities.length + prev.tasks.length;
      const completionRatio = totalTasks > 0 ? dailyDone / totalTasks : 1;
      const heartsLost = Math.floor((1 - completionRatio) * prev.maxHealthPoints);
      if (heartsLost > 0) {
        newHP = Math.max(0, prev.healthPoints - heartsLost);
      }

      // Care penalty: poop that appeared but was never cleaned costs HP at the
      // day turn. Sleeping all night means no poop appeared → nothing missed →
      // no penalty. Capped (together with the day's food losses) at half max HP.
      const careMaxHP = prev.maxHealthPoints;
      const careDailyCap = Math.floor(careMaxHP / 2);
      const poopPenaltyEach = careMaxHP >= 3 ? 2 : 1;
      const poopShown = prev.poopEventsShown || [];
      const poopDone = prev.poopEventsCompleted || [];
      const missedPoops = poopShown.filter((i: number) => !poopDone.includes(i)).length;
      const remainingCareCap = Math.max(0, careDailyCap - (prev.careHPLostToday ?? 0));
      const poopDamage = Math.min(missedPoops * poopPenaltyEach, remainingCareCap);
      if (poopDamage > 0) {
        newHP = Math.max(0, newHP - poopDamage);
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

        const isBabyII = ['pukamon', 'chibimon', 'nyaromon'].includes(prev.evolutionStage);
        newEvolutionStage = getNextEvolution(
          prev.evolutionStage,
          prev.eggType ?? 'tapirmon',
          branch,
          prev.unlockedEvolutions,
        );
        if (isBabyII && !hasShownRookiePopup) {
          setShowRookieUnlockPopup(true);
          setHasShownRookiePopup(true);
          localStorage.setItem(STORAGE_KEYS.ROOKIE_POPUP_SHOWN, 'true');
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
        foodEventsScheduled: [],
        poopEventsCompleted: [],
        foodEventsCompleted: [],
        poopEventsShown: [],
        currentBranch: newCurrentBranch,
        unlockedEvolutions: finalUnlockedEvolutions,
        degeneratedByHP: wasDegeneratedByHP,
        lastDayWasPerfect: dayWasPerfect,
        maxActivityCap: newMaxActivityCap,
        attributesSinceLastEvolution: newRecentAttrs,
        careHPLostToday: 0,
        energyPoints: 0, // Energy resets daily; shower requires re-feeding each day
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
