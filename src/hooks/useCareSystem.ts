import { useEffect } from 'react';
import { CareEvent, getCareMessage } from '../components/CareSystem';

interface Activity {
  steps: { completed: boolean }[];
}

interface CareGameState {
  activities: Activity[];
  lastResetDate: string;
  poopEventScheduled: number | null;
  poopEventCompleted: boolean;
  foodEventsScheduled: number[];
  foodEventsCompleted: number[];
}

interface UseCareSystemProps {
  gameState: CareGameState;
  careEvent: CareEvent | null;
  setCareEvent: (event: CareEvent | null) => void;
  setMessageTrigger: (fn: (prev: number) => number) => void;
  setGameState: (fn: (prev: any) => any) => void;
}

export function useCareSystem({
  gameState,
  careEvent,
  setCareEvent,
  setMessageTrigger,
  setGameState,
}: UseCareSystemProps) {
  // Schedule poop and food events
  useEffect(() => {
    const allSteps = gameState.activities.flatMap(a => a.steps);
    const hasIncompleteTasks = allSteps.some(s => !s.completed);
    if (!hasIncompleteTasks) return;

    if (gameState.lastResetDate !== new Date().toDateString()) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();

    if (!gameState.poopEventScheduled && !gameState.poopEventCompleted) {
      const poopHour = 8 + Math.random() * 12;
      setGameState(prev => ({ ...prev, poopEventScheduled: startOfDay + poopHour * 3600000 }));
    }

    if (!gameState.foodEventsScheduled || gameState.foodEventsScheduled.length === 0) {
      const firstFoodHour = 8 + Math.random() * 6;
      const secondFoodHour = 14 + Math.random() * 6;
      setGameState(prev => ({
        ...prev,
        foodEventsScheduled: [
          startOfDay + firstFoodHour * 3600000,
          startOfDay + secondFoodHour * 3600000,
        ],
      }));
    }
  }, [gameState.lastResetDate, gameState.poopEventCompleted, gameState.foodEventsScheduled]);

  // Check care events and trigger them
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const allSteps = gameState.activities.flatMap(a => a.steps);
      if (!allSteps.some(s => !s.completed)) return;

      // Poop event
      if (gameState.poopEventScheduled && !gameState.poopEventCompleted && !careEvent) {
        const elapsed = now - gameState.poopEventScheduled;
        if (elapsed >= 0 && elapsed < 5 * 60000) {
          if (!careEvent || (careEvent as CareEvent).type !== 'poop') {
            setCareEvent({ type: 'poop', requestTime: gameState.poopEventScheduled, showSprite: false });
            setMessageTrigger(prev => prev + 1);
          }
        } else if (elapsed >= 5 * 60000) {
          setCareEvent({ type: 'poop', requestTime: gameState.poopEventScheduled, showSprite: true });
        }
      }

      // Food events
      if (gameState.foodEventsScheduled && gameState.foodEventsCompleted) {
        gameState.foodEventsScheduled.forEach((foodTime, index) => {
          if (gameState.foodEventsCompleted.includes(index) || careEvent) return;

          const elapsed = now - foodTime;

          if (elapsed >= 0 && elapsed < 5 * 60000) {
            if (!careEvent || (careEvent as CareEvent).type !== 'food') {
              setCareEvent({ type: 'food', requestTime: foodTime, showSprite: false });
              setMessageTrigger(prev => prev + 1);
            }
          } else if (elapsed >= 5 * 60000 && elapsed < 6 * 60000) {
            setCareEvent({ type: 'food', requestTime: foodTime, showSprite: true });
            setGameState(prev => ({
              ...prev,
              healthPoints: Math.max(0, prev.healthPoints - 2),
              foodEventsCompleted: [...(prev.foodEventsCompleted || []), index],
            }));
          }
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [
    gameState.poopEventScheduled,
    gameState.foodEventsScheduled,
    gameState.poopEventCompleted,
    gameState.foodEventsCompleted,
    careEvent,
  ]);

  const getCompanionMessageWithCare = (fallbackMessage: string): string => {
    if (careEvent && !careEvent.showSprite) {
      return getCareMessage(careEvent.type);
    }
    return fallbackMessage;
  };

  return { getCompanionMessageWithCare };
}
