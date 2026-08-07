import { useEffect, useCallback } from 'react';
import { computeDailyReset } from '../utils/dailyReset';

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
  unlockedEvolutions: string[];
  currentBranch: 'virus' | 'data' | 'vaccine';
  maxActivityCap: number;
  lastResetDate: string;
  attributesSinceLastEvolution: { virus: number; data: number; vaccine: number };
  poopEventsShown: number[];
  poopEventsCompleted: number[];
}

interface UseDailyResetProps {
  gameState: ResetGameState;
  setGameState: (fn: (prev: any) => any) => void;
}

export function useDailyReset({
  gameState,
  setGameState,
}: UseDailyResetProps) {
  // A regra da virada vive em utils/dailyReset.ts (computeDailyReset), que é
  // função pura e é O MESMO código que o teste importa. Não reimplemente a
  // lógica aqui — foi assim que o teste antigo passou a testar uma cópia.
  const performDailyReset = useCallback(() => {
    setGameState(prev => computeDailyReset(prev));
  }, [setGameState]);

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
