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
  powerPoints: number;
  harmonyPoints: number;
  benevolencePoints: number;
  evolutionStage: string;
  unlockedEvolutions: string[];
  currentBranch: 'power' | 'harmony' | 'benevolence';
  maxActivityCap: number;
  lastResetDate: string;
  attributesSinceLastEvolution: { power: number; harmony: number; benevolence: number };
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
      if (rolloverPendingFor(gameState.lastResetDate)) {
        performDailyReset();
      }
    };

    checkRollover();
    const interval = setInterval(checkRollover, 30000);
    return () => clearInterval(interval);
  }, [gameState.lastResetDate, performDailyReset]);

  // A VIRADA COMO SINAL, para quem precisa não agir durante ela.
  //
  // Achado X-7: a regra 3 do §3.3 da spec de geração incremental ("nunca durante
  // a virada do dia, o relatório, a cerimônia ou uma animação de cuidado") estava
  // declarada e não implementada — o `busy` do `useSpriteGeneration` cobria três
  // das quatro ocasiões, e o comentário no `App.tsx` dizia "as quatro".
  //
  // Devolvido daqui em vez de recalculado no `App.tsx` de propósito: o aviso no
  // topo deste arquivo ("não reimplemente a lógica aqui — foi assim que o teste
  // antigo passou a testar uma cópia") vale para fora também. Uma dona só.
  //
  // É `true` na janela entre a meia-noite civil e o commit do `computeDailyReset`
  // — no máximo os 30s da cadência, mais o tempo do próprio setState.
  return { rolloverPending: rolloverPendingFor(gameState.lastResetDate) };
}

/**
 * A pergunta da virada, num lugar só: o dia de hoje já é outro em relação ao
 * último reset commitado?
 */
export function rolloverPendingFor(lastResetDate: string | undefined): boolean {
  return new Date().toDateString() !== lastResetDate;
}
